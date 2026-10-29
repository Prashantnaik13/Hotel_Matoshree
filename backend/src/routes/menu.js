import express from 'express';
import { body, validationResult } from 'express-validator';
import { MenuCategory, MenuItem, MenuItemVariant } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();
router.use(authenticate);

router.get('/categories', async (req,res)=>{
  const cats = await MenuCategory.findAll({ where:{ restaurantId: req.user.restaurantId||1 }, order:[['sortOrder','ASC']] });
  res.json({ success:true, data: cats });
});

router.post('/categories', authorize('super_admin','manager'), body('name').notEmpty(), async (req,res)=>{
  const errors=validationResult(req); if(!errors.isEmpty()) return res.status(422).json({success:false, errors:errors.array()});
  const cat = await MenuCategory.create({ ...req.body, restaurantId: req.user.restaurantId||1 });
  res.status(201).json({success:true, data:cat});
});

router.put('/categories/:id', authorize('super_admin','manager'), async (req,res)=>{
  const cat = await MenuCategory.findByPk(req.params.id);
  if(!cat) return res.status(404).json({success:false, message:'Not found'});
  await cat.update(req.body);
  res.json({success:true, data:cat});
});

router.delete('/categories/:id', authorize('super_admin'), async (req,res)=>{
  const cat=await MenuCategory.findByPk(req.params.id);
  if(!cat) return res.status(404).json({success:false, message:'Not found'});
  await cat.update({ isActive:false });
  res.json({success:true, message:'Deactivated'});
});

router.get('/items', async (req,res)=>{
  const where={ restaurantId: req.user.restaurantId||1 };
  if(req.query.categoryId) where.categoryId=req.query.categoryId;
  if(req.query.search) where.name = req.query.search; // simplified like
  let items = await MenuItem.findAll({ where, include:[{association:'variants', as:'variants'}], order:[['name','ASC']] });
  // manual search filter for sqlite LIKE case
  if(req.query.search){
    const s=req.query.search.toLowerCase();
    items=items.filter(i=> i.name.toLowerCase().includes(s));
  }
  res.json({success:true, data:items});
});

router.get('/items/:id', async (req,res)=>{
  const item=await MenuItem.findByPk(req.params.id, { include:[{association:'variants', as:'variants'}] });
  if(!item) return res.status(404).json({success:false, message:'Not found'});
  res.json({success:true, data:item});
});

router.post('/items', authorize('super_admin','manager'), body('name').notEmpty(), body('price').isFloat({min:0}), body('categoryId').notEmpty(), async (req,res)=>{
  const errors=validationResult(req); if(!errors.isEmpty()) return res.status(422).json({success:false, errors:errors.array()});
  const item=await MenuItem.create({ ...req.body, restaurantId: req.user.restaurantId||1 });
  if(req.body.variants && Array.isArray(req.body.variants)){
    for(const v of req.body.variants) await MenuItemVariant.create({ menuItemId:item.id, ...v });
  }
  const full=await MenuItem.findByPk(item.id, { include:[{association:'variants', as:'variants'}] });
  res.status(201).json({success:true, data:full});
});

router.put('/items/:id', authorize('super_admin','manager'), async (req,res)=>{
  const item=await MenuItem.findByPk(req.params.id);
  if(!item) return res.status(404).json({success:false, message:'Not found'});
  await item.update(req.body);
  res.json({success:true, data:item});
});

router.patch('/items/:id/status', authorize('super_admin','manager'), async (req,res)=>{
  const item=await MenuItem.findByPk(req.params.id);
  if(!item) return res.status(404).json({success:false, message:'Not found'});
  await item.update({ isAvailable: req.body.isAvailable });
  res.json({success:true, data:item});
});

export default router;
