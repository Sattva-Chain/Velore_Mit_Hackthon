const userModule = require("../models/user");
const organizationModel = require("../models/organization");
const authService = require("../services/authentication");

const User = userModule.default || userModule;
const Organization = organizationModel.default || organizationModel;
const { validateToken, buildSafeUser } = authService;

async function resolveAuthUserFromHeader(authHeader) {
  if (!authHeader || !/^Bearer\s+/i.test(String(authHeader))) return null;
  const token = String(authHeader).replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  try {
    const payload = validateToken(token);
    if (!payload?._id) return null;
    const user = await User.findById(payload._id);
    if (!user) return null;
    return user;
  } catch {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  const user = await resolveAuthUserFromHeader(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  req.authUser = user;
  req.auth = buildSafeUser(user);
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.authUser?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ success: false, message: "You do not have access to this resource." });
    }
    return next();
  };
}

function requireOrganizationOwner(req, res, next) {
  if (req.authUser?.role !== "ORG_OWNER") {
    return res.status(403).json({ success: false, message: "Organization owner access required." });
  }
  return next();
}

async function requireOrganizationMember(req, res, next) {
  const organizationId = String(req.params.id || req.body.organizationId || "");
  const userOrgId = req.authUser?.organizationId ? String(req.authUser.organizationId) : null;

  if (!organizationId) {
    return res.status(400).json({ success: false, message: "Organization id is required." });
  }

  if (req.authUser?.role === "ORG_OWNER" && userOrgId === organizationId) {
    return next();
  }

  if (userOrgId === organizationId) {
    return next();
  }

  const organization = await Organization.findById(organizationId).select("_id members owner");
  if (!organization) {
    return res.status(404).json({ success: false, message: "Organization not found." });
  }

  const memberIds = (organization.members || []).map((memberId) => String(memberId));
  const isMember = memberIds.includes(String(req.authUser?._id));
  const isOwner = String(organization.owner) === String(req.authUser?._id);

  if (!isMember && !isOwner) {
    return res.status(403).json({ success: false, message: "You are not a member of this organization." });
  }

  req.organization = organization;
  return next();
}

module.exports = {
  authMiddleware,
  requireRole,
  requireOrganizationOwner,
  requireOrganizationMember,
  resolveAuthUserFromHeader,
};
