const express = require("express");
const {
  register,
  login,
  logout,
  getCurrentUser,
  getInviteDetails,
  acceptInvite,
  setPassword,
  listMyVulnerabilities,
  getMyVulnerabilitySummary,
} = require("../controllers/auth");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/invite/:token", getInviteDetails);
router.post("/invite/accept", acceptInvite);
router.post("/set-password", authMiddleware, setPassword);
router.get("/vulnerabilities", authMiddleware, listMyVulnerabilities);
router.get("/vulnerabilities/summary", authMiddleware, getMyVulnerabilitySummary);

module.exports = router;
