export class AppError extends Error {
  /**
   * @param message      Internal, developer-facing error message.
   * @param userMessage  Safe message displayed to users / UI.
   * @param statusCode   HTTP-style status code (default 500).
   */
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    // Restore prototype chain (required when targeting ES5)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Centralised error handler. Logs detailed error to console and returns
 * a safe object for display or further processing.
 */
export const handleError = (error: unknown): { message: string; code: number } => {
  // eslint-disable-next-line no-console
  console.error('Application error:', error);

  if (error instanceof AppError) {
    return { message: error.userMessage, code: error.statusCode };
  }

  return { message: 'Something went wrong. Please try again.', code: 500 };
}; 