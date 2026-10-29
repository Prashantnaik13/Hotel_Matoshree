import express from 'express';
import { body, validationResult } from 'express-validator';
import sequelize from '../config/database.js';
import { Order, OrderItem, RestaurantTable, MenuItem, KOT, KOTItem, AuditLog, Bill } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { calculateBill } from '../utils/calculateBill.js';
import { createNotification } from '../utils/notify.js';

const router = express.Router();
router.use(authenticate);

function genOrderNumber(){
  return 'ORD' + Date.now().toString().slice(-8) + Math.floor(Math.random()*90+10);
}

router.get('/', async (req,res)=>{
  const where={ restaurantId: req.user.restaurantId||1 };
  if(req.query.status) where.status=req.query.status;
  if(req.query.tableId) where.tableId=req.query.tableId;
  const orders=await Order.findAll({ where, include:[{ association:'items', as:'items' }], order:[['createdAt','DESC']], limit: 100 });
  res.json({success:true, data:orders});
});

router.get('/:id', async (req,res)=>{
  const order=await Order.findByPk(req.params.id, { include:[{ association:'items', as:'items' }] });
  if(!order) return res.status(404).json({success:false, message:'Not found'});
  res.json({success:true, data:order});
});

router.post('/', body('tableId').optional(), body('type').optional(), body('items').isArray({min:1}), async (req,res)=>{
  const errors=validationResult(req); if(!errors.isEmpty()) return res.status(422).json({success:false, errors:errors.array()});
  const t = await sequelize.transaction();
  try{
    const { tableId, type='dine_in', items, customerName, customerPhone, notes } = req.body;
    if(tableId){
      const table=await RestaurantTable.findByPk(tableId, { transaction:t });
      if(!table) throw new Error('Table not found');
      if(table.activeOrderId){
        const existing=await Order.findByPk(table.activeOrderId, { transaction:t });
        if(existing && !['completed','cancelled'].includes(existing.status)){
          throw Object.assign(new Error('Table already has an active order'), { status:409 });
        }
      }
    }
    const orderNumber=genOrderNumber();
    let orderItemsData=[];
    let subtotal=0;
    for(const it of items){
      const menu=await MenuItem.findByPk(it.menuItemId, { transaction:t });
      if(!menu) throw new Error(`Menu item ${it.menuItemId} not found`);
      if(!menu.isAvailable) throw new Error(`Item ${menu.name} is unavailable`);
      const unitPrice = Number(menu.price);
      const qty = Math.max(1, Number(it.quantity));
      const lineTotal = unitPrice * qty;
      subtotal+=lineTotal;
      orderItemsData.push({ menuItemId: menu.id, variantId: it.variantId||null, nameSnapshot: menu.name, unitPrice, quantity: qty, lineTotal, notes: it.notes||null, taxRate: menu.taxRate||5 });
    }
    const calc=calculateBill({ items: orderItemsData.map(i=>({ unitPrice:i.unitPrice, quantity:i.quantity })), discount:0, taxRate:5, serviceChargeRate:0 });
    const order=await Order.create({ restaurantId: req.user.restaurantId||1, orderNumber, tableId: tableId||null, type, status:'confirmed', subtotal, discount:0, taxTotal:calc.taxAmount, serviceCharge:0, grandTotal: calc.grandTotal, notes, customerName, customerPhone, createdBy: req.user.id }, { transaction:t });
    for(const od of orderItemsData) await OrderItem.create({ ...od, orderId: order.id }, { transaction:t });
    if(tableId){
      await RestaurantTable.update({ status:'occupied', activeOrderId: order.id }, { where:{ id: tableId }, transaction:t });
    }
    await t.commit();
    const full=await Order.findByPk(order.id, { include:[{ association:'items', as:'items'}] });
    await AuditLog.create({ userId:req.user.id, restaurantId: full.restaurantId, action:'CREATE_ORDER', entity:'Order', entityId:String(full.id), details:`Order ${full.orderNumber} for table ${tableId}` });
    // notifications
    const table = tableId ? await RestaurantTable.findByPk(tableId) : null;
    const label = table ? table.tableNumber : 'Takeaway';
    await createNotification({ restaurantId: full.restaurantId, type:'new_order', title:`New order ${full.orderNumber}`, message:`Table ${label} • ₹${full.grandTotal} • ${full.items.length} items`, relatedEntityType:'order', relatedEntityId:String(full.id), icon:'order' });
    res.status(201).json({success:true, data:full});
  }catch(e){
    await t.rollback();
    res.status(e.status||400).json({success:false, message:e.message});
  }
});

