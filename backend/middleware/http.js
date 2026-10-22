import { STATUS_CODES } from 'node:http';
export function logger(req, res, next) {
  res.on('finish', () => console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${STATUS_CODES[res.statusCode]}`));
  next();
}
export function authenticate(req, res, next) {
  if (req.get('Authorization') !== 'Bearer race-control-token') return res.status(401).set('WWW-Authenticate', 'Bearer').json({ status: 401, error: 'Unauthorized', message: 'Authentication is required to access Race Control' });
  next();
}
export function steward(req, res, next) {
  if (req.get('x-role') !== 'steward') return res.status(403).json({ status: 403, error: 'Forbidden', message: 'Only race stewards can issue a red flag' });
  next();
}
