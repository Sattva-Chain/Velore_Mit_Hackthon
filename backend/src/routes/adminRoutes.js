const express = require('express');
const controller = require('../controllers/adminController');
const validate = require('../middlewares/validate');
const schemas = require('../validations/adminSchemas');

const router = express.Router();

router.post('/login', validate(schemas.adminLoginSchema), controller.login);
router.get('/dashboard', controller.getDashboard);
router.get('/buildings', controller.listBuildings);
router.get('/floors', controller.listFloors);
router.get('/nodes', controller.listNodes);
router.get('/edges', controller.listEdges);
router.get('/anchors', controller.listAnchors);
router.get('/landmarks', controller.listLandmarks);
router.get('/destination-aliases', controller.listDestinationAliases);
router.get('/route-state', controller.listRouteStates);
router.post('/buildings', validate(schemas.buildingSchema), controller.createBuilding);
router.post('/floors', validate(schemas.floorSchema), controller.createFloor);
router.post('/nodes', validate(schemas.nodeSchema), controller.createNode);
router.post('/edges', validate(schemas.edgeSchema), controller.createEdge);
router.post('/anchors', validate(schemas.anchorSchema), controller.createAnchor);
router.post('/landmarks', validate(schemas.landmarkSchema), controller.createLandmark);
router.post(
  '/destination-aliases',
  validate(schemas.destinationAliasSchema),
  controller.createDestinationAlias,
);
router.post('/route-state', validate(schemas.routeStateSchema), controller.createRouteState);
router.post('/publish/:floorId', validate(schemas.publishFloorSchema), controller.publishFloor);

module.exports = router;
