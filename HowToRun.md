# Simple Guide to Run the Code

# Frontend

```
cd frontend
npm install
npm run dev
```

### Frontend runs at:

```
http://localhost:3000
```

# Database

open docker dekstop first

```
docker compose up -d
```

# Backend

```
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Backend runs at:

```
http://localhost:4000
```

# (Optional) Database UI

```
cd backend
npx prisma studio
```

### Database UI runs at:

```
http://localhost:5555
```

# My commands to CODEX AI to use:

```
Read docs/PROJECT_CONTEXT.md, docs/TASKS.md, and docs/STATUS.md first.

We are building a hackathon MVP called Wealth Wellness Hub.
The frontend, backend, database, and Prisma are already initialized.

Your job:
1. Identify the highest-priority unfinished task from TASKS.md
2. Implement it in the existing codebase
3. Keep changes modular and production-sensible
4. Update STATUS.md and TASKS.md after making changes
5. Do not introduce unnecessary abstractions
6. Prefer mock/demo-friendly implementations where external integrations would slow us down

Before coding, summarize:
- what you think the current system is
- what you plan to build
- which files you expect to modify

Then proceed.
```
