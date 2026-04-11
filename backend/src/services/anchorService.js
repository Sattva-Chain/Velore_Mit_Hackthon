const { resolveAnchor } = require('./graphService');

async function resolveQrAnchor(qrCodeValue) {
  return resolveAnchor(qrCodeValue);
}

module.exports = { resolveQrAnchor };
