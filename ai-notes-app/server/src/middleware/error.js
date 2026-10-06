import { HttpError } from '../utils/httpError.js';
import { config } from '../config.js';

export function notFound(req, res, next) {
  next(new HttpError(404, 'Route not found.', 'NOT_FOUND'));
}

// The only place errors become HTTP responses. Never leaks stack traces or provider details.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = 500;
  let message = 'Something went wrong. Please try again.';
  let code = 'INTERNAL_ERROR';

  if (err instanceof HttpError) ({ status, message, code } = err);
  else if (err.type === 'entity.parse.failed') [status, message, code] = [400, 'Invalid JSON body.', 'BAD_JSON'];
  else if (err.type === 'entity.too.large') [status, message, code] = [413, 'Request body is too large.', 'TOO_LARGE'];
  else if (config.nodeEnv !== 'test') console.error(err); // logged server-side only

  res.status(status).json({ error: { message, code } });
}
