const express = require('express');
const validate = require('../middlewares/validate');
const controller = require('../controllers/navigationController');
const schemas = require('../validations/navigationSchemas');

const router = express.Router();

router.post('/start', validate(schemas.startNavigationSchema), controller.startNavigation);
router.post('/:sessionId/destination', validate(schemas.destinationSchema), controller.setDestination);
router.post('/:sessionId/progress', validate(schemas.progressSchema), controller.updateProgress);
router.post('/:sessionId/anchor', validate(schemas.anchorSchema), controller.reanchorNavigation);
router.post('/:sessionId/recovery', validate(schemas.recoverySchema), controller.updateRecovery);
router.post('/:sessionId/assistant', validate(schemas.assistantSchema), controller.assistantQuery);
router.get('/:sessionId', validate(schemas.sessionSchema), controller.getSession);

module.exports = router;
