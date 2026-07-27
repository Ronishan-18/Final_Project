const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN'
]);

const isTransientError = (error) => {
  const message = (error?.message || '').toLowerCase();
  const code = error?.code || '';

  return TRANSIENT_ERROR_CODES.has(code) || message.includes('timeout') || message.includes('connection lost') || message.includes('connect');
};

export const queryWithRetry = async (operation, { attempts = 3, delayMs = 1000 } = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransientError(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
};
