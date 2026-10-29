import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login',
  body('email').notEmpty().withMessage('Email or username required'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ where: email.includes('@') ? { email } : { username: email } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, restaurantId: user.restaurantId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

    // audit
    await AuditLog.create({ userId: user.id, restaurantId: user.restaurantId, action: 'LOGIN', entity: 'User', entityId: String(user.id), details: `User ${user.email} logged in`, ip: req.ip });

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 8*60*60*1000 });
    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, restaurantId: user.restaurantId } } });
  }
);

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
  res.json({ success: true, data: user });
});

router.post('/logout', authenticate, async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

router.post('/change-password', authenticate,
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
    const user = await User.findByPk(req.user.id);
    const ok = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!ok) return res.status(400).json({ success: false, message: 'Old password incorrect' });
    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password changed' });
  }
);

export default router;
