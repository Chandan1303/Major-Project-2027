import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { z } from 'zod';
import { User, PasswordResetToken } from '../models/index.js';
import { setSession, clearSession, publicUser } from '../utils/auth.js';
import { sendResetEmail, sendVerificationEmail } from '../services/emailService.js';

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').transform((v) => v.toLowerCase()),
  password
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1)
});

function validation(res, schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    res.status(422).json({
      success: false,
      message: parsed.error.issues[0].message,
      errors: parsed.error.flatten().fieldErrors
    });
    return null;
  }
  return parsed.data;
}

export async function register(req, res, next) {
  try {
    const data = validation(res, registerSchema, req.body);
    if (!data) return;

    if (await User.findOne({ where: { email: data.email } })) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Generate verification token (32 random bytes -> 64 hex chars)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
      name: data.name,
      email: data.email,
      password_hash: await bcrypt.hash(data.password, 12),
      email_verified: false,
      verification_token: tokenHash,
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send verification email
    await sendVerificationEmail(user, verificationToken, req);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      data: {
        email: user.email,
        requiresVerification: true
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const data = validation(res, loginSchema, req.body);
    if (!data) return;

    const user = await User.findOne({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Email or password is incorrect.'
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
        data: { email: user.email }
      });
    }

    setSession(res, user);
    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: publicUser(user) }
    });
  } catch (e) {
    next(e);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification link.'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by verification token hash
    const user = await User.findOne({
      where: {
        verification_token: tokenHash
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This verification link is invalid, expired, or has already been used.'
      });
    }

    // If the user is already verified (handles email client pre-fetching, double-clicks, reloads)
    if (user.email_verified) {
      setSession(res, user);
      return res.json({
        success: true,
        message: 'Your email is already verified. You can now access your account.',
        data: { user: publicUser(user), alreadyVerified: true }
      });
    }

    // Check expiration
    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This verification link has expired. Please request a new verification email.'
      });
    }

    // Update user as verified
    await user.update({
      email_verified: true,
      verification_token_expires: null
    });

    // Auto-login the user after verification
    setSession(res, user);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now access your account.',
      data: { user: publicUser(user) }
    });
  } catch (e) {
    next(e);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const data = validation(
      res,
      z.object({ email: z.string().trim().email().transform((v) => v.toLowerCase()) }),
      req.body
    );
    if (!data) return;

    const user = await User.findOne({ where: { email: data.email } });

    if (!user) {
      // Don't reveal if user exists or not for privacy
      return res.json({
        success: true,
        message: 'If an unverified account exists for that email, a new verification link has been sent.',
        data: {}
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already verified. You can log in.'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await user.update({
      verification_token: tokenHash,
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Send new verification email
    await sendVerificationEmail(user, verificationToken, req);

    res.json({
      success: true,
      message: 'If an unverified account exists for that email, a new verification link has been sent.',
      data: {}
    });
  } catch (e) {
    next(e);
  }
}

export function logout(req, res) {
  clearSession(res);
  res.json({ success: true, message: 'You have been signed out.', data: {} });
}

export function me(req, res) {
  res.json({ success: true, message: 'Authenticated.', data: { user: publicUser(req.user) } });
}

export async function forgotPassword(req, res, next) {
  try {
    const data = validation(
      res,
      z.object({ email: z.string().trim().email().transform((v) => v.toLowerCase()) }),
      req.body
    );
    if (!data) return;

    const user = await User.findOne({ where: { email: data.email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await PasswordResetToken.destroy({ where: { user_id: user.id, used_at: null } });
      await PasswordResetToken.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 30 * 60 * 1000)
      });
      await sendResetEmail(user, token, req);
    }
    res.json({
      success: true,
      message: 'If an account exists for that email, a reset link is on its way.',
      data: {}
    });
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const data = validation(
      res,
      z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password }),
      req.body
    );
    if (!data) return;

    const hash = crypto.createHash('sha256').update(data.token).digest('hex');
    const reset = await PasswordResetToken.findOne({
      where: { token_hash: hash, used_at: null, expires_at: { [Op.gt]: new Date() } }
    });

    if (!reset) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid, expired, or has already been used.'
      });
    }

    const user = await User.findByPk(reset.user_id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'This reset link is invalid.' });
    }

    const isSamePassword = await bcrypt.compare(data.password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your old password.'
      });
    }

    await user.update({ password_hash: await bcrypt.hash(data.password, 12) });
    await PasswordResetToken.update({ used_at: new Date() }, { where: { user_id: user.id, used_at: null } });

    res.json({ success: true, message: 'Password successfully updated.', data: {} });
  } catch (e) {
    next(e);
  }
}
