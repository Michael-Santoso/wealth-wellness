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
