import express from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Order, Bill, RestaurantTable, MenuItem, OrderItem } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/summary', async (req,res)=>{
  const restaurantId = req.user.restaurantId||1;
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);

  const todaysBills = await Bill.findAll({ where:{ restaurantId, billDate:{ [Op.gte]: today, [Op.lt]: tomorrow } } });
  const todaySales = todaysBills.reduce((s,b)=> s+Number(b.grandTotal),0);
  const billsCount = todaysBills.length;

  const activeOrders = await Order.count({ where:{ restaurantId, status:{ [Op.notIn]:['completed','cancelled'] } } });
  const tables = await RestaurantTable.findAll({ where:{ restaurantId } });
  const available = tables.filter(t=> t.status==='available').length;
  const occupied = tables.filter(t=> t.status==='occupied').length;
  const reserved = tables.filter(t=> t.status==='reserved').length;
  const cleaning = tables.filter(t=> t.status==='cleaning').length;
  const billing = tables.filter(t=> t.status==='billing').length;

  const pendingBills = await Bill.findAll({ where:{ restaurantId, paymentStatus:{ [Op.in]:['pending','partial'] } } });
  const pendingAmount = pendingBills.reduce((s,b)=> s+ (Number(b.grandTotal)-Number(b.amountReceived)),0);

  const avgBill = billsCount? (todaySales/billsCount):0;

  res.json({ success:true, data:{
    todaySales, billsCount, activeOrders, available, occupied, reserved, cleaning, billing,
    pendingAmount, avgBill, totalTables: tables.length
  }});
});

router.get('/sales', async (req,res)=>{
  const restaurantId=req.user.restaurantId||1;
  const range=req.query.range||'daily'; // daily, monthly, hourly
  const bills=await Bill.findAll({ where:{ restaurantId }, order:[['billDate','ASC']] });
  // aggregate by day
  const map={};
  for(const b of bills){
    let key;
    const d=new Date(b.billDate);
    if(range==='hourly'){
      key=d.toISOString().slice(0,13)+':00';
    } else if(range==='monthly'){
      key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    } else {
      key=d.toISOString().slice(0,10);
    }
    map[key]=(map[key]||0)+Number(b.grandTotal);
  }
  const data=Object.entries(map).map(([date,total])=>({ date, total }));
  res.json({success:true, data});
});

router.get('/recent-orders', async (req,res)=>{
  const restaurantId=req.user.restaurantId||1;
  const orders=await Order.findAll({ where:{ restaurantId }, include:[{ association:'items'}], order:[['createdAt','DESC']], limit:10 });
  res.json({success:true, data:orders});
});

router.get('/top-items', async (req,res)=>{
  const restaurantId=req.user.restaurantId||1;
  // top selling via OrderItem grouping
  const items = await OrderItem.findAll({
    attributes: ['menuItemId','nameSnapshot', [fn('SUM', col('quantity')), 'totalQty'], [fn('SUM', col('lineTotal')), 'totalSales']],
    include: [{ model: Order, attributes:[], where:{ restaurantId } }],
    group: ['menuItemId','nameSnapshot'],
    order: [[literal('totalQty'),'DESC']],
    limit:5, raw:true
  });
  res.json({success:true, data:items});
});

router.get('/payment-breakdown', async (req,res)=>{
  const restaurantId=req.user.restaurantId||1;
  const bills=await Bill.findAll({ where:{ restaurantId } });
  const map={};
  for(const b of bills){
    const m=b.paymentMethod||'unknown';
    map[m]=(map[m]||0)+Number(b.grandTotal);
  }
  res.json({success:true, data: Object.entries(map).map(([method,total])=>({method, total})) });
});

export default router;
