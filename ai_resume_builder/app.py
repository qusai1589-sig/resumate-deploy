import logging
import json
import os
import uuid
from pathlib import Path
from urllib.parse import quote

import httpx
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from ai_extraction import extract_fields, generate_resume_summary
from ocr_engine import run_ocr
from resume_mapping import resume_data, MAPPING_VERSION, combine_resume_data


load_dotenv(Path(__file__).resolve().parent.parent / ".env")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

UPLOAD_FOLDER = Path(__file__).parent / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

MAX_FILES = 5
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB per file

app = FastAPI(
    title="AI Resume Builder",
    description="AI-powered document extraction and resume builder",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Content-Disposition"],
)

@app.get("/auth/config")
async def auth_config():
    # Only the public anon key is safe for the browser. Never return server keys.
    return {"url": SUPABASE_URL, "anon_key": SUPABASE_ANON_KEY}

bearer_scheme = HTTPBearer(auto_error=False)


class AccountRequest(BaseModel):
    email: str
    password: str
    full_name: str = Field(default="", max_length=120)


def public_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }


def user_headers(token: str) -> dict[str, str]:
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
    }


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Login required")

    token = credentials.credentials

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers=user_headers(token),
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    account = response.json()
    if not account.get("id"):
        raise HTTPException(status_code=401, detail="Invalid user")

    return {"id": account["id"], "token": token}


def detect_file_type(filename: str, contents: bytes):
    """Accept supported extensions only when the file signature matches."""
    extension = Path(filename).suffix.lower()

    if extension == ".pdf" and contents.startswith(b"%PDF-"):
        return ".pdf", "application/pdf"

    if extension == ".png" and contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png", "image/png"

    if extension in (".jpg", ".jpeg") and contents.startswith(b"\xff\xd8\xff"):
        return extension, "image/jpeg"

    if (
        extension == ".webp"
        and contents.startswith(b"RIFF")
        and contents[8:12] == b"WEBP"
    ):
        return ".webp", "image/webp"

    return None


@app.get("/")
async def home():
    return {
        "message": "AI Resume Builder API is running!",
        "status": "online",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "message": "Backend is working",
    }


@app.post("/signup")
async def signup(data: AccountRequest):
    email = data.email.strip()

    if not email or len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Enter an email and a password of at least 8 characters",
        )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/signup",
                headers=public_headers(),
                json={"email": email, "password": data.password, "data": {"full_name": data.full_name.strip()}},
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Signup service unavailable",
        )

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=400,
            detail="Signup failed. Check the email and password.",
        )

    result = response.json()
    return {"message": "Account created. Check your email if confirmation is enabled.",
            "access_token": result.get("access_token"), "refresh_token": result.get("refresh_token"),
            "expires_in": result.get("expires_in"), "user": result.get("user")}


@app.post("/login")
async def login(data: AccountRequest):
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token",
                params={"grant_type": "password"},
                headers=public_headers(),
                json={
                    "email": data.email.strip(),
                    "password": data.password,
                },
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Login service unavailable",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials or unconfirmed email",
        )

    result = response.json()

    return {
        "message": "Login successful",
        "user_id": result["user"]["id"],
        "email": result["user"]["email"],
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "expires_in": result["expires_in"],
        "user": result["user"],
        "token_type": "bearer",
    }


