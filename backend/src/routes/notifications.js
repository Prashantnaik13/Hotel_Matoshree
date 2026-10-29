import express from 'express';
import { Notification } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/notifications?limit=20
router.get('/', async (req,res)=>{
  const limit = Math.min(parseInt(req.query.limit)||20, 50);
  const where = { restaurantId: req.user.restaurantId || 1 };
  // Optionally filter by recipientRole/recipientId, but show all for restaurant for now
  // In future, filter to user's role
  const notifications = await Notification.findAll({ where, order:[['createdAt','DESC']], limit });
  res.json({ success:true, data: notifications });
});

router.get('/unread-count', async (req,res)=>{
  const where = { restaurantId: req.user.restaurantId || 1, isRead:false };
  const count = await Notification.count({ where });
  res.json({ success:true, data:{ count } });
});

router.patch('/:id/read', async (req,res)=>{
  const n = await Notification.findByPk(req.params.id);
  if(!n) return res.status(404).json({ success:false, message:'Not found' });
  await n.update({ isRead:true });
  res.json({ success:true, data:n });
});

router.patch('/read-all', async (req,res)=>{
  await Notification.update({ isRead:true }, { where:{ restaurantId: req.user.restaurantId||1, isRead:false } });
  res.json({ success:true, message:'All marked read' });
});

// For testing: create dummy (super_admin only)
router.post('/', async (req,res)=>{
  const { type, title, message } = req.body;
  if(!title || !message) return res.status(400).json({ success:false, message:'title/message required' });
  const n = await Notification.create({ restaurantId: req.user.restaurantId||1, type:type||'info', title, message, relatedEntityType: req.body.relatedEntityType||null, relatedEntityId: req.body.relatedEntityId||null });
  res.status(201).json({ success:true, data:n });
});

router.delete('/:id', async (req,res)=>{
  const n=await Notification.findByPk(req.params.id);
  if(!n) return res.status(404).json({ success:false, message:'Not found' });
  await n.destroy();
  res.json({ success:true, message:'Deleted' });
});

export default router;
