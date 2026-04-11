CREATE TABLE buildings (
    id UUID PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    address VARCHAR(255) NOT NULL,
    accessible_by_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE floors (
    id UUID PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES buildings(id),
    code VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    level_index INTEGER NOT NULL,
    floor_plan_url VARCHAR(255),
    publish_status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_floor_code_per_building UNIQUE (building_id, code)
);

CREATE TABLE nodes (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL REFERENCES floors(id),
    code VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    type VARCHAR(32) NOT NULL,
    x_meters DOUBLE PRECISION NOT NULL,
    y_meters DOUBLE PRECISION NOT NULL,
    accessible BOOLEAN NOT NULL DEFAULT TRUE,
    entrance BOOLEAN NOT NULL DEFAULT FALSE,
    help_desk BOOLEAN NOT NULL DEFAULT FALSE,
    lift BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_node_code_per_floor UNIQUE (floor_id, code)
);

CREATE TABLE edges (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL REFERENCES floors(id),
    from_node_id UUID NOT NULL REFERENCES nodes(id),
    to_node_id UUID NOT NULL REFERENCES nodes(id),
    distance_meters DOUBLE PRECISION NOT NULL,
    accessible BOOLEAN NOT NULL DEFAULT TRUE,
    anchor_coverage_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    hazard_weight DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE qr_anchors (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL REFERENCES floors(id),
    node_id UUID NOT NULL REFERENCES nodes(id),
    token VARCHAR(128) NOT NULL UNIQUE,
    label VARCHAR(160) NOT NULL,
    entrance_anchor BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE landmarks (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL REFERENCES floors(id),
    node_id UUID NOT NULL REFERENCES nodes(id),
    title VARCHAR(160) NOT NULL,
    spoken_hint VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE destination_aliases (
    id UUID PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES buildings(id),
    node_id UUID NOT NULL REFERENCES nodes(id),
    alias VARCHAR(160) NOT NULL,
    category VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE route_state_events (
    id UUID PRIMARY KEY,
    floor_id UUID NOT NULL REFERENCES floors(id),
    edge_id UUID REFERENCES edges(id),
    node_id UUID REFERENCES nodes(id),
    event_type VARCHAR(32) NOT NULL,
    message VARCHAR(255) NOT NULL,
    active_from TIMESTAMP WITH TIME ZONE NOT NULL,
    active_until TIMESTAMP WITH TIME ZONE,
    accessible_impact BOOLEAN NOT NULL DEFAULT FALSE,
    severity INTEGER NOT NULL,
    created_by VARCHAR(160) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE navigation_sessions (
    id UUID PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES buildings(id),
    floor_id UUID NOT NULL REFERENCES floors(id),
    start_anchor_id UUID REFERENCES qr_anchors(id),
    current_node_id UUID REFERENCES nodes(id),
    destination_node_id UUID REFERENCES nodes(id),
    status VARCHAR(32) NOT NULL,
    confidence_level VARCHAR(32) NOT NULL,
    accessible_only BOOLEAN NOT NULL DEFAULT TRUE,
    recovery_mode BOOLEAN NOT NULL DEFAULT FALSE,
    voice_state VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    session_updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE recovery_events (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES navigation_sessions(id),
    from_node_id UUID REFERENCES nodes(id),
    recommended_node_id UUID REFERENCES nodes(id),
    reason VARCHAR(160) NOT NULL,
    action_suggested VARCHAR(255) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    email VARCHAR(160) NOT NULL UNIQUE,
    display_name VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_nodes_floor_id ON nodes(floor_id);
CREATE INDEX idx_edges_floor_id ON edges(floor_id);
CREATE INDEX idx_qr_anchors_floor_id ON qr_anchors(floor_id);
CREATE INDEX idx_destination_aliases_building_id ON destination_aliases(building_id);
CREATE INDEX idx_route_state_events_floor_id ON route_state_events(floor_id);
CREATE INDEX idx_navigation_sessions_building_id ON navigation_sessions(building_id);
