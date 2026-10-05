# AI Resume Builder

## Project Overview

AI Resume Builder is an AI-powered document processing system designed to reduce the manual effort required to create resumes.

Instead of manually entering information from marksheets, certificates, internship documents, achievements, and other documents, the system allows users to upload their documents.

The backend processes the uploaded document using OCR and AI, extracts useful information into structured JSON, generates a professional resume summary, and stores the document and its metadata in Supabase.

---

## Current Pipeline

Document Upload
        ↓
FastAPI
        ↓
PaddleOCR
        ↓
AI Information Extraction
        ↓
Structured JSON
        ↓
Resume Summary
        ↓
Supabase Storage
        ↓
Supabase Database

---

## Technologies Used

- Python
- FastAPI
- PaddleOCR
- Gemini
- Groq
- OpenRouter
- Supabase PostgreSQL
- Supabase Storage
- Swagger / OpenAPI

---

## Current Features

- User login using Supabase Authentication
- Document upload through FastAPI
- OCR using PaddleOCR
- AI-powered document understanding
- Dynamic information extraction
- Document type identification
- Structured JSON output
- AI-generated resume summary
- Supabase Storage integration
- Supabase database integration
- Document metadata storage

---

## Supported Document Types

The extraction system is designed to work with different types of documents, including:

- Mark sheets
- Score cards
- Certificates
- Internship certificates
- Course certificates
- Achievement certificates
- Project documents
- Letters of Recommendation
- Other academic and professional documents

The AI dynamically identifies useful information instead of relying on a fixed document format.

---

## Backend Structure

```text
ai_resume_builder/
│
├── app.py
├── ai_extraction.py
├── ocr_engine.py
├── supabase_client.py
├── requirements.txt
├── .env.example
├── README.md
│
└── uploads/
