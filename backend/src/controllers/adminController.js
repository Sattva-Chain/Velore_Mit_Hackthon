const AdminUser = require('../models/AdminUser');
const Building = require('../models/Building');
const DestinationAlias = require('../models/DestinationAlias');
const Floor = require('../models/Floor');
const NavNode = require('../models/NavNode');
const Edge = require('../models/Edge');
const QrAnchor = require('../models/QrAnchor');
const Landmark = require('../models/Landmark');
const RouteStateEvent = require('../models/RouteStateEvent');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const adminUser = await AdminUser.findOne({ email: req.validated.body.email }).lean();
  if (!adminUser || req.validated.body.password != adminUser.passwordHash) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  return res.status(200).json({
    token: 'demo-admin-token',
    user: {
      id: String(adminUser._id),
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    },
  });
});

const getDashboard = asyncHandler(async (_req, res) => {
  const [buildings, floors, nodes, edges, anchors, landmarks, routeStates] = await Promise.all([
    Building.countDocuments(),
    Floor.countDocuments(),
    NavNode.countDocuments(),
    Edge.countDocuments(),
    QrAnchor.countDocuments(),
    Landmark.countDocuments(),
    RouteStateEvent.countDocuments(),
  ]);

  res.status(200).json({
    buildings,
    floors,
    nodes,
    edges,
    anchors,
    landmarks,
    routeStates,
  });
});

const createBuilding = asyncHandler(async (req, res) => {
  const building = await Building.create(req.validated.body);
  res.status(201).json(building);
});

const createFloor = asyncHandler(async (req, res) => {
  const floor = await Floor.create(req.validated.body);
  await Building.findByIdAndUpdate(req.validated.body.buildingId, {
    $addToSet: { floors: floor._id },
  });
  res.status(201).json(floor);
});

const createNode = asyncHandler(async (req, res) => {
  const node = await NavNode.create(req.validated.body);
  res.status(201).json(node);
});

const createEdge = asyncHandler(async (req, res) => {
  const edge = await Edge.create(req.validated.body);
  res.status(201).json(edge);
});

const createAnchor = asyncHandler(async (req, res) => {
  const anchor = await QrAnchor.create(req.validated.body);
  res.status(201).json(anchor);
});

const createLandmark = asyncHandler(async (req, res) => {
  const landmark = await Landmark.create(req.validated.body);
  res.status(201).json(landmark);
});

const createDestinationAlias = asyncHandler(async (req, res) => {
  const alias = await DestinationAlias.create(req.validated.body);
  res.status(201).json(alias);
});

const createRouteState = asyncHandler(async (req, res) => {
  const routeState = await RouteStateEvent.create({
    ...req.validated.body,
    expiresAt: req.validated.body.expiresAt ? new Date(req.validated.body.expiresAt) : null,
  });
  res.status(201).json(routeState);
});

const listBuildings = asyncHandler(async (_req, res) => {
  res.status(200).json(await Building.find({}).lean());
});

const listFloors = asyncHandler(async (_req, res) => {
  res.status(200).json(await Floor.find({}).lean());
});

const listNodes = asyncHandler(async (_req, res) => {
  res.status(200).json(await NavNode.find({}).lean());
});

const listEdges = asyncHandler(async (_req, res) => {
  res.status(200).json(await Edge.find({}).lean());
});

const listAnchors = asyncHandler(async (_req, res) => {
  res.status(200).json(await QrAnchor.find({}).lean());
});

const listLandmarks = asyncHandler(async (_req, res) => {
  res.status(200).json(await Landmark.find({}).lean());
});

const listDestinationAliases = asyncHandler(async (_req, res) => {
  res.status(200).json(await DestinationAlias.find({}).lean());
});

const listRouteStates = asyncHandler(async (_req, res) => {
  res.status(200).json(await RouteStateEvent.find({}).lean());
});

const publishFloor = asyncHandler(async (req, res) => {
  const floor = await Floor.findByIdAndUpdate(
    req.validated.params.floorId,
    { isPublished: true },
    { new: true },
  );
  res.status(200).json(floor);
});

module.exports = {
  createDestinationAlias,
  createAnchor,
  createBuilding,
  createEdge,
  createFloor,
  createLandmark,
  createNode,
  createRouteState,
  getDashboard,
  listAnchors,
  listBuildings,
  listDestinationAliases,
  listEdges,
  listFloors,
  listLandmarks,
  listNodes,
  listRouteStates,
  login,
  publishFloor,
};
