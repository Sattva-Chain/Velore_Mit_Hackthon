const Building = require('../models/Building');
const Floor = require('../models/Floor');
const NavigationSession = require('../models/NavigationSession');
const NavNode = require('../models/NavNode');
const RouteStateEvent = require('../models/RouteStateEvent');
const ApiError = require('../utils/ApiError');
const { evaluateProgressConfidence, initialConfidence } = require('./confidenceService');
const { listDestinations, matchDestination } = require('./destinationService');
const { findEntrances, findNearestHelpDesk, planRoute, resolveAnchor } = require('./graphService');
const { adaptInstructionByConfidence } = require('./instructionEngineService');
const { buildRecoveryOptions, createRecoveryEvent } = require('./recoveryService');

function toId(value) {
  return value ? String(value) : null;
}

async function resolveBuildingAndFloor({ buildingId, floorId }) {
  const building = buildingId
    ? await Building.findById(buildingId)
    : await Building.findOne({ status: 'active' }).sort({ createdAt: 1 });

  if (!building) {
    throw new ApiError(404, 'No active building is available.');
  }

  const floor = floorId
    ? await Floor.findById(floorId)
    : await Floor.findOne({ buildingId: building._id, isPublished: true }).sort({ createdAt: 1 });

  if (!floor) {
    throw new ApiError(404, 'No published floor is available for navigation.');
  }

  return { building, floor };
}

async function selectStartNode({ floorId, startNodeId, qrCodeValue }) {
  const entrances = await findEntrances(floorId);

  if (qrCodeValue) {
    const anchor = await resolveAnchor(qrCodeValue);
    const node = await NavNode.findById(anchor.nodeId);
    if (!node) {
      throw new ApiError(404, 'Anchor node not found');
    }
    return { node, anchor, entrances };
  }

  if (startNodeId) {
    const node = await NavNode.findById(startNodeId);
    if (!node) {
      throw new ApiError(404, 'Start node not found');
    }
    return { node, anchor: null, entrances };
  }

  if (!entrances.length) {
    throw new ApiError(404, 'No entrance nodes are configured for this floor.');
  }

  return { node: entrances[0], anchor: null, entrances };
}

async function buildSessionPayload(session, extras = {}) {
  const [building, floor, currentNode, destinationNode, startNode, entrances, destinations] = await Promise.all([
    Building.findById(session.buildingId).lean(),
    Floor.findById(session.floorId).lean(),
    session.currentNodeId ? NavNode.findById(session.currentNodeId).lean() : null,
    session.destinationNodeId ? NavNode.findById(session.destinationNodeId).lean() : null,
    NavNode.findById(session.startNodeId).lean(),
    findEntrances(session.floorId),
    listDestinations(session.buildingId),
  ]);

  const recoveryOptions = session.status === 'recovering' ? await buildRecoveryOptions(session) : [];
  const adaptedInstruction = adaptInstructionByConfidence(session.currentInstruction, session.confidence);

  return {
    sessionId: String(session._id),
    status: session.status,
    confidence: session.confidence,
    recoveryMode: session.status === 'recovering',
    voicePrompt: adaptedInstruction,
    buildingId: toId(building?._id),
    buildingName: building?.name || '',
    floorId: toId(floor?._id),
    floorName: floor?.levelCode || '',
    startNodeId: toId(startNode?._id),
    startNodeName: startNode?.name || '',
    currentNodeId: toId(currentNode?._id),
    currentNodeName: currentNode?.name || '',
    destinationNodeId: toId(destinationNode?._id),
    destinationNodeName: destinationNode?.name || '',
    progressEstimate: session.progressEstimate,
    totalDistanceMeters: session.route?.totalDistanceMeters || 0,
    currentInstruction: adaptedInstruction,
    spokenDestinationText: session.spokenDestinationText || '',
    entranceMode: session.entranceMode,
    instructions: session.route?.instructions || [],
    availableDestinations: destinations,
    entranceOptions: entrances.map((entrance) => ({
      nodeId: String(entrance._id),
      label: entrance.name,
      type: entrance.type,
    })),
    recoveryOptions,
    ...extras,
  };
}

async function startSession(payload) {
  const { building, floor } = await resolveBuildingAndFloor(payload);
  const { node, anchor } = await selectStartNode({
    floorId: floor._id,
    startNodeId: payload.startNodeId,
    qrCodeValue: payload.qrCodeValue,
  });

  const session = await NavigationSession.create({
    deviceId: payload.deviceId || 'demo-device',
    buildingId: building._id,
    floorId: floor._id,
    startNodeId: node._id,
    currentNodeId: node._id,
    lastAnchorNodeId: anchor ? node._id : null,
    confidence: initialConfidence({
      usedQr: Boolean(anchor),
      explicitStart: Boolean(payload.startNodeId),
    }),
    entranceMode: payload.qrCodeValue ? 'qr' : 'selected_entrance',
    currentInstruction: payload.qrCodeValue
      ? 'Position confirmed. Where would you like to go?'
      : payload.startNodeId
          ? `Starting from ${node.name}. Where would you like to go?`
          : 'Please choose your entrance to start navigation.',
  });

  return buildSessionPayload(session);
}

