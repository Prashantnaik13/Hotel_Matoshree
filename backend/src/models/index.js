import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

// User
export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('super_admin','manager','cashier','waiter'), allowNull: false, defaultValue: 'waiter' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'users' });

// Restaurant
export const Restaurant = sequelize.define('Restaurant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  logo: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  gstin: { type: DataTypes.STRING, allowNull: true },
  currency: { type: DataTypes.STRING, defaultValue: 'INR' },
  footerMessage: { type: DataTypes.STRING, defaultValue: 'Thank you for dining with us! Visit again.' }
}, { tableName: 'restaurants' });

export const RestaurantSetting = sequelize.define('RestaurantSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  receiptWidth: { type: DataTypes.ENUM('58mm','80mm','A4'), defaultValue: '80mm' },
  invoiceFormat: { type: DataTypes.STRING, defaultValue: 'thermal' },
  taxRate: { type: DataTypes.DECIMAL(5,2), defaultValue: 5.00 },
  taxInclusive: { type: DataTypes.BOOLEAN, defaultValue: false },
  gstEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  serviceChargeEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  serviceChargePercent: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  discountEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  billPrefix: { type: DataTypes.STRING, defaultValue: 'BILL' },
  billCounter: { type: DataTypes.INTEGER, defaultValue: 1000 },
  roundOffEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  kotEnabled: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'restaurant_settings' });

export const Floor = sequelize.define('Floor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'floors' });

export const RestaurantTable = sequelize.define('RestaurantTable', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  floorId: { type: DataTypes.INTEGER, allowNull: true },
  tableNumber: { type: DataTypes.STRING, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
  status: { type: DataTypes.ENUM('available','occupied','reserved','billing','cleaning','out_of_service'), defaultValue: 'available' },
  section: { type: DataTypes.STRING, allowNull: true },
  activeOrderId: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'restaurant_tables', indexes: [{ unique: true, fields: ['restaurantId','tableNumber'] }] });

export const MenuCategory = sequelize.define('MenuCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  image: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'menu_categories' });

export const MenuItem = sequelize.define('MenuItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  image: { type: DataTypes.STRING, allowNull: true },
  vegType: { type: DataTypes.ENUM('veg','non_veg','egg','other'), defaultValue: 'veg' },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  taxRate: { type: DataTypes.DECIMAL(5,2), allowNull: true },
  preparationStation: { type: DataTypes.STRING, allowNull: true },
  sku: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'menu_items' });

export const MenuItemVariant = sequelize.define('MenuItemVariant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  menuItemId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  priceModifier: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'menu_item_variants' });

export const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  tableId: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.ENUM('dine_in','takeaway','delivery'), defaultValue: 'dine_in' },
  status: { type: DataTypes.ENUM('draft','confirmed','preparing','ready','served','completed','cancelled'), defaultValue: 'draft' },
  subtotal: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  discountType: { type: DataTypes.STRING, defaultValue: 'fixed' },
  taxTotal: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  serviceCharge: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  grandTotal: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  customerName: { type: DataTypes.STRING, allowNull: true },
  customerPhone: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'orders' });

export const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  menuItemId: { type: DataTypes.INTEGER, allowNull: false },
  variantId: { type: DataTypes.INTEGER, allowNull: true },
  nameSnapshot: { type: DataTypes.STRING, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  lineTotal: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  notes: { type: DataTypes.STRING, allowNull: true },
  kotStatus: { type: DataTypes.STRING, defaultValue: 'pending' },
  taxRate: { type: DataTypes.DECIMAL(5,2), allowNull: true }
}, { tableName: 'order_items' });

export const KOT = sequelize.define('KitchenOrderTicket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  kotNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  tableId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('pending','preparing','ready','served','cancelled'), defaultValue: 'pending' },
  preparationStation: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'kitchen_order_tickets' });

export const KOTItem = sequelize.define('KitchenOrderTicketItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kotId: { type: DataTypes.INTEGER, allowNull: false },
  orderItemId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  notes: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'kitchen_order_ticket_items' });

export const Bill = sequelize.define('Bill', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  billNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  tableId: { type: DataTypes.INTEGER, allowNull: true },
  subtotal: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  discountAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  taxableAmount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  cgst: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  sgst: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  igst: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  taxTotal: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  serviceCharge: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  roundOff: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  grandTotal: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  paymentMethod: { type: DataTypes.STRING, allowNull: true },
  paymentStatus: { type: DataTypes.ENUM('pending','partial','paid','refunded'), defaultValue: 'pending' },
  amountReceived: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  changeDue: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  cashierId: { type: DataTypes.INTEGER, allowNull: true },
  billDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isReprint: { type: DataTypes.BOOLEAN, defaultValue: false },
  reprintCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'bills' });

