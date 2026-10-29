import express from 'express';
import { KOT, KOTItem, Order, OrderItem, RestaurantTable } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router=express.Router();
router.use(authenticate);

router.get('/tickets', async (req,res)=>{
  const where={};
  if(req.query.status) where.status=req.query.status;
  // filter by restaurant via order? simplified
  const tickets=await KOT.findAll({ where, order:[['createdAt','DESC']], limit:50 });
  // enrich with proper associations
  const data=[];
  for(const t of tickets){
    const order=await Order.findByPk(t.orderId, { include:[{ association:'items', as:'items' }] });
    const table = t.tableId ? await RestaurantTable.findByPk(t.tableId) : null;
    const kotItems=await KOTItem.findAll({
      where:{ kotId: t.id },
      include:[{ model: OrderItem, as:'orderItem' }]
    });
    // transform to include item name snapshot
    const enrichedItems = kotItems.map(ki=>{
      const oi = ki.orderItem;
      return {
        id: ki.id,
        kotId: ki.kotId,
        orderItemId: ki.orderItemId,
        quantity: ki.quantity,
        notes: ki.notes || oi?.notes || null,
        item_name: oi ? oi.nameSnapshot : 'Unknown Item',
        nameSnapshot: oi ? oi.nameSnapshot : 'Unknown Item',
        unitPrice: oi ? oi.unitPrice : null,
        status: t.status
      };
    });
    data.push({ ...t.toJSON(), order, table, items: enrichedItems });
  }
  res.json({success:true, data});
});

router.patch('/tickets/:id/status', async (req,res)=>{
  const kot=await KOT.findByPk(req.params.id);
  if(!kot) return res.status(404).json({success:false, message:'Not found'});
  await kot.update({ status: req.body.status });
  // optionally create notification when ready
  // let notif to frontend via polling
  res.json({success:true, data:kot});
});

export default router;
