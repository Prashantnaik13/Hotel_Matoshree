import express from 'express';
import { Restaurant, RestaurantSetting, Floor, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import bcrypt from 'bcryptjs';

const router=express.Router();
router.use(authenticate);

router.get('/', async (req,res)=>{
  const restaurantId=req.user.restaurantId||1;
  const restaurant=await Restaurant.findByPk(restaurantId);
  const setting=await RestaurantSetting.findOne({ where:{ restaurantId } });
  const floors=await Floor.findAll({ where:{ restaurantId } });
  res.json({success:true, data:{ restaurant, setting, floors }});
});

router.put('/', authorize('super_admin','manager'), async (req,res)=>{
  const restaurantId=req.user.restaurantId||1;
  const { restaurant, setting } = req.body;
  if(restaurant){
    const r=await Restaurant.findByPk(restaurantId);
    await r.update(restaurant);
  }
  if(setting){
    const s=await RestaurantSetting.findOne({ where:{ restaurantId } });
    await s.update(setting);
  }
  res.json({success:true, message:'Settings updated'});
});

// floors
router.get('/floors', async (req,res)=>{
  const floors=await Floor.findAll({ where:{ restaurantId: req.user.restaurantId||1 } });
  res.json({success:true, data:floors});
});
router.post('/floors', authorize('super_admin','manager'), async (req,res)=>{
  const f=await Floor.create({ ...req.body, restaurantId: req.user.restaurantId||1 });
  res.status(201).json({success:true, data:f});
});

// users
router.get('/users', authorize('super_admin','manager'), async (req,res)=>{
  const users=await User.findAll({ where:{ restaurantId: req.user.restaurantId||1 }, attributes:{ exclude:['password'] } });
  res.json({success:true, data:users});
});
router.post('/users', authorize('super_admin'), async (req,res)=>{
  const { name, email, username, password, role } = req.body;
  const hash=await bcrypt.hash(password,10);
  const u=await User.create({ name, email, username, password:hash, role, restaurantId: req.user.restaurantId||1 });
  res.status(201).json({success:true, data:{ id:u.id, name:u.name, email:u.email, role:u.role }});
});
router.put('/users/:id', authorize('super_admin'), async (req,res)=>{
  const u=await User.findByPk(req.params.id);
  if(!u) return res.status(404).json({success:false, message:'Not found'});
  if(req.body.password) req.body.password=await bcrypt.hash(req.body.password,10);
  await u.update(req.body);
  res.json({success:true, data:u});
});

export default router;
