import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(app) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.Mysql2()
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || 'development',
    beforeSend(event) {
      // Filter out health check errors
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }
      return event;
    }
  });

  console.log('Sentry initialized for error tracking');
}

/**
 * Express middleware for Sentry request handling
 */
export const sentryMiddleware = Sentry.Handlers.requestHandler();

/**
 * Express middleware for Sentry error handling
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

/**
 * Capture custom error with context
 */
export function captureError(error, context = {}) {
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
}

/**
 * Add user context to Sentry
 */
export function setUserContext(user) {
  Sentry.setUser({
    id: user.id,
    username: user.name,
    email: user.email
  });
}

export default Sentry;
