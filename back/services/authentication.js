import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "ved@123";
const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

export function buildAuthPayload(user) {
  return {
    _id: user._id,
    email: user.email || user.emailId || null,
    role: user.role || user.userType || null,
    organizationId: user.organizationId || null,
    companyId: user.companyId || null,
    userType: user.userType || null,
  };
}

export function buildSafeUser(user) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name || user.companyName || null,
    email: user.email || user.emailId || null,
    role: user.role || user.userType || null,
    organizationId: user.organizationId || null,
    companyId: user.companyId || null,
    userType: user.userType || null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

export function createTokenForUser(user) {
  return jwt.sign(buildAuthPayload(user), secret, { expiresIn });
}

export function validateToken(token) {
  return jwt.verify(token, secret);
}
