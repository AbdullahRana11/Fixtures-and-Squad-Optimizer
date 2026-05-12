// frontend/src/api/apiClient.ts
// ============================================================
// Improved API Client with Error Handling & Retries
// Replace: frontend/src/api/api.ts (or layer on top)
// ============================================================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  status?: number;
}

export interface RequestOptions {
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private maxRetries = 3;
  private retryDelay = 1000; // ms
  private timeout = 30000; // 30 seconds
  private requestIdCounter = 0;

  constructor(baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate unique request ID for tracing
   */
  private getRequestId(): string {
    return `${Date.now()}-${++this.requestIdCounter}`;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(status: number): boolean {
    // Retry on server errors (5xx), timeout (408), rate limit (429)
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Main request method with retry logic
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { maxRetries = this.maxRetries, timeout = this.timeout, headers = {} } = options;
    const requestId = this.getRequestId();

    return this._requestWithRetry<T>(method, path, body, 0, maxRetries, requestId, headers, timeout);
  }

  /**
   * Internal method with retry loop
   */
  private async _requestWithRetry<T>(
    method: string,
    path: string,
    body: unknown,
    attempt: number,
    maxRetries: number,
    requestId: string,
    headers: Record<string, string>,
    timeout: number
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!res.ok) {
        const errorData = await this._parseErrorResponse(res);
        const error: ApiError = {
          code: errorData.code || `HTTP_${res.status}`,
          message: errorData.message || res.statusText,
          details: errorData.details,
          status: res.status,
          retryable: this.isRetryable(res.status),
        };

        // Retry on transient errors
        if (error.retryable && attempt < maxRetries) {
          const delayMs = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.warn(
            `[API] ${method} ${path} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms`,
            { requestId, status: res.status }
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this._requestWithRetry<T>(method, path, body, attempt + 1, maxRetries, requestId, headers, timeout);
        }

        throw error;
      }

      // Parse successful response
      return (await res.json()) as T;
    } catch (err: any) {
      // Handle timeout and network errors
      if (err.name === 'AbortError') {
        const timeoutError: ApiError = {
          code: 'REQUEST_TIMEOUT',
          message: `Request timed out after ${timeout}ms`,
          retryable: true,
          status: 408,
        };

        if (attempt < maxRetries) {
          const delayMs = this.retryDelay * Math.pow(2, attempt);
          console.warn(
            `[API] ${method} ${path} timed out, retrying in ${delayMs}ms`,
            { requestId }
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this._requestWithRetry<T>(method, path, body, attempt + 1, maxRetries, requestId, headers, timeout);
        }

        throw timeoutError;
      }

      // Handle network errors (typically retryable)
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        const networkError: ApiError = {
          code: 'NETWORK_ERROR',
          message: 'Network request failed. Please check your connection.',
          retryable: true,
        };

        if (attempt < maxRetries) {
          const delayMs = this.retryDelay * Math.pow(2, attempt);
          console.warn(
            `[API] ${method} ${path} network error, retrying in ${delayMs}ms`,
            { requestId }
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this._requestWithRetry<T>(method, path, body, attempt + 1, maxRetries, requestId, headers, timeout);
        }

        throw networkError;
      }

      // Unknown error
      console.error(`[API] ${method} ${path} error:`, err, { requestId });
      throw {
        code: 'UNKNOWN_ERROR',
        message: err?.message || 'An unknown error occurred',
        retryable: false,
      };
    }
  }

  /**
   * Parse error response safely
   */
  private async _parseErrorResponse(res: Response) {
    try {
      return await res.json();
    } catch {
      return { message: res.statusText };
    }
  }

  /**
   * Convenience methods
   */
  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>('PUT', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Usage Example:
 * 
 * try {
 *   const teams = await apiClient.get<TeamsResponse>('/api/fixtures/teams/pl');
 *   console.log(teams);
 * } catch (err: any) {
 *   if (err.retryable) {
 *     console.log('Temporary error, will retry');
 *   } else {
 *     console.error('Permanent error:', err.message);
 *   }
 * }
 */
