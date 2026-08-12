import jwt from 'jsonwebtoken';
export const cookieName = 'atelier_session';
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' };
export function setSession(res, user) { res.cookie(cookieName, jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' }), cookieOptions); }
export function clearSession(res) { res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined }); }
export function publicUser(user) { return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at }; }
