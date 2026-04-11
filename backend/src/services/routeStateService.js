const RouteStateEvent = require('../models/RouteStateEvent');

async function listActiveRouteStates() {
  return RouteStateEvent.find({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();
}

module.exports = { listActiveRouteStates };