@app.post("/upload")
async def upload_files(
    files: list[UploadFile] = File(...),
    user: dict = Depends(current_user),
):
    if not 1 <= len(files) <= MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Upload between 1 and {MAX_FILES} files",
        )

    results = []

    for file in files:
        original_name = Path(file.filename or "").name
        local_path = None

        try:
            if not original_name:
                raise ValueError("File name is required")

            contents = await file.read(MAX_FILE_BYTES + 1)

            if not contents:
                raise ValueError("File is empty")

            if len(contents) > MAX_FILE_BYTES:
                raise ValueError("File exceeds the 10 MB limit")

            detected = detect_file_type(original_name, contents)
            if detected is None:
                raise ValueError(
                    "Only valid PDF, PNG, JPG, JPEG, and WebP files are allowed"
                )

            extension, mime_type = detected
            stored_name = f"{uuid.uuid4().hex}{extension}"
            storage_path = f"{user['id']}/{stored_name}"

            local_path = UPLOAD_FOLDER / stored_name
            local_path.write_bytes(contents)

            ocr_results = await run_in_threadpool(run_ocr, str(local_path))

            extracted_text = "\n".join(
                line.get("text", "")
                for line in ocr_results
                if line.get("text")
            )

            if not extracted_text.strip():
                raise ValueError("No readable text found. Try a clearer document.")

            structured_data = await run_in_threadpool(extract_fields, extracted_text)
            resume_summary = await run_in_threadpool(generate_resume_summary, structured_data)

            async with httpx.AsyncClient(timeout=60) as client:
                storage_response = await client.post(
                    (
                        f"{SUPABASE_URL}/storage/v1/object/"
                        f"uploads/{quote(storage_path, safe='/')}"
                    ),
                    headers={
                        **user_headers(user["token"]),
                        "Content-Type": mime_type,
                    },
                    content=contents,
                )

            if storage_response.status_code not in (200, 201):
                logger.error(
                    "Storage upload failed with status %s",
                    storage_response.status_code,
                )
                raise RuntimeError("Storage upload failed")

            document_data = {
                "user_id": user["id"],
                "document_type": structured_data.get(
                    "document_type", "Unknown"
                ),
                "file_name": original_name,
                "file_path": storage_path,
                "file_size_bytes": len(contents),
                "mime_type": mime_type,
                "status": "processed",
            }

            async with httpx.AsyncClient(timeout=20) as client:
                database_response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/documents",
                    headers={
                        **user_headers(user["token"]),
                        "Content-Type": "application/json",
                        "Prefer": "return=representation",
                    },
                    json=document_data,
                )

            if database_response.status_code not in (200, 201, 204):
                logger.error(
                    "Document insert failed with status %s",
                    database_response.status_code,
                )
                # Do not leave an orphaned private object when the metadata insert fails.
                try:
                    async with httpx.AsyncClient(timeout=20) as client:
                        await client.request(
                            "DELETE",
                            f"{SUPABASE_URL}/storage/v1/object/uploads",
                            headers=user_headers(user["token"]),
                            json={"prefixes": [storage_path]},
                        )
                except httpx.HTTPError:
                    logger.error("Storage cleanup unavailable after document insert failure")
                raise RuntimeError("Document insert failed")

            inserted = database_response.json() if database_response.content else []
            document = inserted[0] if isinstance(inserted, list) and inserted else None
            extraction = {
                "mapping_version": MAPPING_VERSION,
                "structured_data": structured_data,
                "resume_data": resume_data(structured_data),
                "resume_summary": resume_summary,
            }
            await cache_extraction(storage_path, extraction, user)
            results.append({
                "mapping_version": MAPPING_VERSION,
                "document": document,
                "document_id": document.get("id") if document else None,
                "resume_data": extraction["resume_data"],
                "success": True,
                "filename": original_name,
                "stored_filename": stored_name,
                "storage_path": storage_path,
                "user_id": user["id"],
                "ocr_results": ocr_results,
                "extracted_text": extracted_text,
                "structured_data": structured_data,
                "resume_summary": resume_summary,
                "database_saved": True,
            })

        except ValueError as error:
            results.append({
                "success": False,
                "filename": original_name,
                "error": str(error),
            })
        except Exception as error:
            logger.error(
                "Processing failed for a file: %s",
                type(error).__name__,
            )
            results.append({
                "success": False,
                "filename": original_name,
                "error": "Processing failed",
            })
        finally:
            await file.close()
            if local_path is not None:
                local_path.unlink(missing_ok=True)

    successful = sum(item["success"] for item in results)

    return {
        "success": successful > 0,
        "message": "File processing completed",
        "total_files": len(results),
        "successful_files": successful,
        "failed_files": len(results) - successful,
        "results": results,
    }


@app.get("/documents")
async def list_documents(user: dict = Depends(current_user)):
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/documents",
                headers=user_headers(user["token"]),
                params={
                    "select": (
                        "id,user_id,document_type,file_name,file_path,"
                        "file_size_bytes,mime_type,status,uploaded_at"
                    ),
                    "user_id": f"eq.{user['id']}",
                    "order": "uploaded_at.desc",
                },
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Document list unavailable",
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Document list failed")

    return {"documents": response.json()}


async def owned_document(document_id: uuid.UUID, user: dict, client) -> dict:
    response = await client.get(
        f"{SUPABASE_URL}/rest/v1/documents", headers=user_headers(user["token"]),
        params={"select": "file_name,file_path,mime_type", "id": f"eq.{document_id}",
                "user_id": f"eq.{user['id']}", "limit": "1"},
    )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Document lookup failed")
    records = response.json()
    if not records or not records[0]["file_path"].startswith(f"{user['id']}/"):
        raise HTTPException(status_code=404, detail="Document not found")
    return records[0]


def private_object_url(storage_path):
    return f"{SUPABASE_URL}/storage/v1/object/authenticated/uploads/{quote(storage_path, safe='/')}"


async def cache_extraction(storage_path: str, extraction: dict, user: dict):
    # Same private owner folder; no database migration or public object URL required.
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{SUPABASE_URL}/storage/v1/object/uploads/{quote(storage_path + '.extraction.json', safe='/')}",
                headers={**user_headers(user["token"]), "Content-Type": "application/json", "x-upsert": "true"},
                content=json.dumps(extraction).encode(),
            )
        if response.status_code not in (200, 201):
            logger.warning("Extraction cache write failed with status %s; original retained", response.status_code)
    except httpx.HTTPError:
        logger.warning("Extraction cache unavailable; original retained")


