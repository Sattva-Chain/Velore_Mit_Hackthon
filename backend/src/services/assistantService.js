const NavigationSession = require('../models/NavigationSession');
const NavNode = require('../models/NavNode');
const Landmark = require('../models/Landmark');
const ApiError = require('../utils/ApiError');
const { planRoute, findNearestHelpDesk } = require('./graphService');

function normalize(text) {
  return String(text || '').toLowerCase().trim();
}

function simplifyInstruction(text) {
  return text
    .replace('Please ', '')
    .replace('continue for', 'go for')
    .replace(/\s+/g, ' ')
    .trim();
}

async function answerAssistantQuery(sessionId, query) {
  const session = await NavigationSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Navigation session not found');
  }

  const normalized = normalize(query);
  const currentNode = session.currentNodeId ? await NavNode.findById(session.currentNodeId).lean() : null;
  const destinationNode = session.destinationNodeId
    ? await NavNode.findById(session.destinationNodeId).lean()
    : null;

  if (normalized.includes('lost')) {
    session.status = 'recovering';
    session.confidence = 'low';
    session.currentInstruction =
      'I am switching to recovery mode. Please continue slowly or scan a nearby QR marker.';
    await session.save();
    return {
      responseText: session.currentInstruction,
      recoveryAction: 'enter_recovery',
      newInstruction: session.currentInstruction,
    };
  }

  if (normalized.includes('repeat')) {
    const responseText = normalized.includes('slow')
      ? simplifyInstruction(session.currentInstruction)
      : session.currentInstruction;
    return {
      responseText,
      newInstruction: responseText,
    };
  }

  if (normalized.includes('help desk')) {
    const nearestHelpDesk = await findNearestHelpDesk(
      session.floorId,
      session.currentNodeId || session.startNodeId,
      true,
    );

    if (!nearestHelpDesk) {
      return {
        responseText: 'I do not have a help desk route available right now.',
      };
    }

    session.destinationNodeId = nearestHelpDesk.node._id;
    session.route = { ...nearestHelpDesk.route, currentInstructionIndex: 0 };
    session.status = 'active';
    session.confidence = 'medium';
    session.progressEstimate = 0;
    session.currentInstruction = `Navigating to ${nearestHelpDesk.node.name}. ${nearestHelpDesk.route.instructions[0]?.text || ''}`.trim();
    await session.save();

    return {
      responseText: session.currentInstruction,
      rerouteAction: 'help_desk',
      newInstruction: session.currentInstruction,
    };
  }

  if (normalized.includes('lift')) {
    const lifts = await NavNode.find({ floorId: session.floorId, type: 'lift' }).lean();
    if (!lifts.length) {
      return { responseText: 'I do not have a lift mapped on this floor.' };
    }

    const lift = lifts[0];
    if (destinationNode && String(destinationNode._id) === String(lift._id)) {
      return { responseText: 'Yes, the lift lobby is your current destination.' };
    }

    try {
      const route = await planRoute({
        floorId: session.floorId,
        startNodeId: session.currentNodeId || session.startNodeId,
        destinationNodeId: lift._id,
        accessibleOnly: true,
      });
      const firstCue = route.instructions[0]?.text || 'The lift lobby is nearby.';
      return {
        responseText: `The lift lobby is nearby. ${firstCue}`,
      };
    } catch (_) {
      return { responseText: 'I cannot confirm the lift location from here yet.' };
    }
  }

  if (normalized.includes('left') || normalized.includes('nearby')) {
    const landmarks = await Landmark.find({
      $or: [
        ...(currentNode ? [{ nodeId: currentNode._id }] : []),
        ...(session.route?.instructions?.length
            ? [{ nodeId: session.route.instructions[0]?.targetNodeId }]
            : []),
      ],
    }).lean();

    if (!landmarks.length) {
      return {
        responseText: 'I do not have a mapped landmark right beside you yet.',
      };
    }

    const landmark = landmarks[0];
    return {
      responseText: landmark.optionalAudioNote || `${landmark.label} is nearby.`,
    };
  }

  if (normalized.includes('washroom')) {
    return {
      responseText: 'I do not have a washroom mapped on this floor in the demo dataset yet.',
    };
  }

  return {
    responseText: currentNode
        ? `You are near ${currentNode.name}. ${session.currentInstruction}`
        : session.currentInstruction,
    newInstruction: session.currentInstruction,
  };
}

module.exports = { answerAssistantQuery };
