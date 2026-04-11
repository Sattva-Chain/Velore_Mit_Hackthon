const { planRoute } = require('./graphService');

async function computeRoute(options) {
  return planRoute(options);
}

module.exports = { computeRoute };
