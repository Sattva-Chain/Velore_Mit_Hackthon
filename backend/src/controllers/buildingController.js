const asyncHandler = require('../utils/asyncHandler');
const navigationService = require('../services/navigationService');

const getDestinations = asyncHandler(async (req, res) => {
  const payload = await navigationService.getBuildingDestinations(req.params.buildingId);
  res.status(200).json(payload);
});

const getEntrances = asyncHandler(async (req, res) => {
  const payload = await navigationService.getBuildingEntrances(req.params.buildingId);
  res.status(200).json(payload);
});

const getBuildingState = asyncHandler(async (req, res) => {
  const payload = await navigationService.getBuildingState(req.params.buildingId);
  res.status(200).json(payload);
});

module.exports = {
  getBuildingState,
  getDestinations,
  getEntrances,
};
