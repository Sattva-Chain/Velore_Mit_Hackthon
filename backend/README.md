# Backend

Node.js + Express + MongoDB backend for the NavMate Live MVP.

## Stack

- Node.js 20+
- Express.js
- MongoDB
- Mongoose
- Zod validation
- dotenv
- Centralized error handling

## Structure

```text
backend/
|-- src/
|   |-- app.js
|   |-- server.js
|   |-- config/
|   |-- controllers/
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- seed/
|   `-- validations/
|-- package.json
`-- .env.example
```

## Run

```bash
npm install
copy .env.example .env
npm run seed
npm run dev
```

## API Areas

- `POST /api/v1/navigation/start`
- `POST /api/v1/navigation/:sessionId/destination`
- `POST /api/v1/navigation/:sessionId/progress`
- `POST /api/v1/navigation/:sessionId/anchor`
- `POST /api/v1/navigation/:sessionId/recovery`
- `GET /api/v1/navigation/:sessionId`
- `GET /api/v1/buildings/:buildingId/destinations`
- `GET /api/v1/buildings/:buildingId/state`
- `POST /api/v1/admin/*`

## Demo Seed

The seed script creates:

- 1 building
- 1 published floor
- 10 graph nodes
- connected accessible edges
- QR anchors for optional re-anchoring
- destination aliases for voice matching
- a help desk fallback

## Notes

- QR improves confidence but is never required to begin navigation.
- Routing prefers accessible, non-blocked paths and lightly favors anchor-rich segments.
- Confidence falls back gracefully into recovery mode when progress becomes unreliable.
