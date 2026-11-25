import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { isDemoMode } from './otp';
import { asyncHandler } from '../../shared/async-handler';
import { requireAuth } from './middleware';
import { revokeRefreshToken, rotateRefreshToken } from './tokens';
import {
  languageSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  verifyLoginSchema,
  verifyRegistrationSchema,
} from './schemas';
import * as service from './service';

export const authRouter = Router();

// In demo mode (school demo only) the code is returned too, so the app can show it instead of an SMS.
const otpSent = (code: string) => ({ message: 'OTP_SENT', ...(isDemoMode() ? { demoCode: code } : {}) });

authRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: () => (isDemoMode() ? 400 : 40), // demo mode: room for repeated takes of a recording
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED' } },
    skip: () => env.NODE_ENV === 'test',
  }),
);

// Step 1 of sign-up: validate details and text an OTP. The account is created in step 2.
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const code = await service.startRegistration(registerSchema.parse(req.body));
    res.status(202).json(otpSent(code));
  }),
);

authRouter.post(
  '/register/verify',
  asyncHandler(async (req, res) => {
    const { phone, code } = verifyRegistrationSchema.parse(req.body);
    res.status(201).json(await service.completeRegistration(phone, code));
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const code = await service.startLogin(loginSchema.parse(req.body).phone);
    res.status(202).json(otpSent(code));
  }),
);

authRouter.post(
  '/login/verify',
  asyncHandler(async (req, res) => {
    const { phone, code, totpCode } = verifyLoginSchema.parse(req.body);
    res.json(await service.completeLogin(phone, code, totpCode));
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    res.json(await rotateRefreshToken(refreshSchema.parse(req.body).refreshToken));
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await revokeRefreshToken(refreshSchema.parse(req.body).refreshToken);
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.getMe(req.auth!.userId));
  }),
);

authRouter.patch(
  '/me/language',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.setLanguage(req.auth!.userId, languageSchema.parse(req.body).language));
  }),
);

export { requireAuth, requireRole } from './middleware';
