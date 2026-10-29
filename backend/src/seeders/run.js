import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import { User, Restaurant, RestaurantSetting, Floor, RestaurantTable, MenuCategory, MenuItem, Order, OrderItem, Bill, TaxConfiguration } from '../models/index.js';

async function seed(){
  try{
    await sequelize.authenticate();
    // Restaurant
    const rest = await Restaurant.create({
      name: 'The Emerald Grandeur',
      address: '45 Residency Road, Sholapur, Maharashtra 413001',
      phone: '+91 98765 43210',
      email: 'info@emeraldgrandeur.com',
      gstin: '27ABCDE1234F1Z5',
      currency: 'INR',
      footerMessage: 'Thank you for dining with us! Visit again.'
    });
    await RestaurantSetting.create({
      restaurantId: rest.id,
      receiptWidth: '80mm',
      taxRate: 5.00,
      taxInclusive: false,
      serviceChargeEnabled: false,
      serviceChargePercent: 0,
      billPrefix: 'EG',
      billCounter: 1000,
      roundOffEnabled: true
    });

    const floors = await Floor.bulkCreate([
      { restaurantId: rest.id, name: 'Ground Floor', sortOrder:1 },
      { restaurantId: rest.id, name: 'First Floor', sortOrder:2 },
      { restaurantId: rest.id, name: 'Rooftop', sortOrder:3 }
    ]);

    // Tables
    let tables=[];
    for(let i=1;i<=12;i++){
      tables.push({ restaurantId: rest.id, floorId: floors[Math.floor((i-1)/4)].id, tableNumber: `T${String(i).padStart(2,'0')}`, capacity: i%3===0?6:4, status: i===3? 'reserved': i===5? 'occupied' : 'available', section: i<=4?'A':i<=8?'B':'C' });
    }
    await RestaurantTable.bulkCreate(tables);

    // Users
    const pw = await bcrypt.hash('admin123',10);
    await User.bulkCreate([
      { name:'Super Admin', email:'admin@emerald.com', username:'admin', password:pw, role:'super_admin', restaurantId:rest.id },
      { name:'Rahul Manager', email:'manager@emerald.com', username:'manager', password:pw, role:'manager', restaurantId:rest.id },
      { name:'Priya Cashier', email:'cashier@emerald.com', username:'cashier', password:pw, role:'cashier', restaurantId:rest.id },
      { name:'Amit Waiter', email:'waiter@emerald.com', username:'waiter', password:pw, role:'waiter', restaurantId:rest.id },
    ]);

    const categories = await MenuCategory.bulkCreate([
      { restaurantId: rest.id, name:'Starters', description:'Appetizers', sortOrder:1 },
      { restaurantId: rest.id, name:'Main Course', description:'Hearty mains', sortOrder:2 },
      { restaurantId: rest.id, name:'Indian Breads', sortOrder:3 },
      { restaurantId: rest.id, name:'Rice & Biryani', sortOrder:4 },
      { restaurantId: rest.id, name:'Chinese', sortOrder:5 },
      { restaurantId: rest.id, name:'Beverages', sortOrder:6 },
      { restaurantId: rest.id, name:'Desserts', sortOrder:7 }
    ]);

    const catMap = {}; categories.forEach(c=> catMap[c.name]=c.id);

    const items = [
      { name:'Paneer Tikka', category:'Starters', price:250, vegType:'veg', desc:'Grilled paneer with spices' },
      { name:'Chicken Tikka', category:'Starters', price:320, vegType:'non_veg', desc:'Tender chicken tikka' },
      { name:'Mushroom Chilli', category:'Starters', price:220, vegType:'veg', desc:'Indo-Chinese style' },
      { name:'Butter Chicken', category:'Main Course', price:380, vegType:'non_veg', desc:'Creamy butter chicken' },
      { name:'Paneer Butter Masala', category:'Main Course', price:340, vegType:'veg', desc:'Rich paneer gravy' },
      { name:'Dal Tadka', category:'Main Course', price:220, vegType:'veg', desc:'Lentils tempered' },
      { name:'Butter Naan', category:'Indian Breads', price:40, vegType:'veg', desc:'Buttery naan' },
      { name:'Cheese Naan', category:'Indian Breads', price:70, vegType:'veg', desc:'Cheese stuffed' },
      { name:'Veg Biryani', category:'Rice & Biryani', price:280, vegType:'veg', desc:'Aromatic basmati' },
      { name:'Chicken Biryani', category:'Rice & Biryani', price:350, vegType:'non_veg', desc:'Hyderabadi style' },
      { name:'Hakka Noodles', category:'Chinese', price:200, vegType:'veg', desc:'Stir fried noodles' },
      { name:'Cold Drink', category:'Beverages', price:50, vegType:'veg', desc:'Chilled beverage' },
      { name:'Masala Chai', category:'Beverages', price:30, vegType:'veg', desc:'Indian spiced tea' },
      { name:'Gulab Jamun', category:'Desserts', price:90, vegType:'veg', desc:'Sweet delicacy (2 pcs)' },
      { name:'Ice Cream Sundae', category:'Desserts', price:120, vegType:'veg', desc:'Vanilla with toppings' }
    ];
    for(const it of items){
      await MenuItem.create({ restaurantId: rest.id, categoryId: catMap[it.category], name: it.name, description: it.desc, price: it.price, vegType: it.vegType, isAvailable:true, taxRate:5 });
    }

    await TaxConfiguration.create({ restaurantId: rest.id, name:'GST 5%', rate:5, isInclusive:false, type:'gst' });

    console.log('Seed completed');
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
}
seed();
