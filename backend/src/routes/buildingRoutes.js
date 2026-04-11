const express = require('express');
const controller = require('../controllers/buildingController');

const router = express.Router();

router.get('/:buildingId/destinations', controller.getDestinations);
router.get('/:buildingId/entrances', controller.getEntrances);
router.get('/:buildingId/state', controller.getBuildingState);

module.exports = router;
