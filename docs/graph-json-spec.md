# Graph JSON Specification

This JSON format is used by `POST /api/v1/admin/floors/{id}/graph/import`.

## Top-Level Shape

```json
{
  "floorCode": "hq-ground",
  "floorName": "Ground Floor",
  "nodes": [],
  "edges": [],
  "anchors": [],
  "landmarks": [],
  "destinationAliases": []
}
```

## Nodes

Semantic navigation points. Do not use image pixels as the graph source of truth.

```json
{
  "code": "entrance_main",
  "name": "Main Entrance",
  "type": "ENTRANCE",
  "xMeters": 0.0,
  "yMeters": 0.0,
  "accessible": true,
  "entrance": true,
  "helpDesk": false,
  "lift": false
}
```

## Edges

```json
{
  "from": "entrance_main",
  "to": "lobby_junction",
  "distanceMeters": 8.0,
  "accessible": true,
  "anchorCoverageScore": 0.9,
  "hazardWeight": 0.0
}
```

Rules:

- `from` and `to` must reference valid node codes
- `anchorCoverageScore` is `0.0` to `1.0`
- `hazardWeight` increases recovery-aware reroute cost

## Anchors

```json
{
  "token": "ANCHOR-HQ-GF-ENTRANCE",
  "label": "Main Entrance Marker",
  "nodeCode": "entrance_main",
  "entranceAnchor": true,
  "active": true
}
```

Rules:

- each anchor resolves deterministically to exactly one node
- token is opaque and must not expose database IDs

## Landmarks

```json
{
  "title": "Reception Desk",
  "spokenHint": "Reception is on your right.",
  "nodeCode": "help_desk"
}
```

## Destination Aliases

```json
{
  "alias": "Help Desk",
  "category": "support",
  "nodeCode": "help_desk"
}
```
