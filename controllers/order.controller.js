import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import Promotion from '../models/Promotion.js';
import { 
  initiateFonepayPayment, 
  verifyFonepayPayment,
  initiateStripePayment,
  verifyStripePayment
} from '../services/payment.service.js';
import { calculateShippingCost } from '../services/shipping.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import { successResponse } from '../utils/responseHandler.js';
import { 
  NotFoundError, 
  BadRequestError,
  UnauthorizedError 
} from '../utils/errors.js';
import { ORDER_STATUS} from '../enums/orderStatus.enum.js';
import { PAYMENT_METHODS } from '../enums/paymentMethods.enum.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  const { 
    shipping_address, 
    billing_address, 
    payment_method,
    promo_code 
  } = req.body;

  // Validate products and calculate order items
  const orderItems = [];
  let itemsTotal = 0;

  for (const item of req.body.order_items) {
    const product = await Product.findById(item.product_id);
    
    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${item.product_id}`);
    }

    if (product.stock_qty < item.quantity) {
      throw new BadRequestError(
        `Not enough stock for product: ${product.name}. Available: ${product.stock_qty}`
      );
    }

    const price = product.discount_price || product.base_price;
    const total = price * item.quantity;

    orderItems.push({
      product_id: product._id,
      quantity: item.quantity,
      unit_price: price,
      total
    });

    itemsTotal += total;
  }

  // Calculate shipping cost
  const shipping = await calculateShippingCost(shipping_address, orderItems);
  
  // Apply promo code if provided
  let discountApplied = 0;
  if (promo_code) {
    const promotion = await Promotion.findOne({ 
      code: promo_code,
      is_active: true,
      valid_from: { $lte: new Date() },
      valid_until: { $gte: new Date() }
    });

    if (promotion) {
      if (promotion.min_order_amount && itemsTotal < promotion.min_order_amount) {
        throw new BadRequestError(
          `Minimum order amount of ${promotion.min_order_amount} required for this promo code`
        );
      }

      if (promotion.discount_type === 'percentage') {
        discountApplied = (itemsTotal * promotion.discount_value) / 100;
      } else {
        discountApplied = promotion.discount_value;
      }
    }
  }

  // Calculate order total (items + shipping - discount + tax)
  // Note: Tax calculation would be implemented based on local regulations
  const taxAmount = itemsTotal * 0.13; // Example: 13% VAT
  const orderTotal = itemsTotal + shipping.cost - discountApplied + taxAmount;

  // Create order
  const order = await Order.create({
    user_id: req.user._id,
    order_items: orderItems,
    shipping_address,
    billing_address,
    payment_method,
    shipping_provider: shipping.couriers[0], // Default to first courier
    shipping_cost: shipping.cost,
    order_total: orderTotal,
    discount_applied: discountApplied,
    tax_amount: taxAmount,
    promo_code: promo_code || undefined
  });

  // Update product stock quantities
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product_id, {
      $inc: { stock_qty: -item.quantity }
    });
  }

  // Initiate payment based on method
  let paymentResult;
  if (payment_method === PAYMENT_METHODS.FONEPAY) {
    paymentResult = await initiateFonepayPayment(order, req.user);
  } else if (payment_method === PAYMENT_METHODS.STRIPE) {
    paymentResult = await initiateStripePayment(order, req.user);
  } else if (payment_method === PAYMENT_METHODS.COD) {
    // For COD, just create a pending payment record
    await Payment.create({
      order_id: order._id,
      user_id: req.user._id,
      method: PAYMENT_METHODS.COD,
      amount: orderTotal,
      status: 'initiated'
    });
  }

  // Send order confirmation email
  await sendOrderConfirmationEmail(req.user, order);

  successResponse(res, { 
    order, 
    payment: paymentResult 
  }, 201);
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('order_items.product_id', 'name images brand')
    .populate('user_id', 'name email phone');

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Make sure user owns the order or is admin
  if (
    order.user_id._id.toString() !== req.user._id.toString() && 
    req.user.user_type !== 'admin'
  ) {
    throw new UnauthorizedError('Not authorized to access this order');
  }

  successResponse(res, order);
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  const orders = await Order.find({ user_id: req.user._id })
    .sort('-created_at')
    .populate('order_items.product_id', 'name images brand');

  successResponse(res, orders);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
export const updateOrderStatus = async (req, res, next) => {
  const { status, shipping_provider, shipping_tracking_id } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Validate status transition
  const validTransitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
    [ORDER_STATUS.REFUNDED]: []
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new BadRequestError(`Invalid status transition from ${order.status} to ${status}`);
  }

  // Update order status
  order.status = status;
  
  // If shipping, update provider and tracking
  if (status === ORDER_STATUS.SHIPPED) {
    order.shipping_provider = shipping_provider;
    order.shipping_tracking_id = shipping_tracking_id;
  }

  // If cancelled, restock products
  if (status === ORDER_STATUS.CANCELLED) {
    for (const item of order.order_items) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock_qty: item.quantity }
      });
    }
  }

  await order.save();

  successResponse(res, order);
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order
  if (order.user_id.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError('Not authorized to cancel this order');
  }

  // Only pending or confirmed orders can be cancelled by user
  if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status)) {
    throw new BadRequestError(`Order cannot be cancelled in ${order.status} status`);
  }

  // Update order status
  order.status = ORDER_STATUS.CANCELLED;

  // Restock products
  for (const item of order.order_items) {
    await Product.findByIdAndUpdate(item.product_id, {
      $inc: { stock_qty: item.quantity }
    });
  }

  await order.save();

  successResponse(res, order);
};

// @desc    Request order return
// @route   POST /api/orders/:id/return
// @access  Private
export const returnOrder = async (req, res, next) => {
  const { reason, items } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order
  if (order.user_id.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError('Not authorized to return this order');
  }

  // Only delivered orders can be returned
  if (order.status !== ORDER_STATUS.DELIVERED) {
    throw new BadRequestError('Only delivered orders can be returned');
  }

  // Check return policy
  const returnDeadline = new Date(order.created_at);
  returnDeadline.setDate(returnDeadline.getDate() + order.return_policy_days);

  if (new Date() > returnDeadline) {
    throw new BadRequestError('Return period has expired');
  }

  // Validate items to return
  const returnItems = [];
  for (const itemId of items) {
    const orderItem = order.order_items.find(item => 
      item.product_id.toString() === itemId
    );

    if (!orderItem) {
      throw new BadRequestError(`Product ${itemId} not found in order`);
    }

    returnItems.push(orderItem);
  }

  // Create return request
  const returnRequest = await Return.create({
    order_id: order._id,
    user_id: req.user._id,
    reason,
    items_returned: returnItems.map(item => item.product_id),
    return_status: 'requested'
  });

  // Update order status
  order.status = ORDER_STATUS.RETURN_REQUESTED;
  await order.save();

  successResponse(res, returnRequest, 201);
};