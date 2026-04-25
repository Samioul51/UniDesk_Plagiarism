# UniDesk Plagiarism Detection

A specialized microservice for UniDesk, designed to handle plagiarism detection across multiple sources. Built with Node.js, Express, PostgreSQL and integration with online search APIs.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Plagiarism Detection Logic](#plagiarism-detection-logic)
- [Testing](#testing)

---

## Overview

UniDesk Plagiarism serves as the plagiarism analysis engine for the UniDesk platform. It allows faculty and students to verify the originality of their work by comparing documents against:

- **Internal Comparison**: Compares multiple uploaded files against each other to detect cross-copying.
- **Academic Repository**: Checks against a centralized PostgreSQL database of previously submitted and stored documents.
- **Web Sources**: Performs real-time online searches using the Serper API (Google Search) to identify matching content across the internet.

The service supports extracting text from both **PDF** and **DOCX** formats and provides detailed similarity reports.

---

## Tech Stack

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Runtime          | Node.js                           |
| Framework        | Express.js                        |
| Database         | PostgreSQL (Neon Serverless)      |
| Token Service    | Firebase Admin SDK                |
| Document Parsing | PDF-parse, Mammoth                |
| Online Search    | Serper API (via Axios & Cheerio)  |
| File Handling    | Multer                            |
| Testing          | Jest, Supertest                   |

---

## Project Structure

```
UniDesk_Plagiarism/
├── src/
│   ├── index.js                  # Entry point, HTTP server
│   ├── app.js                    # Express app, middleware, route mounting
│   ├── config/
│   │   └── db/                   # PostgreSQL connection (Neon)
│   ├── controller/               # Business logic for plagiarism checks
│   ├── routes/                   # API route definitions
│   ├── services/                 # Core logic services
│   │   ├── chunkText.js          # Text segmentation logic
│   │   ├── extractText.js        # PDF/DOCX text extraction
│   │   ├── internalCheck.js      # Cross-file comparison logic
│   │   ├── onlineSearch.js       # Serper API integration & web scraping
│   │   ├── repositoryCheck.js    # DB-based plagiarism check
│   │   └── saveToRepository.js   # Storing documents for future checks
│   ├── middlewares/
│   │   ├── auth/                 # Firebase token verification
│   │   └── upload/               # Multer file upload configuration
│   └── utils/                    # Helper utilities
├── tests/
│   ├── unit/                     # Unit tests for services and controllers
│   └── integration/              # API endpoint integration tests
├── .env                          # Environment variables
├── unideskFBAdmin.json           # Firebase Admin credentials
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PORT=3000

# PostgreSQL Connection String (Neon)
DATABASE_URL=your_postgresql_connection_string

# Serper API Key for Online Search
SERPER_API_KEY=your_serper_api_key
```

Firebase Admin credentials should be placed in `unideskFBAdmin.json` in the root directory.

---

## Getting Started

**Prerequisites:** Node.js >= 18, a PostgreSQL database (Neon recommended), a Firebase project, and a Serper API key.

```bash
# 1. Clone the repository
git clone https://github.com/Samioul51/UniDesk_Plagiarism.git
cd UniDesk_Plagiarism

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env file and add your DATABASE_URL and SERPER_API_KEY

# 4. Start the development server
npm run dev

# 5. For production
npm start
```

---

## Authentication

All plagiarism check requests must be authenticated using Firebase.

1. **`verifyFirebaseToken`** — Validates the Firebase ID token sent in the `Authorization` header as a Bearer token.

```
Authorization: Bearer <firebase_id_token>
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Plagiarism Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/check` | Upload files and perform a comprehensive plagiarism check. |

**Request Body (Multipart/Form-Data):**
- `files`: One or more files (PDF or DOCX). Max 5 files.
- `storeInRepository`: (Boolean) Whether to save these documents into the academic repository for future comparisons.

---

## Plagiarism Detection Logic

1. **Text Extraction**: The service uses `pdf-parse` for PDF files and `mammoth` for DOCX files to extract raw text.
2. **Chunking**: Extracted text is broken down into manageable chunks to perform granular comparisons.
3. **Internal Check**: Every uploaded file is compared against every other file in the same request to find internal similarities.
4. **Repository Check**: Chunks are hashed or queried against the PostgreSQL database to find matches with previously submitted work.
5. **Online Check**: Significant chunks are sent to the Serper API to find matching snippets on the web. Matches are then scraped using `cheerio` for deeper analysis.

---

## Testing

The project uses Jest for both unit and integration testing.

**Run Tests:**

```bash
# Run all tests
npm test

# Run tests with coverage
# (Configure in package.json if needed)
```
