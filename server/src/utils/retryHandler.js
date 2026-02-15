export const calculateBackoff = (retryCount) => {
    // Exponential backoff: 2^retryCount * base_delay (e.g., 5 minutes)
    // Retry 0: 5 mins
    // Retry 1: 10 mins
    // Retry 2: 20 mins
    // Retry 3: 40 mins
    const baseDelay = 5 * 60 * 1000; // 5 minutes in milliseconds
    const delay = Math.pow(2, retryCount) * baseDelay;

    // Add some jitter to avoid thundering herd (optional, but good practice)
    const jitter = Math.random() * 1000 * 60; // Up to 1 minute jitter

    return new Date(Date.now() + delay + jitter);
};

export const isRetryableError = (error) => {
    // Network errors, 5xx server errors, rate limits (429) are usually retryable
    // Auth errors (401, 403), Bad Request (400) are usually NOT retryable

    if (!error) return true; // Default to retry if unknown

    const message = error.message?.toLowerCase() || "";

    // Non-retryable patterns
    if (
        message.includes("auth") ||
        message.includes("token") ||
        message.includes("permission") ||
        message.includes("invalid") ||
        (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429)
    ) {
        return false;
    }

    return true;
};