async function setDestination(sessionId, payload) {
  const session = await NavigationSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Navigation session not found');
  }

  let destinationNodeId = payload.destinationNodeId;
  let destinationSuggestions = [];

  if (!destinationNodeId && payload.destinationText) {
    const matched = await matchDestination({
      destinationText: payload.destinationText,
      floorId: session.floorId,
    });
    destinationSuggestions = matched.topMatches;

    if (!matched.bestMatch) {
      session.currentInstruction = 'I found a few similar destinations. Please choose one.';
      await session.save();
      return buildSessionPayload(session, { destinationSuggestions });
    }

    destinationNodeId = matched.bestMatch.nodeId;
  }

  if (!destinationNodeId) {
    throw new ApiError(400, 'A destination text or destination node id is required.');
  }

  const route = await planRoute({
    floorId: session.floorId,
    startNodeId: session.currentNodeId,
    destinationNodeId,
    accessibleOnly: true,
  });

  const destinationNode = await NavNode.findById(destinationNodeId).lean();
  session.destinationNodeId = destinationNodeId;
  session.spokenDestinationText = payload.destinationText || destinationNode?.name || '';
  session.route = { ...route, currentInstructionIndex: 0 };
  session.progressEstimate = 0;
  session.status = 'active';
  session.currentInstruction =
    route.instructions[0]?.text || `Navigating to ${destinationNode?.name || 'your destination'}.`;
  await session.save();

  return buildSessionPayload(session, {
    destinationSuggestions,
    firstGuidanceInstruction: route.instructions[0] || null,
  });
}

async function updateProgress(sessionId, payload) {
  const session = await NavigationSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Navigation session not found');
  }

  if (!session.route) {
    session.currentInstruction = 'Where would you like to go?';
    await session.save();
    return buildSessionPayload(session);
  }

  const deltaMeters = Number(payload.estimatedDeltaMeters || 0);
  session.progressEstimate = Number((session.progressEstimate + deltaMeters).toFixed(2));
  session.confidence = evaluateProgressConfidence(session, {
    confidenceHint: payload.confidenceHint || payload.confidenceLevel,
    forceRecovery: payload.forceRecovery,
    offRoute: payload.offRoute,
    progressEstimate: session.progressEstimate,
  });

  const movementInstructions = session.route.instructions.filter((instruction) => instruction.maneuver !== 'arrive');
  let nextInstruction = movementInstructions.find(
    (instruction) => instruction.cumulativeDistanceMeters > session.progressEstimate,
  );

  if (session.progressEstimate >= session.route.totalDistanceMeters) {
    session.status = 'arrived';
    session.currentNodeId = session.destinationNodeId;
    session.currentInstruction = 'You have arrived.';
    session.confidence = 'high';
  } else if (session.confidence === 'low') {
    session.status = 'recovering';
    session.currentInstruction =
      'I am not fully confident about your location. Please continue slowly or scan a nearby QR marker.';
    await createRecoveryEvent(
      session._id,
      'recovering',
      session.lastAnchorNodeId,
      'Confidence dropped during progress update.',
    );
  } else {
    session.status = 'active';

    if (!nextInstruction) {
      nextInstruction = movementInstructions[movementInstructions.length - 1];
    }

    const reachedInstruction = movementInstructions
      .filter((instruction) => instruction.cumulativeDistanceMeters <= session.progressEstimate)
      .pop();

    if (reachedInstruction?.targetNodeId) {
      session.currentNodeId = reachedInstruction.targetNodeId;
    }

    session.currentInstruction = nextInstruction?.text || session.currentInstruction;
    session.route.currentInstructionIndex = nextInstruction?.order || 0;
  }

  await session.save();
  return buildSessionPayload(session);
}

