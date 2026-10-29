import express from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Bill, Order, OrderItem, RestaurantTable } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router=express.Router();
router.use(authenticate);

function dateFilter(query){
  const where={ restaurantId: 1 };
  if(query.startDate && query.endDate){
    where.billDate={ [Op.between]: [new Date(query.startDate), new Date(query.endDate)] };
  }
  return where;
}

router.get('/daily-sales', async (req,res)=>{
  const where=dateFilter(req.query);
  const bills=await Bill.findAll({ where, order:[['billDate','ASC']] });
  const total=bills.reduce((s,b)=> s+Number(b.grandTotal),0);
  const tax=bills.reduce((s,b)=> s+Number(b.taxTotal),0);
  const discount=bills.reduce((s,b)=> s+Number(b.discountAmount),0);
  res.json({success:true, data:{ bills, summary:{ total, tax, discount, count:bills.length }}});
});

router.get('/monthly-sales', async (req,res)=>{
  const where=dateFilter(req.query);
  const bills=await Bill.findAll({ where });
  const total=bills.reduce((s,b)=> s+Number(b.grandTotal),0);
  res.json({success:true, data:{ total, count:bills.length, bills }});
});

router.get('/table-wise-sales', async (req,res)=>{
  const bills=await Bill.findAll({ where:{ restaurantId:1 }, include:[] });
  const map={};
  for(const b of bills){
    const key=b.tableId||'Takeaway';
    if(!map[key]) map[key]={ tableId:key, total:0, count:0 };
    map[key].total+=Number(b.grandTotal);
    map[key].count+=1;
  }
  res.json({success:true, data: Object.values(map)});
});

router.get('/item-wise-sales', async (req,res)=>{
  const items = await OrderItem.findAll({
    attributes: ['menuItemId','nameSnapshot', [fn('SUM', col('quantity')), 'totalQty'], [fn('SUM', col('lineTotal')), 'totalSales']],
    include: [{ model: Order, attributes:[], where:{ restaurantId:1 } }],
    group: ['menuItemId','nameSnapshot'],
    order: [[literal('totalSales'),'DESC']],
    limit:20, raw:true
  });
  res.json({success:true, data:items});
});

router.get('/payment-methods', async (req,res)=>{
  const bills=await Bill.findAll({ where:{ restaurantId:1 } });
  const map={};
  for(const b of bills){ const m=b.paymentMethod||'other'; map[m]=(map[m]||0)+Number(b.grandTotal); }
  res.json({success:true, data: Object.entries(map).map(([method,total])=>({method,total}))});
});

export default router;
