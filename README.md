# AI Outreach Automation — Starter

A production-oriented starter for guest-post / link-insertion outreach with AI-assisted conversations.

## Stack
- Next.js + TypeScript
- PostgreSQL + Prisma
- OpenAI API for reply drafting
- Gmail API integration point
- CSV lead import
- Human approval / auto-send modes
- Opt-out and basic sending safeguards

## Setup
1. Copy `.env.example` to `.env`.
2. Add PostgreSQL and OpenAI credentials.
3. Install dependencies: `npm install`
4. Generate Prisma client: `npx prisma generate`
5. Run migrations: `npx prisma migrate dev --name init`
6. Start: `npm run dev`

This starter intentionally does not include credentials or an automated bulk-sending bypass. Configure your approved Gmail/Google Workspace account and comply with provider rules and applicable email laws.
