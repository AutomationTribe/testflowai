/**
 * Shared error envelope (APID-007): { error, message, fields? }.
 * Every thrown HttpError maps to exactly one HTTP status + `error` value.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly error: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, error: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.error = error;
    this.fields = fields;
  }

  static unauthorized(message = 'Authentication required.'): HttpError {
    return new HttpError(401, 'unauthorized', message);
  }

  static forbidden(message = 'You do not have access to this resource.'): HttpError {
    return new HttpError(403, 'forbidden', message);
  }

  static notFound(message = 'Resource not found.'): HttpError {
    return new HttpError(404, 'not_found', message);
  }

  static validation(message: string, fields?: Record<string, string>): HttpError {
    return new HttpError(422, 'validation_error', message, fields);
  }

  static conflict(message: string): HttpError {
    return new HttpError(409, 'conflict', message);
  }

  static tooManyRequests(message: string): HttpError {
    return new HttpError(429, 'rate_limited', message);
  }

  static paymentRequired(message: string): HttpError {
    return new HttpError(402, 'payment_required', message);
  }

  static subscriptionRequired(message = 'An active trial or subscription is required.'): HttpError {
    return new HttpError(403, 'subscription_required', message);
  }
}
