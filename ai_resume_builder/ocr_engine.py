from paddleocr import PaddleOCR
import re
import os
import subprocess
import tempfile
import shutil


# Below this confidence score, a line gets flagged for manual review
CONFIDENCE_THRESHOLD = 0.90


# Load the OCR model ONCE when this file is imported.
# This prevents the model from loading again for every upload.
ocr = PaddleOCR(
    use_textline_orientation=True,
    lang="en",
    enable_mkldnn=False
)


def clean_number(text):
    """
    Fix comma-as-decimal-point OCR misreads.
    Example:
        24,76 -> 24.76
    """
    stripped = text.strip()

    if re.match(r"^\d+[,.]\d+$", stripped):
        return stripped.replace(",", ".")

    return text


def run_ocr_on_image(image_path: str):
    """
    Runs PaddleOCR on a single image and returns
    one dictionary per detected text line.
    """

    result = ocr.predict(image_path)

    lines = []

    for res in result:
        texts = res.get("rec_texts", [])
        scores = res.get("rec_scores", [])

        for text, score in zip(texts, scores):

            cleaned = clean_number(text)

            lines.append({
                "text": cleaned,
                "confidence": round(float(score), 2),
                "needs_review": float(score) < CONFIDENCE_THRESHOLD
            })

    return lines


def pdf_to_images(pdf_path: str):
    """
    Converts every page of a PDF into a PNG image.

    Returns:
        List of generated image paths.
    """

    temp_dir = tempfile.mkdtemp(prefix="pdf_ocr_")

    output_prefix = os.path.join(
        temp_dir,
        "page"
    )

    command = [
        "pdftoppm",
        "-png",
        "-r",
        "200",
        pdf_path,
        output_prefix
    ]

    try:
        subprocess.run(
            command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        images = []

        for filename in sorted(os.listdir(temp_dir)):

            if filename.lower().endswith(".png"):

                images.append(
                    os.path.join(
                        temp_dir,
                        filename
                    )
                )

        if not images:
            shutil.rmtree(temp_dir, ignore_errors=True)
        return images
    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise



def run_ocr(file_path: str):
    """
    Main OCR function.

    Supports:
        - PNG
        - JPG
        - JPEG
        - PDF

    For PDFs:
        1. Convert every page to PNG
        2. Run PaddleOCR on every page
        3. Combine all OCR results
    """

    extension = os.path.splitext(
        file_path
    )[1].lower()

    # -----------------------------------------
    # IMAGE
    # -----------------------------------------

    if extension in [".png", ".jpg", ".jpeg", ".webp"]:

        return run_ocr_on_image(file_path)


    # -----------------------------------------
    # PDF
    # -----------------------------------------

    if extension == ".pdf":

        print("PDF detected.")
        print("Converting PDF pages to images...")

        image_paths = pdf_to_images(file_path)

        print(
            f"PDF contains {len(image_paths)} page(s)."
        )

        try:
            all_lines = []

            for page_number, image_path in enumerate(
                image_paths,
                start=1
            ):

                print(
                    f"Running OCR on PDF page {page_number}..."
                )

                page_lines = run_ocr_on_image(
                    image_path
                )

                # Add page number so the frontend/backend
                # knows where each piece of text came from.
                for line in page_lines:

                    line["page"] = page_number

                    all_lines.append(line)

            return all_lines
        finally:
            if image_paths:
                shutil.rmtree(os.path.dirname(image_paths[0]), ignore_errors=True)



    # -----------------------------------------
    # UNSUPPORTED FILE
    # -----------------------------------------

    raise ValueError(
        f"Unsupported file type: {extension}"
    )
