# PROJECT_CONTEXT.md

## Project

Wealth Wellness Hub

## Problem Statement

Build an integrated Wealth Wellness Hub that unifies traditional and digital assets and provides financial wellness analytics, visualizations, and personalized recommendations.

## Product Goal

Help users understand their full financial picture in one dashboard without requiring immediate deep trust barriers such as direct bank login. Start with manual and semi-automated portfolio ingestion, then provide wellness scoring, projections, and recommendations.

## Current Stage

Initialized:

- frontend
- backend
- database
- Prisma ORM connected

## Core Product Principles

- Trust first
- Privacy first
- Explainability over black-box outputs
- Fast onboarding
- Useful even with partial data
- Demo-friendly for hackathon judging

## Initial Users

- Retail investors
- Young professionals
- Users with fragmented assets across brokerages, banks, crypto wallets, and manual/private holdings

## In-Scope MVP Features

1. Manual / AI-assisted portfolio upload
2. Wealth dashboard showing total net worth and asset breakdown
3. Financial wellness score
4. Explainable scoring reasons
5. Wealth projection simulation
6. Personalized recommendations
7. Historical health tracking
8. Trust/privacy messaging in UI

## Out of Scope for MVP

- Real bank-grade open finance integrations if too complex
- Real trading execution
- Full financial advisor workflow
- Overly complex ML models unless clearly valuable for demo

## Key UX Positioning

The app should feel:

- trustworthy
- calm
- premium
- easy to understand
- not overly technical
- not invasive in data requests

## Proposed Feature Design

### 1. Portfolio Ingestion

Users can add holdings through:

- manual entry
- CSV upload
- AI extraction from screenshots/statements
- optional wallet address input for digital assets

### 2. Wealth Dashboard

Show:

- total estimated net worth
- asset allocation
- liquid vs illiquid assets
- concentration risks
- diversification breakdown
- trend over time

### 3. Wellness Analytics

Main metrics:

- diversification score
- liquidity score
- concentration score
- resilience score
- behavior/risk alignment score

### 4. Recommendations

Examples:

- reduce concentration in one asset
- increase emergency liquidity
- rebalance exposure
- improve diversification
- adjust risk profile mismatch

### 5. Wealth Projection

Scenario simulation:

- base case
- optimistic
- conservative
- contribution growth over time

## Trust & Privacy Strategy

- Users do not need to connect bank accounts initially
- Manual upload supported first
- Clear explanation of what data is stored
- Transparent scoring explanations
- Sensitive fields minimized
- Demo should emphasize user control

## Tech Stack

### Frontend

- [fill in exact stack, e.g. Next.js + TypeScript + Tailwind]

### Backend

- [fill in exact stack, e.g. Node.js + Express / NestJS]

### Database

- PostgreSQL

### ORM

- Prisma

## Architecture Direction

- Frontend consumes backend API
- Backend handles analytics, scoring, and recommendation logic
- Prisma manages schema and DB access
- Start with mock market/reference data where needed
- Prefer deterministic calculations over complex ML for MVP

## Core Entities

Likely entities include:

- User
- Portfolio
- Holding
- Asset
- AssetSnapshot
- WellnessScore
- Recommendation
- ProjectionScenario
- UploadJob

## Expected Data Flow

1. User uploads or enters holdings
2. Backend normalizes holdings into a standard schema
3. System classifies assets
4. Analytics engine computes wellness metrics
5. Recommendation engine produces explainable actions
6. Frontend dashboard visualizes results

## Current Important Product Decisions

- Prioritize manual/AI upload over direct bank integrations
- Focus on explainability and trust
- Build an MVP that works with partial financial data
- Use visual clarity as a competitive advantage

## Coding Rules

- Keep components modular
- Keep business logic out of UI components
- Use typed API contracts
- Do not mix mock logic randomly across layers
- Add comments only where reasoning is non-obvious
- Prefer maintainable code over hacky speed unless necessary for demo deadline

## What Agents Should Do First

1. Confirm schema supports holdings, portfolios, analytics, and recommendations
2. Build seed/mock data path for demo
3. Build portfolio ingestion flow
4. Build dashboard API
5. Build dashboard UI
6. Add analytics scoring logic
7. Add recommendation engine
8. Add projection module

## Definition of MVP Done

The product is demo-ready when:

- a user can add holdings
- the system computes a wellness score
- the dashboard shows allocation and trends
- recommendations are shown with reasons
- at least one projection scenario works
- UI clearly communicates trust/privacy

## Open Questions

- Should crypto wallet support be real or mocked?
- Should statement parsing be true OCR/AI or simulated?
- Which analytics are most important for judging?
- Do we support only one portfolio or multiple portfolios in MVP?
