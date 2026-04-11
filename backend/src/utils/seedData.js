const demoBuilding = {
  building: {
    name: 'Vision Commons',
    address: '101 Accessibility Avenue, Cambridge, MA',
    description: 'Demo-ready ground floor indoor navigation environment for hackathon judging.',
    status: 'active',
  },
  floor: {
    levelCode: 'Ground Floor',
    mapImageUrl: '/maps/vision-commons-ground.png',
    isPublished: true,
  },
  nodes: [
    { code: 'entrance_main', type: 'entrance', name: 'Main Entrance', x: 0, y: 0, headingHint: 90, qrOptional: true, accessible: true },
    { code: 'entrance_east', type: 'entrance', name: 'East Entrance', x: 0, y: 8, headingHint: 90, qrOptional: true, accessible: true },
    { code: 'entrance_helpdesk', type: 'entrance', name: 'Help Desk Entrance', x: 4, y: 4, headingHint: 0, qrOptional: true, accessible: true },
    { code: 'lobby_junction', type: 'intersection', name: 'Lobby Junction', x: 8, y: 4, headingHint: 90, qrOptional: true, accessible: true },
    { code: 'help_desk', type: 'helpdesk', name: 'Help Desk', x: 10, y: 6, headingHint: 180, qrOptional: true, accessible: true },
    { code: 'registrar_office', type: 'room', name: 'Registrar Office', x: 16, y: 8, headingHint: 90, qrOptional: false, accessible: true },
    { code: 'billing_counter', type: 'room', name: 'Billing Counter', x: 16, y: 1, headingHint: 90, qrOptional: false, accessible: true },
    { code: 'room_204', type: 'room', name: 'Room 204', x: 23, y: 8, headingHint: 90, qrOptional: false, accessible: true },
    { code: 'lift_lobby', type: 'lift', name: 'Lift Lobby', x: 23, y: 4, headingHint: 90, qrOptional: true, accessible: true },
    { code: 'resource_lab', type: 'room', name: 'Resource Lab', x: 23, y: 0, headingHint: 90, qrOptional: false, accessible: true }
  ],
  edges: [
    { from: 'entrance_main', to: 'lobby_junction', distanceM: 9, accessible: true, defaultDirection: 'straight', anchorPriority: 0.9, landmarkHints: ['Reception ahead'] },
    { from: 'entrance_east', to: 'lobby_junction', distanceM: 8, accessible: true, defaultDirection: 'straight', anchorPriority: 0.7, landmarkHints: ['Open lobby on the left'] },
    { from: 'entrance_helpdesk', to: 'help_desk', distanceM: 3, accessible: true, defaultDirection: 'straight', anchorPriority: 1, landmarkHints: ['Service bell nearby'] },
    { from: 'help_desk', to: 'lobby_junction', distanceM: 3, accessible: true, defaultDirection: 'right', anchorPriority: 0.8, landmarkHints: ['Lobby opens ahead'] },
    { from: 'lobby_junction', to: 'registrar_office', distanceM: 9, accessible: true, defaultDirection: 'left', anchorPriority: 0.7, landmarkHints: ['Registrar hallway'] },
    { from: 'lobby_junction', to: 'billing_counter', distanceM: 8, accessible: true, defaultDirection: 'right', anchorPriority: 0.7, landmarkHints: ['Billing signboard'] },
    { from: 'registrar_office', to: 'room_204', distanceM: 7, accessible: true, defaultDirection: 'straight', anchorPriority: 0.6, landmarkHints: ['Room numbers increase'] },
    { from: 'billing_counter', to: 'lift_lobby', distanceM: 7, accessible: true, defaultDirection: 'left', anchorPriority: 0.8, landmarkHints: ['Lift chime nearby'] },
    { from: 'lift_lobby', to: 'room_204', distanceM: 4, accessible: true, defaultDirection: 'left', anchorPriority: 0.9, landmarkHints: ['Room 204 door ahead'] },
    { from: 'lift_lobby', to: 'resource_lab', distanceM: 4, accessible: true, defaultDirection: 'right', anchorPriority: 0.8, landmarkHints: ['Lab equipment sounds'] }
  ],
  anchors: [
    { nodeCode: 'entrance_main', qrCodeValue: 'ANCHOR-VC-G-MAIN', active: true, mountHeightCm: 140 },
    { nodeCode: 'lobby_junction', qrCodeValue: 'ANCHOR-VC-G-LOBBY', active: true, mountHeightCm: 145 },
    { nodeCode: 'help_desk', qrCodeValue: 'ANCHOR-VC-G-HELP', active: true, mountHeightCm: 140 },
    { nodeCode: 'lift_lobby', qrCodeValue: 'ANCHOR-VC-G-LIFT', active: true, mountHeightCm: 142 }
  ],
  landmarks: [
    { nodeCode: 'help_desk', label: 'Help desk counter', optionalAudioNote: 'Help desk is slightly to your left.', sideHint: 'left' },
    { nodeCode: 'registrar_office', label: 'Registrar signboard', optionalAudioNote: 'The registrar sign is ahead at shoulder height.', sideHint: 'ahead' },
    { nodeCode: 'lift_lobby', label: 'Lift doors', optionalAudioNote: 'Lift doors are directly ahead.', sideHint: 'ahead' }
  ],
  aliases: [
    { nodeCode: 'help_desk', aliasText: 'Help Desk' },
    { nodeCode: 'help_desk', aliasText: 'Support Desk' },
    { nodeCode: 'registrar_office', aliasText: 'Registrar Office' },
    { nodeCode: 'registrar_office', aliasText: 'Registrar' },
    { nodeCode: 'billing_counter', aliasText: 'Billing Counter' },
    { nodeCode: 'billing_counter', aliasText: 'Billing' },
    { nodeCode: 'room_204', aliasText: 'Room 204' },
    { nodeCode: 'room_204', aliasText: 'Lab 204' },
    { nodeCode: 'resource_lab', aliasText: 'Resource Lab' },
    { nodeCode: 'resource_lab', aliasText: 'Lab' }
  ],
  routeStateEvents: [
    { scopeType: 'edge', scopeCode: 'billing_counter|lift_lobby', status: 'caution', expiresAtDays: 7, createdBy: 'seed', note: 'Foot traffic tends to be higher near the lift lobby.' }
  ]
};

module.exports = { demoBuilding };