router.post('/:id/items', body('items').isArray({min:1}), async (req,res)=>{
  const t=await sequelize.transaction();
  try{
    const order=await Order.findByPk(req.params.id, { transaction:t });
    if(!order) throw new Error('Order not found');
    if(['completed','cancelled'].includes(order.status)) throw new Error('Cannot add items to completed/cancelled order');
    const newItems=[];
    for(const it of req.body.items){
      const menu=await MenuItem.findByPk(it.menuItemId, { transaction:t });
      if(!menu) throw new Error('Menu item not found');
      const qty=Math.max(1, Number(it.quantity));
      const unitPrice=Number(menu.price);
      const lineTotal=unitPrice*qty;
      newItems.push({ orderId:order.id, menuItemId:menu.id, nameSnapshot:menu.name, unitPrice, quantity:qty, lineTotal, notes:it.notes||null, taxRate: menu.taxRate||5 });
    }
    for(const ni of newItems) await OrderItem.create(ni, { transaction:t });
    const updatedItems=await OrderItem.findAll({ where:{ orderId:order.id }, transaction:t });
    let newSubtotal=0; updatedItems.forEach(i=> newSubtotal+=Number(i.lineTotal));
    const calc=calculateBill({ items: updatedItems.map(i=>({ unitPrice:Number(i.unitPrice), quantity:i.quantity })), taxRate:5 });
    await order.update({ subtotal:newSubtotal, taxTotal:calc.taxAmount, grandTotal:calc.grandTotal }, { transaction:t });
    await t.commit();
    const full=await Order.findByPk(order.id, { include:[{ association:'items', as:'items'}] });
    await createNotification({ restaurantId: order.restaurantId, type:'order_update', title:`Order updated ${order.orderNumber}`, message:`${newItems.length} item(s) added • Now ₹${full.grandTotal}`, relatedEntityType:'order', relatedEntityId:String(order.id), icon:'order' });
    res.json({success:true, data:full});
  }catch(e){ await t.rollback(); res.status(400).json({success:false, message:e.message}); }
});

router.put('/:id/items', async (req,res)=>{
  const t=await sequelize.transaction();
  try{
    const order=await Order.findByPk(req.params.id, { transaction:t });
    if(!order) throw new Error('Order not found');
    if(['completed','cancelled'].includes(order.status)) throw new Error('Cannot modify completed order');
    const { items } = req.body;
    for(const it of items){
      const oi=await OrderItem.findOne({ where:{ id: it.id, orderId:order.id }, transaction:t });
      if(!oi) continue;
      if(it.quantity <=0) await oi.destroy({ transaction:t });
      else {
        const qty=Number(it.quantity);
        const lineTotal=Number(oi.unitPrice)*qty;
        await oi.update({ quantity:qty, lineTotal, notes: it.notes!==undefined? it.notes: oi.notes }, { transaction:t });
      }
    }
    const updatedItems=await OrderItem.findAll({ where:{ orderId:order.id }, transaction:t });
    if(updatedItems.length===0) throw new Error('Order must have at least one item');
    let newSubtotal=0; updatedItems.forEach(i=> newSubtotal+=Number(i.lineTotal));
    const calc=calculateBill({ items: updatedItems.map(i=>({ unitPrice:Number(i.unitPrice), quantity:i.quantity })), taxRate:5 });
    await order.update({ subtotal:newSubtotal, taxTotal:calc.taxAmount, grandTotal:calc.grandTotal }, { transaction:t });
    await t.commit();
    const full=await Order.findByPk(order.id, { include:[{ association:'items', as:'items'}] });
    res.json({success:true, data:full});
  }catch(e){ await t.rollback(); res.status(400).json({success:false, message:e.message}); }
});

