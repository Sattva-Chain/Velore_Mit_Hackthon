const asyncHandler = require('../utils/asyncHandler');
const navigationService = require('../services/navigationService');
const { answerAssistantQuery } = require('../services/assistantService');

const startNavigation = asyncHandler(async (req, res) => {
  const payload = await navigationService.startSession(req.validated.body);
  res.status(201).json(payload);
});

const setDestination = asyncHandler(async (req, res) => {
  const payload = await navigationService.setDestination(
    req.validated.params.sessionId,
    req.validated.body,
  );
  res.status(200).json(payload);
});

const updateProgress = asyncHandler(async (req, res) => {
  const payload = await navigationService.updateProgress(
    req.validated.params.sessionId,
    req.validated.body,
  );
  res.status(200).json(payload);
});

const reanchorNavigation = asyncHandler(async (req, res) => {
  const payload = await navigationService.reanchorSession(
    req.validated.params.sessionId,
    req.validated.body,
  );
  res.status(200).json(payload);
});

const updateRecovery = asyncHandler(async (req, res) => {
  const payload = await navigationService.updateRecovery(
    req.validated.params.sessionId,
    req.validated.body,
  );
  res.status(200).json(payload);
});

const getSession = asyncHandler(async (req, res) => {
  const payload = await navigationService.getSession(req.validated.params.sessionId);
  res.status(200).json(payload);
});

const assistantQuery = asyncHandler(async (req, res) => {
  const payload = await answerAssistantQuery(
    req.validated.params.sessionId,
    req.validated.body.query,
  );
  res.status(200).json(payload);
});

module.exports = {
  assistantQuery,
  getSession,
  reanchorNavigation,
  setDestination,
  startNavigation,
  updateProgress,
  updateRecovery,
};
