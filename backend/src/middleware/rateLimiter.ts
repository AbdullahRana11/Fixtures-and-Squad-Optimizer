// backend/src/middleware/rateLimiter.ts
// ============================================================
// Rate Limiting Middleware
// Install: npm install express-rate-limit
// ============================================================

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Standard API rate limiter (100 requests per 15 min)
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for specific conditions
  skip: (req) => {
    // Allow requests from internal IP
    const clientIp = req.ip || req.socket.remoteAddress || '';
    return clientIp === '127.0.0.1' || clientIp === '::1';
  },
});

/**
 * Strict rate limiter for expensive operations (5 per minute)
 */
export const strictLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. This operation is expensive. Please try again in 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.headers['x-api-key'] === process.env.INTERNAL_API_KEY;
  },
});

/**
 * Moderate rate limiter for optimization endpoints (10 per minute)
 */
export const optimizeLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many optimization requests. Please try again in 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.headers['x-api-key'] === process.env.INTERNAL_API_KEY;
  },
});

/**
 * Very strict limiter for authentication endpoints (3 per minute)
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again in 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom rate limiter with per-user tracking (if you add user auth)
 */
export const createUserLimiter = (
  windowMs: number,
  maxRequests: number
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use user ID if available, otherwise use IP
      return (req as any).user?.id || req.ip || 'unknown';
    },
    message: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Middleware to apply stricter limits during high load
 * You can use this in combination with monitoring
 */
export const adaptiveLimiter = (loadPercentage: number): RateLimitRequestHandler => {
  const isHighLoad = loadPercentage > 80;
  return isHighLoad ? strictLimiter : apiLimiter;
};

/**
 * Custom response formatter for rate limit errors
 */
export const rateLimitErrorHandler = (
  req: Request,
  res: Response,
  next: any,
  options: any
) => {
  res.status(429).json({
    code: 'RATE_LIMIT_EXCEEDED',
    message: options.message || 'Too many requests',
    retryAfter: req.rateLimit?.resetTime
      ? Math.ceil((new Date(req.rateLimit.resetTime).getTime() - Date.now()) / 1000)
      : undefined,
  });
};