export const BillItem = sequelize.define('BillItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  billId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  lineTotal: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  taxRate: { type: DataTypes.DECIMAL(5,2), allowNull: true }
}, { tableName: 'bill_items' });

export const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  billId: { type: DataTypes.INTEGER, allowNull: false },
  method: { type: DataTypes.ENUM('cash','upi','debit_card','credit_card','other'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  transactionRef: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('success','pending','failed'), defaultValue: 'success' },
  recordedBy: { type: DataTypes.INTEGER, allowNull: true },
  idempotencyKey: { type: DataTypes.STRING, allowNull: true, unique: true }
}, { tableName: 'payments' });

export const TaxConfiguration = sequelize.define('TaxConfiguration', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  rate: { type: DataTypes.DECIMAL(5,2), allowNull: false },
  isInclusive: { type: DataTypes.BOOLEAN, defaultValue: false },
  type: { type: DataTypes.STRING, defaultValue: 'gst' }
}, { tableName: 'tax_configurations' });

export const Discount = sequelize.define('Discount', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('percent','fixed'), defaultValue: 'fixed' },
  value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'discounts' });

export const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: false },
  entity: { type: DataTypes.STRING, allowNull: true },
  entityId: { type: DataTypes.STRING, allowNull: true },
  details: { type: DataTypes.TEXT, allowNull: true },
  ip: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'audit_logs', updatedAt: false });

export const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: true },
  recipientRole: { type: DataTypes.STRING, allowNull: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  relatedEntityType: { type: DataTypes.STRING, allowNull: true },
  relatedEntityId: { type: DataTypes.STRING, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  icon: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'notifications' });

// Associations
Restaurant.hasMany(User, { foreignKey: 'restaurantId' });
User.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

Restaurant.hasOne(RestaurantSetting, { foreignKey: 'restaurantId', as: 'setting' });
RestaurantSetting.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

Restaurant.hasMany(Floor, { foreignKey: 'restaurantId' });
Floor.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

Restaurant.hasMany(RestaurantTable, { foreignKey: 'restaurantId' });
RestaurantTable.belongsTo(Restaurant, { foreignKey: 'restaurantId' });
Floor.hasMany(RestaurantTable, { foreignKey: 'floorId' });
RestaurantTable.belongsTo(Floor, { foreignKey: 'floorId' });

Restaurant.hasMany(MenuCategory, { foreignKey: 'restaurantId' });
MenuCategory.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

Restaurant.hasMany(MenuItem, { foreignKey: 'restaurantId' });
MenuCategory.hasMany(MenuItem, { foreignKey: 'categoryId' });
MenuItem.belongsTo(MenuCategory, { foreignKey: 'categoryId' });
MenuItem.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

MenuItem.hasMany(MenuItemVariant, { foreignKey: 'menuItemId', as: 'variants' });
MenuItemVariant.belongsTo(MenuItem, { foreignKey: 'menuItemId' });

Restaurant.hasMany(Order, { foreignKey: 'restaurantId' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId' });
Order.belongsTo(RestaurantTable, { foreignKey: 'tableId' });
RestaurantTable.hasMany(Order, { foreignKey: 'tableId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
User.hasMany(Order, { foreignKey: 'createdBy' });

Order.hasMany(KOT, { foreignKey: 'orderId' });
KOT.belongsTo(Order, { foreignKey: 'orderId' });
KOT.hasMany(KOTItem, { foreignKey: 'kotId', as: 'items' });
KOTItem.belongsTo(KOT, { foreignKey: 'kotId' });
KOTItem.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });
OrderItem.hasOne(KOTItem, { foreignKey: 'orderItemId' });

Restaurant.hasMany(Bill, { foreignKey: 'restaurantId' });
Bill.belongsTo(Order, { foreignKey: 'orderId' });
Bill.belongsTo(RestaurantTable, { foreignKey: 'tableId' });
Bill.hasMany(BillItem, { foreignKey: 'billId', as: 'items' });
BillItem.belongsTo(Bill, { foreignKey: 'billId' });

Bill.hasMany(Payment, { foreignKey: 'billId', as: 'payments' });
Payment.belongsTo(Bill, { foreignKey: 'billId' });

export default sequelize;
