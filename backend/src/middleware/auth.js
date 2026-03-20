const { authClient } = require("../services/supabase");
const { unauthorized } = require("../lib/errors");

// Verifies the Supabase JWT from Authorization: Bearer <token>
// Sets req.user to the verified Supabase user object
async function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return unauthorized(res, "Missing auth token");

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return unauthorized(res, "Invalid or expired token");

  req.user = data.user;
  next();
}

module.exports = { requireAuth };
