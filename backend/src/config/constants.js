export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter'
};

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  BILLING: 'billing',
  CLEANING: 'cleaning',
  OUT_OF_SERVICE: 'out_of_service'
};

export const ORDER_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ORDER_TYPE = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery'
};

export const PAYMENT_METHODS = ['cash','upi','debit_card','credit_card','other'];
export const PAYMENT_STATUS = { PENDING: 'pending', PARTIAL: 'partial', PAID: 'paid', REFUNDED: 'refunded' };
export const KOT_STATUS = { PENDING: 'pending', PREPARING: 'preparing', READY: 'ready', SERVED: 'served', CANCELLED: 'cancelled' };
