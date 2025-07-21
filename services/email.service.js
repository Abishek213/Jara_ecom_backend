import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { InternalServerError } from '../utils/errors.js';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const loadTemplate = (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    logger.error(`Error loading template ${templateName}:`, error);
    throw new InternalServerError('Failed to load email template');
  }
};

export const sendWelcomeEmail = async (user) => {
  try {
    const html = loadTemplate('welcome', {
      name: user.name,
      verifyLink: `${process.env.FRONTEND_URL}/verify-email/${user.emailVerificationToken}`,
    });

    await transporter.sendMail({
      from: `"Jara Ecommerce" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Welcome to Jara Ecommerce',
      html,
    });
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    throw new InternalServerError('Failed to send welcome email');
  }
};

export const sendOrderConfirmationEmail = async (user, order) => {
  try {
    const html = loadTemplate('orderConfirmation', {
      name: user.name,
      orderId: order._id,
      orderTotal: order.order_total,
      orderDate: order.created_at.toLocaleDateString(),
      items: order.order_items.map((item) => ({
        name: item.product_id.name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.total,
      })),
      trackingLink: `${process.env.FRONTEND_URL}/orders/${order._id}`,
    });

    await transporter.sendMail({
      from: `"Jara Ecommerce" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Your Jara Order #${order._id}`,
      html,
    });
  } catch (error) {
    logger.error('Error sending order confirmation email:', error);
    throw new InternalServerError('Failed to send order confirmation email');
  }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const html = loadTemplate('passwordReset', {
      name: user.name,
      resetLink: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
    });

    await transporter.sendMail({
      from: `"Jara Ecommerce" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw new InternalServerError('Failed to send password reset email');
  }
};