const Building = require('../models/Building');
const Floor = require('../models/Floor');
const NavNode = require('../models/NavNode');
const Edge = require('../models/Edge');
const QrAnchor = require('../models/QrAnchor');
const Landmark = require('../models/Landmark');
const DestinationAlias = require('../models/DestinationAlias');
const RouteStateEvent = require('../models/RouteStateEvent');
const NavigationSession = require('../models/NavigationSession');
const RecoveryEvent = require('../models/RecoveryEvent');
const AdminUser = require('../models/AdminUser');
const { demoBuilding } = require('../utils/seedData');
const { buildEdgeScopeId } = require('./graphService');

async function clearDemoData() {
  await Promise.all([
    RecoveryEvent.deleteMany({}),
    NavigationSession.deleteMany({}),
    RouteStateEvent.deleteMany({}),
    DestinationAlias.deleteMany({}),
    Landmark.deleteMany({}),
    QrAnchor.deleteMany({}),
    Edge.deleteMany({}),
    NavNode.deleteMany({}),
    Floor.deleteMany({}),
    Building.deleteMany({}),
    AdminUser.deleteMany({}),
  ]);
}

async function seedDemoData() {
  await clearDemoData();

  const building = await Building.create(demoBuilding.building);
  const floor = await Floor.create({
    ...demoBuilding.floor,
    buildingId: building._id,
  });

  building.floors = [floor._id];
  await building.save();

  const createdNodes = await NavNode.insertMany(
    demoBuilding.nodes.map((node) => ({
      floorId: floor._id,
      type: node.type,
      name: node.name,
      x: node.x,
      y: node.y,
      headingHint: node.headingHint,
      qrOptional: node.qrOptional,
      accessible: node.accessible,
    })),
  );

  const nodeIdByCode = new Map();
  demoBuilding.nodes.forEach((node, index) => {
    nodeIdByCode.set(node.code, createdNodes[index]._id);
  });

  const createdEdges = await Edge.insertMany(
    demoBuilding.edges.map((edge) => ({
      floorId: floor._id,
      fromNodeId: nodeIdByCode.get(edge.from),
      toNodeId: nodeIdByCode.get(edge.to),
      distanceM: edge.distanceM,
      accessible: edge.accessible,
      defaultDirection: edge.defaultDirection,
      anchorPriority: edge.anchorPriority,
      landmarkHints: edge.landmarkHints || [],
    })),
  );

  await QrAnchor.insertMany(
    demoBuilding.anchors.map((anchor) => ({
      nodeId: nodeIdByCode.get(anchor.nodeCode),
      qrCodeValue: anchor.qrCodeValue,
      active: anchor.active,
      mountHeightCm: anchor.mountHeightCm,
    })),
  );

  await Landmark.insertMany(
    demoBuilding.landmarks.map((landmark) => ({
      nodeId: nodeIdByCode.get(landmark.nodeCode),
      label: landmark.label,
      optionalAudioNote: landmark.optionalAudioNote,
      sideHint: landmark.sideHint || '',
    })),
  );

  await DestinationAlias.insertMany(
    demoBuilding.aliases.map((alias) => ({
      nodeId: nodeIdByCode.get(alias.nodeCode),
      aliasText: alias.aliasText,
    })),
  );

  const edgeByScope = new Map(createdEdges.map((edge) => [buildEdgeScopeId(edge), edge]));

  await RouteStateEvent.insertMany(
    demoBuilding.routeStateEvents.map((event) => {
      if (event.scopeType === 'edge') {
        const [fromCode, toCode] = event.scopeCode.split('|');
        const edge = edgeByScope.get(
          [String(nodeIdByCode.get(fromCode)), String(nodeIdByCode.get(toCode))].sort().join('|'),
        );
        return {
          scopeType: 'edge',
          scopeId: buildEdgeScopeId(edge),
          status: event.status,
          expiresAt: new Date(Date.now() + (event.expiresAtDays || 1) * 24 * 60 * 60 * 1000),
          createdBy: event.createdBy,
          note: event.note || '',
        };
      }

      return {
        scopeType: event.scopeType,
        scopeId: event.scopeCode,
        status: event.status,
        expiresAt: new Date(Date.now() + (event.expiresAtDays || 1) * 24 * 60 * 60 * 1000),
        createdBy: event.createdBy,
        note: event.note || '',
      };
    }),
  );

  const adminUser = await AdminUser.create({
    name: 'Demo Admin',
    email: 'admin@navmate.live',
    passwordHash: 'admin123',
    role: 'admin',
  });

  return {
    adminEmail: adminUser.email,
    buildingId: String(building._id),
    floorId: String(floor._id),
  };
}

module.exports = { seedDemoData };
