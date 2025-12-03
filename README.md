**TitleHero – AI-Powered Title Examination Platform**

TitleHero is an intelligent document-processing system designed to modernize and streamline the title examination workflow for title companies. The platform automates document ingestion, OCR, metadata extraction, indexing, and searching—dramatically reducing the time required to locate, organize, and verify property records.

Built for Bluebonnet Title & Abstract LLC, TitleHero replaces outdated manual processes with a fast, accurate, cloud-powered solution.

**Table of Contents**
- Project Title and Description
- Requirements
- External Dependencies
- Environment Variables / Configuration
- Installation & Setup
- Deployment
- Usage
- Features
- Documentation
- Credits & Acknowledgments
- License
- Third-Party Libraries
- Contact Information
- Requirements

TitleHero has been developed and tested with the following stack.

**Environment**

OS: macOS / Windows / Ubuntu

Node.js v18+

npm v9+

MySQL v8.0+ (AWS RDS in production)

AWS (EC2, S3, RDS, Secrets Manager, VPC)

Postman (API Testing)

**Backend**

Express.js

MySQL2

Sharp (for TIFF → PNG conversion)

AWS SDK

Multer

JSON Web Tokens (JWT) / Cognito integration (depending on deployment)

Frontend

React

TypeScript

Vite

Axios

TailwindCSS

Tools

Git & GitHub

AWS CLI

VSCode

GitHub Actions (optional CI/CD)

Postman for API testing

External Dependencies

**TitleHero relies on a few platform-level tools:**

Git – [https://git-scm.com](https://github.com/ChandlerNgo/TitleHero)

Node.js – https://nodejs.org

MySQL – https://dev.mysql.com/downloads/

AWS CLI – https://aws.amazon.com/cli/

Postman – https://www.postman.com/downloads/

Environment Variables / Configuration

Both backend and frontend require environment variables for secure operation.

Backend .env example
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

Frontend .env example
VITE_API_BASE_URL=http://localhost:3001

Production (AWS) Secrets

All secrets for production deployment are stored in AWS Secrets Manager, including:

Database credentials

OpenAI API key

S3 bucket configuration

Installation & Setup


**Deployment Steps:**



Usage

TitleHero provides a clean, easy-to-use workflow for title examiners:

**1. Upload Documents**

Users drag and drop TIFF/PDF files.
The backend automatically:

Converts pages

Runs OCR via OpenAI

Extracts metadata

Creates lookup tables (Grantor, Grantee, Abstract Code, etc.)

Stores files in S3

**2. Search by Any Field**

Search fields include:

Grantor

Grantee

Abstract Code

Subdivision

Instrument Number

Book/Page

Filing Date

**3. View Results Instantly**

The result table provides:

Document name

Filing details

Extracted metadata

Direct links to images stored in S3

**4. Review OCR Output**

Each uploaded document has an OCR record with:

Extracted text

Parsed metadata

Any pipeline errors for debugging

**Features**

AI-Powered OCR Pipeline
- TIFF → PNG conversion
- Multi-page handling
- Robust parsing using OpenAI models

Search & Indexing System
- MySQL schema optimized for fast queries
- Lookup tables for clean data normalization

Cloud-Native Architecture
- S3 for file storage
- RDS for relational data
- EC2 for backend
- Secure Secrets Manager integration

Structured React Frontend
- Responsive UI
- Real-time table filtering
- Pagination (optional)

Error Handling & Logging
- Backend logs for OCR failures
- Page-level conversion errors
- S3 upload tracking



Final Capstone Report

If these aren't created yet, I can generate them for you.



Team TitleHero (CSCE 482 – Spring 2025)

Dhruv Halderia

Casey Sorsdal

Julia Simko

Chandler Ngo

Sponsor

Bluebonnet Title & Abstract LLC

Special thanks to Shane, Bobbye, and the Bluebonnet staff for testing, feedback, and real-world guidance.

Technologies

AWS

OpenAI GPT Models

React

Node.js / Express

MySQL

Sharp

License

This project is private and developed exclusively for Bluebonnet Title & Abstract LLC under Texas A&M University’s Capstone Program.

License terms can be added depending on sponsor requirements.

Third-Party Libraries

Notable libraries include:

Frontend: React, CSS

Backend: Express, MySQL2, Sharp, AWS SDK, Multer

AI/OCR: OpenAI API

Dev Tools: Nodemon, PM2, Vite

Contact Information

For questions regarding this project:
Please reach out to Shane or Bobbye

Project Repository: [(insert GitHub link)](https://github.com/ChandlerNgo/TitleHero)
