import express from 'express';
import { body } from 'express-validator';
import sequelize from '../config/database.js';
import { Order, OrderItem, Bill, BillItem, Payment, RestaurantTable, Restaurant, RestaurantSetting, AuditLog, User } from '../models/index.js';
import { calculateBill } from '../utils/calculateBill.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { createNotification } from '../utils/notify.js';

const router = express.Router();
router.use(authenticate);

router.post('/preview', async (req,res)=>{
  try{
    const { orderId, discount=0, discountType='fixed', taxRate, serviceChargeRate, roundOffEnabled } = req.body;
    const order=await Order.findByPk(orderId, { include:[{ association:'items'}] });
    if(!order) return res.status(404).json({success:false, message:'Order not found'});
    const restaurantId = req.user.restaurantId||1;
    const setting=await RestaurantSetting.findOne({ where:{ restaurantId } });
    const tRate = taxRate!==undefined ? taxRate : (setting? Number(setting.taxRate):5);
    const scRate = serviceChargeRate!==undefined ? serviceChargeRate : (setting && setting.serviceChargeEnabled ? Number(setting.serviceChargePercent):0);
    const calc=calculateBill({ items: order.items.map(i=>({ unitPrice:Number(i.unitPrice), quantity:i.quantity })), discount, discountType, taxRate:tRate, serviceChargeRate: scRate, isInclusive: setting? setting.taxInclusive:false, roundOffEnabled: roundOffEnabled!==undefined? roundOffEnabled : (setting? setting.roundOffEnabled:true) });
    res.json({ success:true, data: { orderId, ...calc, items: order.items } });
  }catch(e){ res.status(400).json({success:false, message:e.message}); }
});

router.post('/finalize', async (req,res)=>{
  const t=await sequelize.transaction();
  try{
    const { orderId, discount=0, discountType='fixed', paymentMethod='cash', amountReceived, paymentRef } = req.body;
    const order=await Order.findByPk(orderId, { include:[{ association:'items'}], transaction:t });
    if(!order) throw new Error('Order not found');
    if(['cancelled','completed'].includes(order.status)) throw new Error('Order already finalized or cancelled');
    // check existing bill
    const existing=await Bill.findOne({ where:{ orderId }, transaction:t });
    if(existing) throw Object.assign(new Error('Bill already exists for this order'), { status:409 });

    const restaurantId=req.user.restaurantId||1;
    const setting=await RestaurantSetting.findOne({ where:{ restaurantId }, transaction:t });
    const taxRate = setting? Number(setting.taxRate):5;
    const scRate = setting && setting.serviceChargeEnabled ? Number(setting.serviceChargePercent):0;
    const calc=calculateBill({ items: order.items.map(i=>({ unitPrice:Number(i.unitPrice), quantity:i.quantity })), discount, discountType, taxRate, serviceChargeRate:scRate, isInclusive: setting? setting.taxInclusive:false, roundOffEnabled: setting? setting.roundOffEnabled:true });

    // generate bill number with counter
    let billNumber;
    if(setting){
      setting.billCounter+=1;
      await setting.save({ transaction:t });
      billNumber=`${setting.billPrefix||'BILL'}-${String(setting.billCounter).padStart(6,'0')}`;
    } else {
      billNumber='BILL-'+Date.now();
    }

    const bill=await Bill.create({
      restaurantId, billNumber, orderId:order.id, tableId:order.tableId,
      subtotal: calc.subtotal, discountAmount: calc.discountAmount, taxableAmount: calc.taxableAmount,
      cgst: calc.cgst, sgst: calc.sgst, igst: calc.igst, taxTotal: calc.taxAmount,
      serviceCharge: calc.serviceCharge, roundOff: calc.roundOff, grandTotal: calc.grandTotal,
      paymentMethod, paymentStatus: 'pending', amountReceived: amountReceived||0, changeDue: amountReceived? Number(amountReceived)-calc.grandTotal:0,
      cashierId: req.user.id, billDate: new Date()
    }, { transaction:t });

    for(const oi of order.items){
      await BillItem.create({ billId: bill.id, name: oi.nameSnapshot, quantity: oi.quantity, unitPrice: oi.unitPrice, lineTotal: oi.lineTotal, taxRate: oi.taxRate }, { transaction:t });
    }

    // status updates
    await order.update({ status:'completed' }, { transaction:t });
    if(order.tableId){
      await RestaurantTable.update({ status:'billing', activeOrderId: order.id }, { where:{ id: order.tableId }, transaction:t });
      // we keep table as billing until payment paid; if fully paid below we release? Let's do: if payment covers, set available after
    }

    await t.commit();
    const full=await Bill.findByPk(bill.id, { include:[{ association:'items', as:'items' }, { association:'payments', as:'payments' }] });
    await AuditLog.create({ userId:req.user.id, restaurantId, action:'FINALIZE_BILL', entity:'Bill', entityId:String(bill.id), details:`Bill ${billNumber} for order ${order.orderNumber}` });
    await createNotification({ restaurantId, type:'bill_generated', title:`Bill ${billNumber} generated`, message:`₹${full.grandTotal} • Table ${full.tableId||'—'} • ${full.paymentMethod}`, relatedEntityType:'bill', relatedEntityId:String(full.id), icon:'bill' });
    res.status(201).json({success:true, data:full});
  }catch(e){ await t.rollback(); res.status(e.status||400).json({success:false, message:e.message}); }
});

