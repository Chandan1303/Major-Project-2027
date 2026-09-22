import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { cookieName } from '../utils/auth.js';

export async function requireAuth(req, res, next) { 
  try { 
    const token = req.cookies[cookieName]; 
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' }); 
    const payload = jwt.verify(token, process.env.JWT_SECRET); 
    const user = await User.findByPk(payload.sub); 
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' }); 
    req.user = user; 
    next(); 
  } catch { 
    return res.status(401).json({ success: false, message: 'Authentication required.' }); 
  } 
}

// Alias for compatibility
export const authenticateToken = requireAuth;
