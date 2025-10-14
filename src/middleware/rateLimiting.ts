import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limiting for password reset requests (per IP)
export const resetRequestIPLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { message: 'If an account exists, we sent instructions.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
});

// Rate limiting for resend requests (per IP)
export const resendIPLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 resend requests per minute per IP
  message: { message: 'If an account exists, we resent instructions.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'test';
  },
});

// In-memory store for account-level rate limiting
const accountLimits = new Map<string, { count: number; resetTime: number }>();
const ACCOUNT_LIMIT_WINDOW = 60 * 1000; // 1 minute

export const resetRequestAccountLimit = (maxAttempts: number = 3) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const email = req.body.email?.toLowerCase();
    if (!email) {
      return next();
    }

    const now = Date.now();
    const limit = accountLimits.get(email);

    if (limit) {
      if (now < limit.resetTime) {
        if (limit.count >= maxAttempts) {
          // Still return generic response to prevent enumeration
          return res.status(200).json({ 
            message: 'If an account exists, we sent instructions.' 
          });
        }
        limit.count += 1;
      } else {
        // Reset window
        limit.count = 1;
        limit.resetTime = now + ACCOUNT_LIMIT_WINDOW;
      }
    } else {
      accountLimits.set(email, {
        count: 1,
        resetTime: now + ACCOUNT_LIMIT_WINDOW,
      });
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.1) {
      for (const [key, value] of accountLimits.entries()) {
        if (now > value.resetTime) {
          accountLimits.delete(key);
        }
      }
    }

    next();
  };
};

// Rate limiting for token exchange/validation attempts
const tokenAttempts = new Map<string, { count: number; resetTime: number }>();
const TOKEN_ATTEMPT_WINDOW = 60 * 1000; // 1 minute

export const tokenValidationLimit = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const token = req.body.token;
  if (!token) {
    return next();
  }

  const now = Date.now();
  const attempts = tokenAttempts.get(token);

  if (attempts) {
    if (now < attempts.resetTime) {
      if (attempts.count >= 5) {
        return res.status(429).json({ 
          error: 'Too many validation attempts. Please try again later.' 
        });
      }
      attempts.count += 1;
    } else {
      attempts.count = 1;
      attempts.resetTime = now + TOKEN_ATTEMPT_WINDOW;
    }
  } else {
    tokenAttempts.set(token, {
      count: 1,
      resetTime: now + TOKEN_ATTEMPT_WINDOW,
    });
  }

  // Cleanup old entries
  if (Math.random() < 0.1) {
    for (const [key, value] of tokenAttempts.entries()) {
      if (now > value.resetTime) {
        tokenAttempts.delete(key);
      }
    }
  }

  next();
};