router.get('/', async (req,res)=>{
  const where={ restaurantId: req.user.restaurantId||1 };
  if(req.query.paymentStatus) where.paymentStatus=req.query.paymentStatus;
  if(req.query.search) where.billNumber=req.query.search;
  // date filter
  const bills=await Bill.findAll({ where, include:[{ association:'items', as:'items' }, {association:'payments', as:'payments'}], order:[['createdAt','DESC']], limit:100 });
  let filtered=bills;
  if(req.query.search){
    const s=req.query.search.toLowerCase();
    filtered=bills.filter(b=> b.billNumber.toLowerCase().includes(s) || String(b.orderId).includes(s));
  }
  res.json({success:true, data:filtered});
});

router.get('/:id', async (req,res)=>{
  const bill=await Bill.findByPk(req.params.id, { include:[{ association:'items', as:'items' }, {association:'payments', as:'payments'}] });
  if(!bill) return res.status(404).json({success:false, message:'Not found'});
  const order=await Order.findByPk(bill.orderId, { include:[{ association:'items'}] });
  const table=bill.tableId? await RestaurantTable.findByPk(bill.tableId):null;
  const restaurant=await Restaurant.findByPk(bill.restaurantId);
  const cashier=bill.cashierId? await User.findByPk(bill.cashierId):null;
  res.json({success:true, data:{ bill, order, table, restaurant, cashier }});
});

router.get('/:id/print-data', async (req,res)=>{
  const bill=await Bill.findByPk(req.params.id, { include:[{ association:'items', as:'items'}] });
  if(!bill) return res.status(404).json({success:false, message:'Not found'});
  const order=await Order.findByPk(bill.orderId);
  const table=bill.tableId? await RestaurantTable.findByPk(bill.tableId):null;
  const restaurant=await Restaurant.findByPk(bill.restaurantId);
  const setting=await RestaurantSetting.findOne({ where:{ restaurantId: bill.restaurantId } });
  const cashier=bill.cashierId? await User.findByPk(bill.cashierId, { attributes:['name','email'] }):null;
  res.json({success:true, data:{ bill, items: bill.items, order, table, restaurant, setting, cashier }});
});

router.post('/:id/payments', body('method').notEmpty(), body('amount').isFloat({min:0.01}), async (req,res)=>{
  const t=await sequelize.transaction();
  try{
    const bill=await Bill.findByPk(req.params.id, { transaction:t });
    if(!bill) throw new Error('Bill not found');
    if(bill.paymentStatus==='paid') throw new Error('Bill already fully paid');
    const { method, amount, transactionRef, idempotencyKey } = req.body;
    // idempotency
    if(idempotencyKey){
      const existing=await Payment.findOne({ where:{ idempotencyKey }, transaction:t });
      if(existing) { await t.commit(); return res.json({success:true, data:existing, message:'Idempotent replay'}); }
    }
    const payment=await Payment.create({ billId: bill.id, method, amount, transactionRef, recordedBy: req.user.id, idempotencyKey: idempotencyKey||null }, { transaction:t });
    // recalc paid
    const allPayments=await Payment.findAll({ where:{ billId: bill.id }, transaction:t });
    const totalPaid = allPayments.reduce((s,p)=> s+Number(p.amount), 0);
    let status='partial';
    if(totalPaid >= Number(bill.grandTotal)-0.01) status='paid';
    else if(totalPaid>0) status='partial';
    await bill.update({ paymentStatus: status, amountReceived: totalPaid, changeDue: totalPaid - Number(bill.grandTotal) }, { transaction:t });
    if(status==='paid' && bill.tableId){
      // release table to cleaning then available? We'll set to available after small delay? For now set to cleaning
      await RestaurantTable.update({ status:'cleaning', activeOrderId:null }, { where:{ id: bill.tableId }, transaction:t });
    }
    await t.commit();
    if(status==='paid'){
      await createNotification({ restaurantId: bill.restaurantId, type:'payment_completed', title:`Payment completed ${bill.billNumber}`, message:`₹${totalPaid} received • ${bill.paymentMethod||method}`, relatedEntityType:'bill', relatedEntityId:String(bill.id), icon:'payment' });
    } else {
      await createNotification({ restaurantId: bill.restaurantId, type:'payment_pending', title:`Payment partial ${bill.billNumber}`, message:`₹${totalPaid} of ₹${bill.grandTotal} paid`, relatedEntityType:'bill', relatedEntityId:String(bill.id), icon:'payment' });
    }
    if(status==='paid' && bill.tableId){
      // also notify cleaning
      await createNotification({ restaurantId: bill.restaurantId, type:'table_cleaning', title:`Table cleaning needed`, message:`Table ${bill.tableId} marked for cleaning after payment`, relatedEntityType:'table', relatedEntityId:String(bill.tableId), icon:'table' });
    }
    res.status(201).json({success:true, data:payment});
  }catch(e){ await t.rollback(); res.status(400).json({success:false, message:e.message}); }
});

router.post('/:id/reprint', async (req,res)=>{
  const bill=await Bill.findByPk(req.params.id);
  if(!bill) return res.status(404).json({success:false, message:'Not found'});
  await bill.update({ isReprint:true, reprintCount: bill.reprintCount+1 });
  await AuditLog.create({ userId:req.user.id, restaurantId:bill.restaurantId, action:'REPRINT', entity:'Bill', entityId:String(bill.id), details:`Reprint count ${bill.reprintCount}` });
  res.json({success:true, data:bill});
});

export default router;
