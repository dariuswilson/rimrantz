const notFound = (res, msg = "Not found") =>
  res.status(404).json({ error: msg });

const forbidden = (res, msg = "Forbidden") =>
  res.status(403).json({ error: msg });

const unauthorized = (res, msg = "Unauthorized") =>
  res.status(401).json({ error: msg });

const badRequest = (res, msg = "Bad request") =>
  res.status(400).json({ error: msg });

const conflict = (res, msg = "Conflict") =>
  res.status(409).json({ error: msg });

const serverError = (res, msg = "Internal server error") =>
  res.status(500).json({ error: msg });

module.exports = { notFound, forbidden, unauthorized, badRequest, conflict, serverError };
