const RecoveryEvent = require('../models/RecoveryEvent');
const { findNearestHelpDesk } = require('./graphService');

async function createRecoveryEvent(sessionId, state, anchorNodeId = null, note = '') {
  return RecoveryEvent.create({
    sessionId,
    state,
    anchorNodeId,
    note,
  });
}

async function buildRecoveryOptions(session) {
  const options = [
    {
      action: 'scan_qr',
      label: 'Scan QR',
      description: 'Use a nearby QR marker to confirm your exact location.',
    },
    {
      action: 'repeat_last',
      label: 'Repeat last cue',
      description: 'Hear the previous guidance again.',
    },
  ];

  if (session.lastAnchorNodeId) {
    options.push({
      action: 'return_to_anchor',
      label: 'Return to last confirmed point',
      description: 'Head back to the last point confirmed by QR or start selection.',
    });
  }

  const nearestHelpDesk = await findNearestHelpDesk(
    session.floorId,
    session.currentNodeId || session.startNodeId,
    true,
  );

  if (nearestHelpDesk) {
    options.push({
      action: 'nearest_helpdesk',
      label: 'Nearest Help Desk',
      description: `Route to ${nearestHelpDesk.node.name} for in-person help.`,
      nodeId: String(nearestHelpDesk.node._id),
    });
  }

  return options;
}

module.exports = {
  buildRecoveryOptions,
  createRecoveryEvent,
};
