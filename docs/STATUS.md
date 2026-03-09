# STATUS.md

## Current Status

Frontend, backend, database, and Prisma ORM are initialized and connected.
Prisma schema has now been reviewed and extended to cover key MVP entities for ingestion and projections.
Demo seed data pipeline is now added for one realistic user and portfolio so dashboard flows have immediate test data.

## Last Completed

- Project scaffolding done
- Prisma connected
- Initial stack setup complete
- Reviewed schema against MVP entity list
- Added Prisma models: `AssetSnapshot`, `ProjectionScenario`, `UploadJob`
- Added migration: `backend/prisma/migrations/20260309092000_add_mvp_entities/migration.sql`
- Finalized portfolio ingestion API contracts with Zod validation and normalized DTO responses
- Added demo upload job contract for CSV/AI/manual/wallet ingestion workflows
- Mounted all backend module routes under `/api` (auth, portfolio, analytics, recommendations)
- Added idempotent Prisma seed script at `backend/prisma/seed.ts`
- Seed now populates demo user, portfolio, holdings, analytics snapshot, recommendations, projections, asset snapshots, and a processed upload job
- Added seed commands: `npm run prisma:seed` and `npx prisma db seed`
- Implemented dashboard summary endpoint at `GET /api/analytics/summary`
- Summary now returns: portfolio metadata, wellness score, allocation breakdown, liquidity metrics, concentration/diversification/resilience risk metrics, top recommendations, score reasons, and historical trend
- Summary reads from latest portfolio + holdings + recommendations and persists/updates a daily analytics snapshot for tracking
- Implemented dashboard frontend page at `frontend/app/dashboard/page.tsx` using live `GET /api/analytics/summary`
- Dashboard now shows net worth, score card, allocation chart, risk breakdown, recommendations, and trend chart
- Added explicit loading, missing-user, empty-portfolio, and API-error states for demo reliability

## Current Focus

Create holdings normalization service.

## Immediate Next Step

Create holdings normalization service:

- centralize normalization for symbol casing, asset metadata, quantity/cost parsing, and validation
- reuse from manual ingest and upload-job parsed holdings paths
- keep deterministic, mock-friendly behavior without external market integrations

## Risks / Blockers

- Scope creep
- Overcomplicating data ingestion
- Spending too much time on real integrations
- Privacy concerns if requiring too much user data too early

## Notes for Next Agent

Prioritize demoable features over perfect infrastructure.
Use mock/sample data if a feature would otherwise stall development.
