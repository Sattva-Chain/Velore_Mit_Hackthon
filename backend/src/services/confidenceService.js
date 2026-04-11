function initialConfidence({ usedQr, explicitStart }) {
  if (usedQr) {
    return 'high';
  }

  if (explicitStart) {
    return 'medium';
  }

  return 'medium';
}

function evaluateProgressConfidence(session, payload = {}) {
  if (payload.forceRecovery || payload.offRoute || payload.confidenceHint === 'low' || payload.confidenceHint === 'LOW') {
    return 'low';
  }

  const totalDistance = session.route?.totalDistanceMeters || 0;
  const progressEstimate = payload.progressEstimate ?? session.progressEstimate ?? 0;

  if (totalDistance > 0 && progressEstimate > totalDistance + 4) {
    return 'low';
  }

  if (session.lastAnchorNodeId) {
    return progressEstimate > 18 ? 'medium' : 'high';
  }

  return progressEstimate > 10 ? 'medium' : session.confidence || 'medium';
}

module.exports = {
  evaluateProgressConfidence,
  initialConfidence,
};
