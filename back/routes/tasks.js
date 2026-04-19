const express = require("express");
const taskController = require("../controllers/tasks");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authMiddleware, requireRole("ORG_OWNER", "SOLO_DEVELOPER"), taskController.createTask);
router.get("/", authMiddleware, taskController.listTasks);
router.get("/:id", authMiddleware, taskController.getTask);
router.patch("/:id/status", authMiddleware, taskController.updateTaskStatus);

module.exports = router;
