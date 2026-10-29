import express from 'express';
import { Op } from 'sequelize';
import { RestaurantTable, MenuItem, MenuCategory, Order, Bill, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req,res)=>{
  const q = (req.query.q || '').trim();
  if(!q || q.length < 2) return res.json({ success:true, data:{ tables:[], menuItems:[], orders:[], bills:[], users:[] } });
  if(q.length > 50) return res.status(400).json({ success:false, message:'Query too long' });
  const restaurantId = req.user.restaurantId || 1;
  const like = `%${q}%`;
  const limit = 5;

  try{
    const result = { tables:[], menuItems:[], orders:[], bills:[], users:[] };

    // Tables: match tableNumber, section
    const tables = await RestaurantTable.findAll({
      where: { restaurantId, [Op.or]: [{ tableNumber: {[Op.like]: like} }, { section:{[Op.like]: like} }] },
      limit, order:[['tableNumber','ASC']]
    });
    result.tables = tables.map(t=> ({ id:t.id, type:'table', title:`Table ${t.tableNumber}`, subtitle:`${t.capacity} pax • ${t.status}${t.section?' • Sec '+t.section:''}`, status:t.status, action:'Open table', navigate:`/pos?table=${t.id}` }));

    // Menu items: name, description
    const menuItems = await MenuItem.findAll({
      where: { restaurantId, [Op.or]: [{ name:{[Op.like]: like} }, { description:{[Op.like]: like} }] },
      include:[{ model: MenuCategory, attributes:['name'] }],
      limit
    });
    result.menuItems = menuItems.map(m=> ({ id:m.id, type:'menu_item', title:m.name, subtitle:`${m.MenuCategory?.name||'Menu'} • ₹${m.price} • ${m.vegType}`, status: m.isAvailable?'available':'unavailable', navigate:`/menu?item=${m.id}` }));

    // Orders: orderNumber, customerName
    // Only if role can view orders
    if(['super_admin','manager','cashier','waiter'].includes(req.user.role)){
      const orders = await Order.findAll({
        where: { restaurantId, [Op.or]: [{ orderNumber:{[Op.like]: like} }, { customerName:{[Op.like]: like} }] },
        limit, order:[['createdAt','DESC']]
      });
      result.orders = orders.map(o=> ({ id:o.id, type:'order', title:`Order ${o.orderNumber}`, subtitle:`Table ${o.tableId||'—'} • ${o.status} • ₹${o.grandTotal}`, status:o.status, navigate:`/orders?order=${o.id}` }));
    }

    // Bills: billNumber
    if(['super_admin','manager','cashier'].includes(req.user.role)){
      const bills = await Bill.findAll({
        where: { restaurantId, billNumber:{[Op.like]: like} },
        limit, order:[['billDate','DESC']]
      });
      result.bills = bills.map(b=> ({ id:b.id, type:'bill', title:`Bill ${b.billNumber}`, subtitle:`Total ₹${b.grandTotal} • ${b.paymentStatus} • ${new Date(b.billDate).toLocaleDateString()}`, status:b.paymentStatus, navigate:`/billing?bill=${b.id}` }));
    }

    // Users: only super_admin/manager can search users
    if(['super_admin','manager'].includes(req.user.role)){
      const users = await User.findAll({
        where: { restaurantId, [Op.or]: [{ name:{[Op.like]: like} }, { email:{[Op.like]: like} }, { username:{[Op.like]: like} }] },
        attributes:['id','name','email','role'],
        limit
      });
      result.users = users.map(u=> ({ id:u.id, type:'user', title:u.name, subtitle:`${u.email} • ${u.role}`, status:u.role, navigate:`/users?user=${u.id}` }));
    }

    // For sqlite LIKE is case-insensitive by default for ASCII, ok

    res.json({ success:true, data: result });
  }catch(e){
    console.error(e);
    res.status(500).json({ success:false, message:'Search failed' });
  }
});

export default router;
