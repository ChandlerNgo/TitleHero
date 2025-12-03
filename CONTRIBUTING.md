# Contributing to TitleHero

Thanks for your interest in improving TitleHero! This document describes how we collaborate, what we expect from code contributions, and how to run the project locally. Following these guidelines keeps the project stable and makes reviews smooth.

## Table of Contents
- [Project Expectations](#project-expectations)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Branching & Workflow](#branching--workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Requests](#pull-requests)
- [Security & Secrets](#security--secrets)
- [Questions](#questions)

## Project Expectations
TitleHero powers title examination workflows for Bluebonnet Title & Abstract LLC. Production deployments run on AWS (EC2, RDS, S3, Secrets Manager) with sensitive data. Treat every change as though it will be used in production:
- Keep the ingest/OCR pipeline stable and idempotent.
- Avoid breaking changes to database schemas without coordination.
- Document any infrastructure requirements that could impact deployments.

## Prerequisites
- Node.js 18+
- npm 9+
- MySQL 8+
- AWS CLI (for deployments or S3 testing)
- Access to the private Secrets Manager entries if you need production parity

## Development Setup
1. Install dependencies in both workspaces:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Create `.env` files based on the samples in `README.md`.
3. Start MySQL and apply the latest schema.
4. Run both apps:
   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```
5. Optionally configure AWS credentials (profile or environment variables) if you need to test uploads to S3.

## Branching & Workflow
- `main`: stable, deployable branch.
- Create feature branches from `main` using the format `feature/<short-description>` or `fix/<short-description>`.
- Rebase on `main` before opening a pull request to avoid merge commits.
- Keep each PR scoped to a single logical change set.

## Coding Standards
- **Backend**: follow existing Express conventions, use `async/await`, handle errors with centralized middleware, and log actionable context for OCR steps.
- **Frontend**: use TypeScript, prefer functional components with hooks, keep CSS modules or Tailwind utility classes co-located with components.
- **Style**: match existing formatting (Prettier defaults) and favor descriptive variable names over comments.
- **Database**: include migration scripts or SQL files for schema updates, and describe rollback steps.

## Testing
- Backend: add or update unit/integration tests (e.g., Jest or supertest) for routes, services, and conversion pipelines when possible.
- Frontend: cover new components with unit tests (React Testing Library) and basic state handling.
- Run linting if configured (`npm run lint` in each workspace).
- Document manual test steps in the PR when automated coverage is not feasible (e.g., AWS-specific flows).

## Pull Requests
1. Update documentation (README, API docs, ERDs) when behavior changes.
2. Provide a clear description, linked issue (if applicable), and screenshots/GIFs for UI changes.
3. List test commands/results.
4. Request review from at least one teammate.
5. Address review comments promptly; use follow-up commits rather than force pushes unless rebasing is required.

## Security & Secrets
- Never commit `.env` files, AWS credentials, or any customer data.
- Use AWS Secrets Manager for production values and limit IAM policies to least privilege.
- Report security concerns privately to the sponsor (Shane/Bobbye) before disclosing issues publicly.

## Questions
If anything is unclear, open a draft PR or reach out to the maintainers/Shane or Bobbye for guidance. Clear communication keeps the project moving quickly while protecting production uptime.
