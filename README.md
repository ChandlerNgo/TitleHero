# TitleHero - AI-Powered Title Examination Platform

TitleHero modernizes the title examination workflow by automating document ingestion, OCR, metadata extraction, indexing, and search. The platform was built for Bluebonnet Title & Abstract LLC to replace manual review with a fast, accurate, cloud-powered solution that keeps title professionals focused on analysis instead of paperwork.

## Table of Contents
- [Overview](#overview)
- [Requirements](#requirements)
- [Tech Stack](#tech-stack)
- [External Dependencies](#external-dependencies)
- [Configuration](#configuration)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)
- [Usage](#usage)
- [Features](#features)
- [Documentation](#documentation)
- [Team & Sponsor](#team--sponsor)
- [License](#license)
- [Third-Party Libraries](#third-party-libraries)
- [Contact](#contact)

## Overview
TitleHero ingests scanned packets, performs multi-page OCR, stores artifacts in S3, indexes records in MySQL, and exposes a React dashboard for search and review. Built as a capstone project for Texas A&M University, the system streamlines locating, organizing, and verifying property records and can be deployed to AWS with minimal manual intervention.

## Requirements
- OS: macOS, Windows, or Ubuntu
- Node.js v18+
- npm v9+
- MySQL v8.0+ (AWS RDS in production)
- AWS account (EC2, S3, RDS, Secrets Manager, VPC)
- Postman for API testing

## Tech Stack
### Backend
- Node.js + Express
- MySQL2
- Sharp (TIFF -> PNG conversion)
- AWS SDK
- Multer
- JSON Web Tokens

### Frontend
- React (Vite + TypeScript)
- Axios
- TailwindCSS

### Tooling
- Git & GitHub
- AWS CLI
- VS Code
- GitHub Actions (optional CI/CD)
- Postman

## External Dependencies
TitleHero depends on the following platform tools:
- Git - https://git-scm.com
- Node.js - https://nodejs.org
- MySQL - https://dev.mysql.com/downloads
- AWS CLI - https://aws.amazon.com/cli
- Postman - https://www.postman.com/downloads

## Configuration
Both the backend and frontend require environment variables for secure operation.
The values for the environment variables are found on AWS secrets manager. 

### Backend `.env`
```bash
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

S3_BUCKET_NAME=

OPENAI_API_KEY=
OPENAI_MODEL=title_packet
```

### Frontend `.env`
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### Production Secrets
All production secrets (database credentials, OpenAI API keys, and S3 configuration) live in AWS Secrets Manager. Rotate them regularly and limit IAM access to least privilege.

## Installation & Setup
1. Clone the repository and install dependencies for both workspaces.
   ```bash
   npm install          # in /server
   npm install          # in /client
   ```
2. Configure the `.env` files described above.
3. Ensure MySQL is running and migrated with the required schema.
4. Start the backend and frontend.
   ```bash
   npm run dev          # server
   npm run dev          # client
   ```

## Deployment
1. Provision AWS infrastructure (EC2, S3, RDS, Secrets Manager, and VPC networking).
2. Configure CI/CD (GitHub Actions or manual scripts) to build the client and deploy the server.
3. Sync environment variables with AWS Secrets Manager and inject them into the runtime.
4. Point DNS or load balancers to the deployed frontend and API.

## Usage
1. **Upload Source Documents** - Drop TIFF, PDF, or image bundles. Sharp converts TIFFs to PNGs and the OCR pipeline processes multi-page documents.
2. **Search Title Records** - Filter by grantor, grantee, abstract code, subdivision, instrument number, book/page, or filing date.
3. **Review Results** - See document metadata, filing details, and links to S3 artifacts directly from the dashboard.
4. **Inspect OCR Output** - Each document stores extracted text, parsed metadata, and any pipeline errors to aid troubleshooting.

## Features
### AI-Powered OCR Pipeline
- Multi-format ingestion with TIFF -> PNG conversion
- Multi-page handling with error tracking
- OpenAI-powered parsing and metadata extraction

### Search & Indexing System
- MySQL schema optimized for fast lookup
- Normalized lookup tables for clean data
- Instant filtering in the React dashboard

### Cloud-Native Architecture
- S3 for durable file storage
- RDS for relational data
- EC2-hosted backend with Secrets Manager integration

### Structured React Frontend
- Responsive UI styled with TailwindCSS
- Real-time table filtering and optional pagination
- Direct links to OCR artifacts and images

### Error Handling & Logging
- Backend logs capture OCR failures
- Per-page conversion diagnostics
- Upload tracking for every pipeline step

## Documentation
Final Capstone Report (Texas A&M CSCE 482, Spring 2025) available in Teams Folder. Additional architectural notes, ERDs, or sequence diagrams are all in the Final Capstone Report. 

## Team & Sponsor
- Dhruv Halderia
- Casey Sorsdal
- Julia Simko
- Chandler Ngo

**Sponsor:** Bluebonnet Title & Abstract LLC (special thanks to Shane, Bobbye, and the Bluebonnet staff for testing, feedback, and real-world guidance).

## License
This project is private and was developed exclusively for Bluebonnet Title & Abstract LLC under the Texas A&M University Capstone Program. License terms can be added once finalized with the sponsor.

## Third-Party Libraries
- Frontend: React, TailwindCSS, Axios
- Backend: Express, MySQL2, Sharp, AWS SDK, Multer
- AI/OCR: OpenAI API
- Dev Tooling: Nodemon, PM2, Vite

## Contact
For project questions, please reach out to Shane or Bobbye at Bluebonnet Title & Abstract LLC.

Repository: https://github.com/ChandlerNgo/TitleHero
