import express from 'express';
import { body, validationResult } from 'express-validator';
import { RestaurantTable, Order, Floor, AuditLog } from '../models/index.js';
import sequelize from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { createNotification } from '../utils/notify.js';

const router = express.Router();
router.use(authenticate);

// GET all tables
router.get('/', async (req, res) => {
  const where = { restaurantId: req.user.restaurantId || 1 };
  if (req.query.floorId) where.floorId = req.query.floorId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.search) where.tableNumber = req.query.search;
  const tables = await RestaurantTable.findAll({ where, order: [['tableNumber','ASC']], include: [{ model: Floor }] });
  // enrich with active order
  const result = [];
  for (const t of tables) {
    const activeOrder = t.activeOrderId ? await Order.findByPk(t.activeOrderId, { include: [{ association: 'items' }] }) : null;
    result.push({ ...t.toJSON(), activeOrder });
  }
  res.json({ success: true, data: result });
});

router.get('/:id', async (req, res) => {
  const table = await RestaurantTable.findByPk(req.params.id);
  if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
  const activeOrder = table.activeOrderId ? await Order.findByPk(table.activeOrderId, { include: [{ association: 'items' }] }) : null;
  res.json({ success: true, data: { ...table.toJSON(), activeOrder } });
});

router.get('/:id/active-order', async (req, res) => {
  const table = await RestaurantTable.findByPk(req.params.id);
  if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
  if (!table.activeOrderId) return res.json({ success: true, data: null });
  const order = await Order.findByPk(table.activeOrderId, { include: [{ association: 'items' }] });
  res.json({ success: true, data: order });
});

router.post('/', authorize('super_admin','manager'), body('tableNumber').notEmpty(), body('capacity').isInt({min:1}), async (req,res)=>{
  const errors=validationResult(req); if(!errors.isEmpty()) return res.status(422).json({success:false, errors:errors.array()});
  const t = await RestaurantTable.create({ ...req.body, restaurantId: req.user.restaurantId || 1, status: req.body.status || 'available' });
  await AuditLog.create({ userId: req.user.id, restaurantId: t.restaurantId, action:'CREATE', entity:'Table', entityId:String(t.id), details:`Created table ${t.tableNumber}` });
  res.status(201).json({ success:true, data:t });
});

router.put('/:id', authorize('super_admin','manager'), async (req,res)=>{
  const table=await RestaurantTable.findByPk(req.params.id);
  if(!table) return res.status(404).json({success:false, message:'Not found'});
  await table.update(req.body);
  res.json({success:true, data:table});
});

router.patch('/:id/status', async (req,res)=>{
  const table=await RestaurantTable.findByPk(req.params.id);
  if(!table) return res.status(404).json({success:false, message:'Not found'});
  const { status } = req.body;
  if(!status) return res.status(400).json({success:false, message:'Status required'});
  await table.update({ status });
  await AuditLog.create({ userId:req.user.id, restaurantId:table.restaurantId, action:'UPDATE_STATUS', entity:'Table', entityId:String(table.id), details:`Table ${table.tableNumber} -> ${status}`});
  if(status==='cleaning'){
    await createNotification({ restaurantId: table.restaurantId, type:'table_cleaning', title:`Table ${table.tableNumber} needs cleaning`, message:`Marked as cleaning by ${req.user.role}`, relatedEntityType:'table', relatedEntityId:String(table.id), icon:'table' });
  }
  res.json({success:true, data:table});
});

export default router;