router.patch('/:id/status', async (req,res)=>{
  const order=await Order.findByPk(req.params.id);
  if(!order) return res.status(404).json({success:false, message:'Not found'});
  await order.update({ status:req.body.status });
  res.json({success:true, data:order});
});

router.post('/:id/send-to-kitchen', async (req,res)=>{
  const t=await sequelize.transaction();
  try{
    const order=await Order.findByPk(req.params.id, { include:[{ association:'items', as:'items'}], transaction:t });
    if(!order) throw new Error('Order not found');
    const pendingItems=order.items.filter(i=> i.kotStatus==='pending');
    if(pendingItems.length===0) throw new Error('No new items to send to kitchen');
    const kotNumber='KOT'+Date.now().toString().slice(-8);
    const kot=await KOT.create({ restaurantId:order.restaurantId, kotNumber, orderId:order.id, tableId:order.tableId, status:'pending' }, { transaction:t });
    for(const pi of pendingItems){
      await KOTItem.create({ kotId: kot.id, orderItemId: pi.id, quantity: pi.quantity, notes: pi.notes }, { transaction:t });
      await pi.update({ kotStatus:'sent' }, { transaction:t });
    }
    await order.update({ status:'preparing' }, { transaction:t });
    await t.commit();
    const table = order.tableId ? await RestaurantTable.findByPk(order.tableId) : null;
    const label = table ? table.tableNumber : 'Takeaway';
    await createNotification({ restaurantId: order.restaurantId, type:'kot_new', title:`KOT ${kot.kotNumber} → Kitchen`, message:`Table ${label} • Order ${order.orderNumber} • ${pendingItems.length} item(s)`, relatedEntityType:'kot', relatedEntityId:String(kot.id), icon:'kot' });
    res.json({success:true, data:kot});
  }catch(e){ await t.rollback(); res.status(400).json({success:false, message:e.message}); }
});

router.post('/:id/transfer-table', body('targetTableId').notEmpty(), async (req,res)=>{
  const t=await sequelize.transaction();
  try{
    const order=await Order.findByPk(req.params.id, { transaction:t });
    if(!order) throw new Error('Order not found');
    const sourceTable=order.tableId ? await RestaurantTable.findByPk(order.tableId, { transaction:t }) : null;
    const target=await RestaurantTable.findByPk(req.body.targetTableId, { transaction:t });
    if(!target) throw new Error('Target table not found');
    if(target.activeOrderId) throw new Error('Target table already occupied');
    if(target.status!=='available') throw new Error('Target table not available');
    await order.update({ tableId: target.id }, { transaction:t });
    if(sourceTable) await sourceTable.update({ status:'available', activeOrderId:null }, { transaction:t });
    await target.update({ status:'occupied', activeOrderId:order.id }, { transaction:t });
    await t.commit();
    res.json({success:true, data:order});
  }catch(e){ await t.rollback(); res.status(400).json({success:false, message:e.message}); }
});

router.post('/:id/cancel', authorize('super_admin','manager'), async (req,res)=>{
  const t=await sequelize.transaction();
  try{
    const order=await Order.findByPk(req.params.id, { transaction:t });
    if(!order) throw new Error('Order not found');
    if(order.status==='completed') throw new Error('Cannot cancel completed order');
    await order.update({ status:'cancelled' }, { transaction:t });
    if(order.tableId) await RestaurantTable.update({ status:'available', activeOrderId:null }, { where:{ id:order.tableId }, transaction:t });
    await t.commit();
    await createNotification({ restaurantId: order.restaurantId, type:'order_cancelled', title:`Order cancelled ${order.orderNumber}`, message:`Cancelled by ${req.user.role}`, relatedEntityType:'order', relatedEntityId:String(order.id), icon:'cancel' });
    res.json({success:true, data:order});
  }catch(e){ await t.rollback(); res.status(400).json({success:false, message:e.message}); }
});

export default router;
