INSERT INTO buildings (id, code, name, address, accessible_by_default, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'mit-demo', 'NavMate Demo Center', '77 Accessibility Avenue', TRUE, now(), now());

INSERT INTO floors (id, building_id, code, name, level_index, floor_plan_url, publish_status, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'hq-ground', 'Ground Floor', 0,
        'https://example.local/floorplans/hq-ground.png', 'PUBLISHED', now(), now());

INSERT INTO nodes (id, floor_id, code, name, type, x_meters, y_meters, accessible, entrance, help_desk, lift, created_at, updated_at)
VALUES
('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'entrance_main', 'Main Entrance', 'ENTRANCE', 0.0, 0.0, TRUE, TRUE, FALSE, FALSE, now(), now()),
('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'lobby_junction', 'Lobby Junction', 'INTERSECTION', 8.0, 0.0, TRUE, FALSE, FALSE, FALSE, now(), now()),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'help_desk', 'Help Desk', 'HELP_DESK', 10.0, 3.0, TRUE, FALSE, TRUE, FALSE, now(), now()),
('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222222', 'lift_lobby', 'Lift Lobby', 'LIFT', 16.0, 0.0, TRUE, FALSE, FALSE, TRUE, now(), now()),
('33333333-3333-3333-3333-333333333335', '22222222-2222-2222-2222-222222222222', 'clinic_room', 'Clinic Room', 'ROOM', 22.0, -2.0, TRUE, FALSE, FALSE, FALSE, now(), now()),
('33333333-3333-3333-3333-333333333336', '22222222-2222-2222-2222-222222222222', 'waiting_area', 'Waiting Area', 'ROOM', 22.0, 2.0, TRUE, FALSE, FALSE, FALSE, now(), now());

INSERT INTO edges (id, floor_id, from_node_id, to_node_id, distance_meters, accessible, anchor_coverage_score, hazard_weight, created_at, updated_at)
VALUES
('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333332', 8.0, TRUE, 1.0, 0.0, now(), now()),
('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 3.0, TRUE, 0.9, 0.0, now(), now()),
('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333334', 8.0, TRUE, 0.8, 0.0, now(), now()),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333335', 4.5, TRUE, 0.8, 0.0, now(), now()),
('44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333336', 4.5, TRUE, 0.8, 0.0, now(), now());

INSERT INTO qr_anchors (id, floor_id, node_id, token, label, entrance_anchor, active, created_at, updated_at)
VALUES
('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331', 'ANCHOR-HQ-GF-ENTRANCE', 'Main Entrance Marker', TRUE, TRUE, now(), now()),
('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', 'ANCHOR-HQ-GF-LOBBY', 'Lobby Junction Marker', FALSE, TRUE, now(), now()),
('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333334', 'ANCHOR-HQ-GF-LIFT', 'Lift Lobby Marker', FALSE, TRUE, now(), now());

INSERT INTO landmarks (id, floor_id, node_id, title, spoken_hint, created_at, updated_at)
VALUES
('66666666-6666-6666-6666-666666666661', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Reception Desk', 'Reception is on your right.', now(), now()),
('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333334', 'Lift Doors', 'Lift doors are directly ahead.', now(), now());

INSERT INTO destination_aliases (id, building_id, node_id, alias, category, created_at, updated_at)
VALUES
('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Help Desk', 'support', now(), now()),
('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333334', 'Lift', 'vertical_transport', now(), now()),
('77777777-7777-7777-7777-777777777773', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333335', 'Clinic Room', 'service', now(), now()),
('77777777-7777-7777-7777-777777777774', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333336', 'Waiting Area', 'waiting', now(), now());

INSERT INTO admin_users (id, email, display_name, password_hash, role, active, created_at, updated_at)
VALUES ('88888888-8888-8888-8888-888888888881', 'admin@navmate.local', 'Demo Admin', '{noop}admin', 'ADMIN', TRUE, now(), now());
