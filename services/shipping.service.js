import axios from 'axios';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';
import ShippingZone from '../models/ShippingZone.js';

export const calculateShippingCost = async (address, items) => {
  try {
    // Check if address is in remote area
    const zone = await ShippingZone.findOne({
      region_name: { $regex: new RegExp(address.province, 'i') },
    });

    if (!zone) {
      throw new BadRequestError('Shipping not available to this location');
    }

    let baseCost = zone.shipping_rate;
    
    // Additional cost for remote areas
    if (zone.is_remote) {
      baseCost *= 1.5; // 50% extra for remote areas
    }

    // Additional cost based on total weight (assuming each item has weight)
    const totalWeight = items.reduce((sum, item) => sum + (item.product_id.weight * item.quantity), 0);
    if (totalWeight > 5) { // 5kg is our base weight
      baseCost += (totalWeight - 5) * 50; // 50 NPR per extra kg
    }

    return {
      cost: baseCost,
      estimated_days: zone.estimated_days,
      couriers: zone.supported_couriers,
    };
  } catch (error) {
    logger.error('Shipping calculation error:', error);
    throw error;
  }
};

export const createDeliveryNepalShipment = async (order, address) => {
  try {
    const response = await axios.post(process.env.DELIVERY_NEPAL_API_URL, {
      api_key: process.env.DELIVERY_NEPAL_API_KEY,
      order_id: order._id.toString(),
      customer_name: `${address.first_name} ${address.last_name}`,
      customer_address: address.street,
      customer_city: address.city,
      customer_phone: address.phone,
      package_description: 'Jara Ecommerce Order',
      package_weight: order.items.reduce((sum, item) => sum + (item.product_id.weight * item.quantity), 0),
      amount_to_collect: order.payment_method === 'cod' ? order.order_total : 0,
    });

    return {
      tracking_id: response.data.tracking_id,
      courier: 'DeliveryNepal',
      tracking_url: response.data.tracking_url,
    };
  } catch (error) {
    logger.error('DeliveryNepal API error:', error);
    throw new BadRequestError('Failed to create shipment with DeliveryNepal');
  }
};

export const createAramexShipment = async (order, address) => {
  try {
    const response = await axios.post(process.env.ARAMEX_API_URL, {
      ClientInfo: {
        UserName: process.env.ARAMEX_USERNAME,
        Password: process.env.ARAMEX_PASSWORD,
        Version: 'v1.0',
        AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
        AccountPin: process.env.ARAMEX_ACCOUNT_PIN,
        AccountEntity: 'KTM',
        AccountCountryCode: 'NP',
      },
      Transaction: {
        Reference1: order._id.toString(),
      },
      Shipments: [
        {
          Reference1: order._id.toString(),
          Shipper: {
            Reference1: 'JaraEcommerce',
            City: 'Kathmandu',
            CountryCode: 'NP',
          },
          Consignee: {
            Name: `${address.first_name} ${address.last_name}`,
            CellPhone: address.phone,
            Street: address.street,
            City: address.city,
            CountryCode: 'NP',
          },
          ShippingDate: new Date().toISOString(),
          Details: {
            PaymentType: order.payment_method === 'cod' ? 'C' : 'P',
            ProductGroup: 'DOM',
            ProductType: 'OND',
            ActualWeight: {
              Value: order.items.reduce(
                (sum, item) => sum + (item.product_id.weight * item.quantity),
                0
              ),
              Unit: 'kg',
            },
            ChargeableWeight: {
              Value: order.items.reduce(
                (sum, item) => sum + (item.product_id.weight * item.quantity),
                0
              ),
              Unit: 'kg',
            },
            DescriptionOfGoods: 'Jara Ecommerce Order',
          },
        },
      ],
    });

    return {
      tracking_id: response.data.Shipments[0].ID,
      courier: 'Aramex',
      tracking_url: response.data.Shipments[0].TrackingURL,
    };
  } catch (error) {
    logger.error('Aramex API error:', error);
    throw new BadRequestError('Failed to create shipment with Aramex');
  }
};