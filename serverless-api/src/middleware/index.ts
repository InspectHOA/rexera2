/**
 * Middleware exports for Rexera API
 */

export {
  authMiddleware,
  getCompanyFilter,
  clientDataMiddleware,
  type AuthUser
} from './auth';

export {
  rateLimitMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
  corsMiddleware,
  getEndpointRateLimit
} from './security';

export {
  errorHandlerMiddleware,
  APIError,
  APIErrors,
  type ErrorResponse
} from './error';