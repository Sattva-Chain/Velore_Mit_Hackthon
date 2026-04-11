# API Docs

Runtime OpenAPI is exposed by the backend through springdoc.

## Local URLs

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Covered Endpoints

### Mobile

- `POST /api/v1/navigation/start`
- `POST /api/v1/navigation/{sessionId}/destination`
- `POST /api/v1/navigation/{sessionId}/progress`
- `POST /api/v1/navigation/{sessionId}/anchor`
- `POST /api/v1/navigation/{sessionId}/recovery`
- `GET /api/v1/navigation/{sessionId}`
- `GET /api/v1/buildings/{buildingId}/destinations`
- `GET /api/v1/buildings/{buildingId}/state`

### Admin

- `POST /api/v1/admin/buildings`
- `POST /api/v1/admin/buildings/{id}/floors`
- `POST /api/v1/admin/floors/{id}/graph/import`
- `PUT /api/v1/admin/floors/{id}/graph`
- `POST /api/v1/admin/anchors`
- `POST /api/v1/admin/landmarks`
- `POST /api/v1/admin/route-state`
- `POST /api/v1/admin/publish/{floorId}`
