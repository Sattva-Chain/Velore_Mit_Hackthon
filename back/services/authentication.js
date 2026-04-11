import  jwt  from "jsonwebtoken";
const secret = "ved@123";
export function createTokenForUser(user) {
  const payload = {
    _id: user._id,
  };
  const token = jwt.sign(payload, secret);
  return token;
}
export function validateToken(token) {
  const payload = jwt.verify(token, secret);
  return payload;
}