@app.get("/documents/{document_id}/file")
async def download_document(document_id: uuid.UUID, user: dict = Depends(current_user)):
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            record = await owned_document(document_id, user, client)
            response = await client.get(private_object_url(record["file_path"]), headers=user_headers(user["token"]))
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Download unavailable")
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=response.content, media_type=record["mime_type"] or "application/octet-stream",
                    headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(record['file_name'], safe='')}"})


@app.post("/documents/{document_id}/extraction")
async def document_extraction(document_id: uuid.UUID, user: dict = Depends(current_user)):
    """Return retained facts, or process an older document on first use."""
    local_path = None
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            record = await owned_document(document_id, user, client)
            cached = await client.get(private_object_url(record["file_path"] + '.extraction.json'), headers=user_headers(user["token"]))
            if cached.status_code == 200:
                extraction = cached.json()
                if isinstance(extraction, dict) and extraction.get("mapping_version") == MAPPING_VERSION and isinstance(extraction.get("resume_data"), dict):
                    extraction["resume_data"] = resume_data(extraction.get("structured_data") or {"resume_data": extraction["resume_data"]})
                    return extraction
            elif cached.status_code not in (400, 404):
                raise HTTPException(status_code=502, detail="Document analysis unavailable")
            original = await client.get(private_object_url(record["file_path"]), headers=user_headers(user["token"]))
        if original.status_code != 200:
            raise HTTPException(status_code=404, detail="File not found")
        if len(original.content) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="Document exceeds the 10 MB limit")
        detected = detect_file_type(record["file_name"], original.content)
        if detected is None:
            raise HTTPException(status_code=400, detail="Unsupported document format")
        local_path = UPLOAD_FOLDER / f"{uuid.uuid4().hex}{detected[0]}"
        local_path.write_bytes(original.content)
        ocr_results = await run_in_threadpool(run_ocr, str(local_path))
        extracted_text = "\n".join(line.get("text", "") for line in ocr_results if line.get("text"))
        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="No readable text found. Try a clearer document.")
        structured = await run_in_threadpool(extract_fields, extracted_text)
        summary = await run_in_threadpool(generate_resume_summary, structured)
        extraction = {"mapping_version": MAPPING_VERSION, "structured_data": structured, "resume_data": resume_data(structured), "resume_summary": summary}
        await cache_extraction(record["file_path"], extraction, user)
        return extraction
    except HTTPException:
        raise
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Document analysis unavailable")
    except Exception as error:
        logger.error("Document analysis failed: %s", type(error).__name__)
        raise HTTPException(status_code=502, detail="Could not extract document information. Please try again.")
    finally:
        if local_path is not None:
            local_path.unlink(missing_ok=True)


class CombinedDocumentsRequest(BaseModel):
    document_ids: list[uuid.UUID] = Field(min_length=2, max_length=5)


@app.post("/documents/combine")
async def combine_documents(data: CombinedDocumentsRequest, user: dict = Depends(current_user)):
    ids = list(dict.fromkeys(data.document_ids))
    if len(ids) != len(data.document_ids):
        raise HTTPException(status_code=400, detail="Select different documents to combine")
    # Verify every owner before starting any expensive OCR/AI work.
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            for document_id in ids:
                await owned_document(document_id, user, client)
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Document lookup unavailable")
    extractions = [await document_extraction(document_id, user) for document_id in ids]
    try:
        combined = combine_resume_data([item["resume_data"] for item in extractions])
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))
    try:
        summary = await run_in_threadpool(generate_resume_summary, combined)
    except Exception as error:
        logger.error("Combined summary failed: %s", type(error).__name__)
        raise HTTPException(status_code=502, detail="Could not generate the combined summary. Please try again.")
    if not isinstance(summary, str) or not summary.strip():
        raise HTTPException(status_code=503, detail="AI summary is unavailable. Please try again.")
    combined["summary"] = summary.strip()
    return {"id": "combined:" + ",".join(sorted(str(item) for item in ids)),
            "source_document_ids": [str(item) for item in ids], "resume_data": combined,
            "resume_summary": summary.strip(), "mapping_version": MAPPING_VERSION}


def custom_openapi():
    """Tell Swagger UI that each item in files is a binary upload."""
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    body_schema = (
        schema["paths"]["/upload"]["post"]["requestBody"]
        ["content"]["multipart/form-data"]["schema"]
    )

    if "$ref" in body_schema:
        schema_name = body_schema["$ref"].split("/")[-1]
        body_schema = schema["components"]["schemas"][schema_name]

    body_schema["properties"]["files"]["type"] = "array"
    body_schema["properties"]["files"]["items"] = {
        "type": "string",
        "format": "binary",
    }

    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi
