const Floor = require('../models/Floor');
const NavNode = require('../models/NavNode');
const Edge = require('../models/Edge');
const Landmark = require('../models/Landmark');
const QrAnchor = require('../models/QrAnchor');
const RouteStateEvent = require('../models/RouteStateEvent');
const ApiError = require('../utils/ApiError');

function buildEdgeScopeId(edge) {
  return [String(edge.fromNodeId), String(edge.toNodeId)].sort().join('|');
}

function directionFromVectors(prevNode, currentNode, nextNode, fallback = 'straight') {
  if (!prevNode || !currentNode || !nextNode) {
    return fallback || 'straight';
  }

  const v1x = currentNode.x - prevNode.x;
  const v1y = currentNode.y - prevNode.y;
  const v2x = nextNode.x - currentNode.x;
  const v2y = nextNode.y - currentNode.y;
  const cross = (v1x * v2y) - (v1y * v2x);
  const dot = (v1x * v2x) + (v1y * v2y);

  if (Math.abs(cross) < 1 && dot >= 0) {
    return 'straight';
  }

  return cross > 0 ? 'left' : 'right';
}

function isActive(event) {
  return !event.expiresAt || event.expiresAt > new Date();
}

function edgeIsBlocked(edge, activeEvents) {
  const scopeId = buildEdgeScopeId(edge);
  return activeEvents.some(
    (event) =>
      event.scopeType === 'edge' &&
      event.scopeId === scopeId &&
      ['blocked', 'temporary_closure'].includes(event.status),
  );
}

function nodeIsBlocked(nodeId, activeEvents) {
  return activeEvents.some(
    (event) =>
      event.scopeType === 'node' &&
      event.scopeId === String(nodeId) &&
      ['blocked', 'temporary_closure', 'lift_outage'].includes(event.status),
  );
}

async function getFloorContext(floorId) {
  const floor = await Floor.findById(floorId).lean();
  if (!floor) {
    throw new ApiError(404, 'Floor not found');
  }

  const [nodes, edges, landmarks, anchors, routeEvents] = await Promise.all([
    NavNode.find({ floorId }).lean(),
    Edge.find({ floorId }).lean(),
    Landmark.find({}).lean(),
    QrAnchor.find({ active: true }).lean(),
    RouteStateEvent.find({ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).lean(),
  ]);

  const nodeMap = new Map(nodes.map((node) => [String(node._id), node]));

  return {
    floor,
    nodes,
    edges,
    nodeMap,
    landmarks: landmarks.filter(
      (landmark) =>
        (landmark.nodeId && nodeMap.has(String(landmark.nodeId))) ||
        (landmark.edgeId && edges.some((edge) => String(edge._id) === String(landmark.edgeId))),
    ),
    anchors: anchors.filter((anchor) => nodeMap.has(String(anchor.nodeId))),
    activeEvents: routeEvents.filter(isActive),
  };
}

function buildAdjacency(context, accessibleOnly = true) {
  const adjacency = new Map();

  for (const node of context.nodes) {
    adjacency.set(String(node._id), []);
  }

  for (const edge of context.edges) {
    const fromNode = context.nodeMap.get(String(edge.fromNodeId));
    const toNode = context.nodeMap.get(String(edge.toNodeId));

    if (!fromNode || !toNode) {
      continue;
    }

    if (accessibleOnly && (!edge.accessible || !fromNode.accessible || !toNode.accessible)) {
      continue;
    }

    if (
      edgeIsBlocked(edge, context.activeEvents) ||
      nodeIsBlocked(edge.fromNodeId, context.activeEvents) ||
      nodeIsBlocked(edge.toNodeId, context.activeEvents)
    ) {
      continue;
    }

    adjacency.get(String(edge.fromNodeId)).push(edge);
    adjacency.get(String(edge.toNodeId)).push({
      ...edge,
      fromNodeId: edge.toNodeId,
      toNodeId: edge.fromNodeId,
    });
  }

  return adjacency;
}

function reconstructPath(previousMap, startNodeId, endNodeId) {
  const path = [String(endNodeId)];
  let cursor = String(endNodeId);

  while (previousMap.has(cursor)) {
    cursor = previousMap.get(cursor);
    path.unshift(cursor);
  }

  return path[0] === String(startNodeId) ? path : [];
}

function buildInstructions(pathNodeIds, context) {
  const nodeIds = pathNodeIds.map(String);
  const instructions = [];
  let totalDistanceMeters = 0;

  for (let index = 1; index < nodeIds.length; index += 1) {
    const currentNode = context.nodeMap.get(nodeIds[index - 1]);
    const nextNode = context.nodeMap.get(nodeIds[index]);
    const edge = context.edges.find(
      (candidate) =>
        [String(candidate.fromNodeId), String(candidate.toNodeId)].sort().join('|') ===
        [nodeIds[index - 1], nodeIds[index]].sort().join('|'),
    );

    if (!currentNode || !nextNode || !edge) {
      continue;
    }

    totalDistanceMeters += edge.distanceM;
    const previousNode = index > 1 ? context.nodeMap.get(nodeIds[index - 2]) : null;
    const maneuver = directionFromVectors(previousNode, currentNode, nextNode, edge.defaultDirection);
    const landmark = context.landmarks.find(
      (item) =>
        (item.nodeId && String(item.nodeId) === nodeIds[index]) ||
        (item.edgeId && String(item.edgeId) === String(edge._id)),
    );

    let text = maneuver === 'straight'
      ? `Walk straight for ${Math.round(edge.distanceM)} meters to ${nextNode.name}.`
      : `Turn ${maneuver} and continue for ${Math.round(edge.distanceM)} meters to ${nextNode.name}.`;

    if (landmark?.optionalAudioNote) {
      text = `${text} ${landmark.optionalAudioNote}`;
    } else if (edge.landmarkHints?.length) {
      text = `${text} ${edge.landmarkHints[0]}.`;
    }

    instructions.push({
      order: instructions.length,
      text,
      distanceMeters: edge.distanceM,
      cumulativeDistanceMeters: totalDistanceMeters,
      maneuver,
      targetNodeId: String(nextNode._id),
      targetNodeName: nextNode.name,
    });
  }

  const destinationNode = context.nodeMap.get(nodeIds[nodeIds.length - 1]);
  if (destinationNode) {
    instructions.push({
      order: instructions.length,
      text: `You have arrived at ${destinationNode.name}.`,
      distanceMeters: 0,
      cumulativeDistanceMeters: totalDistanceMeters,
      maneuver: 'arrive',
      targetNodeId: String(destinationNode._id),
      targetNodeName: destinationNode.name,
    });
  }

  return {
    instructions,
    totalDistanceMeters,
  };
}

async function planRoute({ floorId, startNodeId, destinationNodeId, accessibleOnly = true }) {
  const context = await getFloorContext(floorId);
  const adjacency = buildAdjacency(context, accessibleOnly);
  const distances = new Map();
  const previousMap = new Map();
  const queue = new Set();

  for (const node of context.nodes) {
    const nodeId = String(node._id);
    distances.set(nodeId, Number.POSITIVE_INFINITY);
    queue.add(nodeId);
  }

  distances.set(String(startNodeId), 0);

  while (queue.size > 0) {
    const currentNodeId = [...queue].reduce((best, candidate) =>
      distances.get(candidate) < distances.get(best) ? candidate : best,
    );
    queue.delete(currentNodeId);

    if (currentNodeId === String(destinationNodeId)) {
      break;
    }

    for (const edge of adjacency.get(currentNodeId) || []) {
      const neighborId = String(edge.toNodeId);
      if (!queue.has(neighborId)) {
        continue;
      }

      const weight = Math.max(0.5, edge.distanceM - Math.min(edge.anchorPriority || 0, 0.75));
      const candidateDistance = distances.get(currentNodeId) + weight;

      if (candidateDistance < distances.get(neighborId)) {
        distances.set(neighborId, candidateDistance);
        previousMap.set(neighborId, currentNodeId);
      }
    }
  }

  const nodeIds = reconstructPath(previousMap, startNodeId, destinationNodeId);
  if (!nodeIds.length) {
    throw new ApiError(404, 'No accessible route is available for that destination right now.');
  }

  const routeSummary = buildInstructions(nodeIds, context);
  return {
    nodeIds,
    instructions: routeSummary.instructions,
    totalDistanceMeters: routeSummary.totalDistanceMeters,
  };
}

async function findEntrances(floorId) {
  return NavNode.find({ floorId, type: 'entrance', accessible: true }).sort({ name: 1 }).lean();
}

async function resolveAnchor(qrCodeValue) {
  const anchor = await QrAnchor.findOne({ qrCodeValue, active: true }).lean();
  if (!anchor) {
    throw new ApiError(404, 'QR anchor not found');
  }
  return anchor;
}

async function findNearestHelpDesk(floorId, startNodeId, accessibleOnly = true) {
  const helpDesks = await NavNode.find({ floorId, type: 'helpdesk' }).lean();
  if (!helpDesks.length) {
    return null;
  }

  let bestCandidate = null;

  for (const helpDesk of helpDesks) {
    try {
      const route = await planRoute({
        floorId,
        startNodeId,
        destinationNodeId: helpDesk._id,
        accessibleOnly,
      });

      if (!bestCandidate || route.totalDistanceMeters < bestCandidate.route.totalDistanceMeters) {
        bestCandidate = { node: helpDesk, route };
      }
    } catch (_) {
      // Ignore unreachable help desks.
    }
  }

  return bestCandidate;
}

module.exports = {
  buildEdgeScopeId,
  findEntrances,
  findNearestHelpDesk,
  getFloorContext,
  planRoute,
  resolveAnchor,
};
