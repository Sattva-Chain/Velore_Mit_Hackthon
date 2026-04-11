const DestinationAlias = require('../models/DestinationAlias');
const Floor = require('../models/Floor');
const NavNode = require('../models/NavNode');
const { levenshtein } = require('../utils/levenshtein');

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildScore(input, candidate) {
  const normalizedInput = normalize(input);
  const normalizedCandidate = normalize(candidate);

  if (!normalizedInput || !normalizedCandidate) {
    return 0;
  }

  if (normalizedInput === normalizedCandidate) {
    return 1;
  }

  if (normalizedCandidate.includes(normalizedInput) || normalizedInput.includes(normalizedCandidate)) {
    return 0.9;
  }

  const inputTokens = normalizedInput.split(' ');
  const candidateTokens = normalizedCandidate.split(' ');
  const overlap = inputTokens.filter((token) => candidateTokens.includes(token)).length;
  const overlapScore = overlap / Math.max(inputTokens.length, candidateTokens.length);
  const distance = levenshtein(normalizedInput, normalizedCandidate);
  const distanceScore = 1 - (distance / Math.max(normalizedInput.length, normalizedCandidate.length));

  return Math.max(overlapScore * 0.8, distanceScore * 0.75);
}

async function listDestinations(buildingId) {
  const floors = await Floor.find({ buildingId }).select('_id').lean();
  const floorIds = floors.map((floor) => floor._id);
  const nodes = await NavNode.find({ floorId: { $in: floorIds }, accessible: true }).lean();
  const aliases = await DestinationAlias.find({}).lean();

  return aliases
    .map((alias) => {
      const node = nodes.find((item) => String(item._id) === String(alias.nodeId));
      if (!node) {
        return null;
      }

      return {
        nodeId: String(node._id),
        aliasText: alias.aliasText,
        nodeName: node.name,
        type: node.type,
        buildingId,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.aliasText.localeCompare(right.aliasText));
}

async function matchDestination({ destinationText, floorId }) {
  const aliases = await DestinationAlias.find({}).lean();
  const nodes = await NavNode.find({ floorId }).lean();
  const nodeMap = new Map(nodes.map((node) => [String(node._id), node]));

  const ranked = aliases
    .map((alias) => {
      const node = nodeMap.get(String(alias.nodeId));
      if (!node) {
        return null;
      }

      return {
        nodeId: String(node._id),
        aliasText: alias.aliasText,
        nodeName: node.name,
        type: node.type,
        score: Math.max(
          buildScore(destinationText, alias.aliasText),
          buildScore(destinationText, node.name),
        ),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  const topMatches = ranked.slice(0, 5);
  const bestMatch = topMatches[0] || null;

  return {
    bestMatch: bestMatch && bestMatch.score >= 0.72 ? bestMatch : null,
    topMatches,
  };
}

module.exports = {
  listDestinations,
  matchDestination,
};
