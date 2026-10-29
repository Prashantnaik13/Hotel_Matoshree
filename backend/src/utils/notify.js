import { Notification } from '../models/index.js';

export async function createNotification({ restaurantId, recipientRole=null, recipientId=null, type, title, message, relatedEntityType=null, relatedEntityId=null, icon=null }){
  try{
    await Notification.create({ restaurantId, recipientRole, recipientId, type, title, message, relatedEntityType, relatedEntityId, icon });
  }catch(e){
    console.error('Notify error', e.message);
  }
}

// convenience wrappers
export async function notifyOrderCreated(order, table){
  const label = table ? table.tableNumber : 'Takeaway';
  await createNotification({ restaurantId: order.restaurantId, type:'new_order', title:`New Order ${order.orderNumber}`, message:`Table ${label} • ${order.type} • ₹${order.grandTotal}`, relatedEntityType:'order', relatedEntityId:String(order.id), icon:'order' });
}
export async function notifyKOT(kot, order, table){
  const label = table ? table.tableNumber : 'Takeaway';
  await createNotification({ restaurantId: kot.restaurantId, type:'kot_new', title:`KOT ${kot.kotNumber}`, message:`Table ${label} • Order ${order.orderNumber} sent to kitchen`, relatedEntityType:'kot', relatedEntityId:String(kot.id), icon:'kot' });
}
export async function notifyPayment(bill){
  await createNotification({ restaurantId: bill.restaurantId, type:'payment', title:`Payment ${bill.paymentStatus}`, message:`Bill ${bill.billNumber} • ₹${bill.grandTotal} • ${bill.paymentMethod}`, relatedEntityType:'bill', relatedEntityId:String(bill.id), icon:'payment' });
}
