# NavMate Live

NavMate Live is a demo-ready MVP for voice-first indoor navigation in supported buildings. It is designed for blind and low-vision users who need a calm, accessible way to reach indoor destinations with optional QR re-anchoring, confidence-aware guidance, and recovery support.

## Monorepo Structure

```text
.
|-- ai-worker/               # Placeholder only, not implemented in MVP
|-- backend/                 # Node.js + Express + MongoDB backend
|-- docs/                    # Product and integration specs
|-- infra/                   # Dockerized local MongoDB + backend setup
|-- mobile/                  # Flutter mobile client
|-- hello.txt
|-- mit.md
`-- vedant.md
```

## MVP Features

- Indoor navigation only for onboarded buildings
- Android-first Flutter mobile client
- Node.js, Express.js, MongoDB, and Mongoose backend
- Voice-first destination flow with speech input and spoken guidance
- Optional QR anchor scan for precise start or re-anchoring
- Graph routing with landmark-aware turn instructions
- IMU/dead reckoning placeholders between anchors
- Confidence-aware recovery mode
- Bounded conversational navigation assistant
- Route-state controls for admins
- Recovery mode when confidence drops
- Accessible, high-contrast UI with large controls

## Quick Start

### Infrastructure

```bash
cd infra
docker compose up --build
```

### Backend

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

Backend defaults:

- API base: `http://localhost:8080/api/v1`
- Health: `http://localhost:8080/api/v1/health`
- Admin demo login: `admin@navmate.live` / `admin123`

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Demo Seed Data

The seed dataset includes one building and one floor with:

- one entrance
- one help desk
- one lift
- at least three destinations
- QR anchors at major points
- landmarks and destination aliases

See [docs/graphs/sample_floor_graph.json](docs/graphs/sample_floor_graph.json) and [docs/graph-json-spec.md](docs/graph-json-spec.md).

## Demo Flow

1. Open the app
2. Tap `Start Indoor Navigation`
3. Choose an entrance or tap `Scan QR For Precise Start`
4. Speak a destination like `Registrar Office`
5. Confirm a destination card
6. Follow voice-first instructions
7. Ask navigation questions such as `Am I near the lift?`
8. Optionally scan QR during navigation to improve confidence
9. Enter recovery mode if confidence drops
10. Reach the destination and hear the arrival confirmation

## Example API Payloads

`POST /api/v1/navigation/start`

```json
{
  "startNodeId": "6617demo001",
  "deviceId": "demo-device-01"
}
```

`POST /api/v1/navigation/:sessionId/destination`

```json
{
  "destinationText": "Take me to Registrar Office"
}
```

`POST /api/v1/navigation/:sessionId/assistant`

```json
{
  "query": "Am I near the lift?"
}
```

## Accessibility Notes

- Large tap areas and readable typography are enabled by default
- Voice prompts are short and calm
- QR is always optional
- Recovery mode is explicit, supportive, and safety-focused

## Future Improvements

- Device-calibrated dead reckoning
- Multi-floor routing with lifts and stairs
- Richer landmark mapping
- Stronger admin authentication
- Real sensor fusion and anchor proximity prediction