async function reanchorSession(sessionId, payload) {
  const session = await NavigationSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Navigation session not found');
  }

  const anchor = await resolveAnchor(payload.qrCodeValue);
  const anchorNode = await NavNode.findById(anchor.nodeId).lean();
  if (!anchorNode) {
    throw new ApiError(404, 'Anchor node not found');
  }

  session.currentNodeId = anchorNode._id;
  session.lastAnchorNodeId = anchorNode._id;
  session.confidence = 'high';
  session.progressEstimate = 0;
  session.status = 'active';

  if (session.destinationNodeId) {
    const route = await planRoute({
      floorId: session.floorId,
      startNodeId: anchorNode._id,
      destinationNodeId: session.destinationNodeId,
      accessibleOnly: true,
    });
    session.route = { ...route, currentInstructionIndex: 0 };
    session.currentInstruction = `Position confirmed. ${route.instructions[0]?.text || 'Continue to your destination.'}`;
  } else {
    session.currentInstruction = 'Position confirmed. Where would you like to go?';
  }

  await createRecoveryEvent(session._id, 'reanchored', anchorNode._id, 'QR anchor confirmed.');
  await session.save();
  return buildSessionPayload(session);
}

async function updateRecovery(sessionId, payload) {
  const session = await NavigationSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Navigation session not found');
  }

  const action = payload.action || 'trigger';
  const normalizedAction = {
    enter: 'trigger',
    repeat: 'repeat_last',
    helpdesk: 'nearest_helpdesk',
    return_last_confirmed: 'return_to_anchor',
    resolve: 'trigger',
  }[action] || action;

  if (normalizedAction === 'repeat_last') {
    return buildSessionPayload(session);
  }

  if (normalizedAction === 'nearest_helpdesk') {
    const nearestHelpDesk = await findNearestHelpDesk(
      session.floorId,
      session.currentNodeId || session.startNodeId,
      true,
    );

    if (!nearestHelpDesk) {
      throw new ApiError(404, 'No help desk route is currently available.');
    }

    session.destinationNodeId = nearestHelpDesk.node._id;
    session.route = { ...nearestHelpDesk.route, currentInstructionIndex: 0 };
    session.status = 'active';
    session.confidence = 'medium';
    session.progressEstimate = 0;
    session.currentInstruction = `Navigating to ${nearestHelpDesk.node.name}. ${nearestHelpDesk.route.instructions[0]?.text || ''}`.trim();
    await createRecoveryEvent(
      session._id,
      'helpdesk_redirect',
      session.lastAnchorNodeId,
      'User requested nearest help desk.',
    );
    await session.save();
    return buildSessionPayload(session);
  }

  if (normalizedAction === 'return_to_anchor' && session.lastAnchorNodeId) {
    const route = await planRoute({
      floorId: session.floorId,
      startNodeId: session.currentNodeId || session.startNodeId,
      destinationNodeId: session.lastAnchorNodeId,
      accessibleOnly: true,
    });

    session.destinationNodeId = session.lastAnchorNodeId;
    session.route = { ...route, currentInstructionIndex: 0 };
    session.status = 'active';
    session.confidence = 'medium';
    session.progressEstimate = 0;
    session.currentInstruction = `Returning to your last confirmed point. ${route.instructions[0]?.text || ''}`.trim();
    await createRecoveryEvent(
      session._id,
      'return_to_anchor',
      session.lastAnchorNodeId,
      'User returning to last confirmed point.',
    );
    await session.save();
    return buildSessionPayload(session);
  }

  session.status = 'recovering';
  session.confidence = 'low';
  session.currentInstruction =
    'I am not fully confident about your location. Please continue slowly or scan a nearby QR marker.';
  await createRecoveryEvent(
    session._id,
    'recovering',
    session.lastAnchorNodeId,
    payload.reason || 'Manual recovery request.',
  );
  await session.save();
  return buildSessionPayload(session);
}

async function getSession(sessionId) {
  const session = await NavigationSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Navigation session not found');
  }

  return buildSessionPayload(session);
}

async function getBuildingDestinations(buildingId) {
  return listDestinations(buildingId);
}

async function getBuildingEntrances(buildingId) {
  const building = await Building.findById(buildingId).lean();
  if (!building) {
    throw new ApiError(404, 'Building not found');
  }

  const floor = await Floor.findOne({ buildingId, isPublished: true }).lean();
  if (!floor) {
    return [];
  }

  const entrances = await findEntrances(floor._id);
  return entrances.map((entrance) => ({
    nodeId: String(entrance._id),
    label: entrance.name,
    type: entrance.type,
  }));
}

async function getBuildingState(buildingId) {
  const building = await Building.findById(buildingId).lean();
  if (!building) {
    throw new ApiError(404, 'Building not found');
  }

  const activeEvents = await RouteStateEvent.find({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();

  return activeEvents.map((event) => ({
    id: String(event._id),
    scopeType: event.scopeType,
    scopeId: event.scopeId,
    status: event.status,
    expiresAt: event.expiresAt,
    createdBy: event.createdBy,
    note: event.note || '',
  }));
}

module.exports = {
  getBuildingDestinations,
  getBuildingEntrances,
  getBuildingState,
  getSession,
  reanchorSession,
  setDestination,
  startSession,
  updateProgress,
  updateRecovery,
};
