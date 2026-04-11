import jwt from "jsonwebtoken";

const fallbackSecret = "ved@123";
const secret = process.env.JWT_SECRET || fallbackSecret;

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Falling back to the development signing secret.");
}

export function createTokenForUser(user) {
  const payload = {
    _id: user._id,
  };
  return jwt.sign(payload, secret);
}

export function validateToken(token) {
  return jwt.verify(token, secret);
}
