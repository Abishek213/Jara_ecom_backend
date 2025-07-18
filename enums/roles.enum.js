export const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  PRODUCT_MANAGER: 'product_manager',
  ORDER_MANAGER: 'order_manager',
};

export const ADMIN_ROLES = [
  USER_ROLES.SUPERADMIN,
  USER_ROLES.PRODUCT_MANAGER,
  USER_ROLES.ORDER_MANAGER,
];