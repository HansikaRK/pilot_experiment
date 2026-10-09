const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const paymentService = require('../services/paymentService');
const PaymentIntent = require('../models/PaymentIntent');
const Order = require('../models/Order');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await PaymentIntent.init();
  await Order.init();
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('Payment Service', () => {
  it('PAY-002: Should handle simulated webhook idempotently', async () => {
    const order = await Order.create({
      orderId: 'CC-TEST',
      customer: { name: 'A', email: 'a@b.c', phone: '123', address: { street: 's', city: 'c', postalCode: '1' } },
      items: [], subtotalMinor: 100, totalAmountMinor: 100, cartId: 'cart-1'
    });

    const intent = await paymentService.createPaymentIntent(order._id, 100, 'LKR');

    // Need to mock inventoryService.commitReservation since we are not testing inventory here
    const inventoryService = require('../services/inventoryService');
    jest.spyOn(inventoryService, 'commitReservation').mockResolvedValue(true);
    
    // Need to mock orderService.transitionOrderState
    const orderService = require('../services/orderService');
    jest.spyOn(orderService, 'transitionOrderState').mockImplementation(async (id, status) => {
        const order = await Order.findById(id);
        order.status = status;
        await order.save();
        return order;
    });

    const result1 = await paymentService.handleWebhook({
      type: 'payment.succeeded', intentId: intent.intentId, idempotencyKey: 'key-1'
    });

    expect(result1.status).toBe('succeeded');

    // Duplicate webhook
    const result2 = await paymentService.handleWebhook({
      type: 'payment.succeeded', intentId: intent.intentId, idempotencyKey: 'key-1'
    });
    
    expect(result2.message).toBe('Already processed');
    
    // Order should be paid
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe('paid');
    
    jest.restoreAllMocks();
  });

  it('PAY-003: Should restrict refunds to paid amount', async () => {
    const order = await Order.create({
      orderId: 'CC-TEST2',
      customer: { name: 'A', email: 'a@b.c', phone: '123', address: { street: 's', city: 'c', postalCode: '1' } },
      items: [], subtotalMinor: 100, totalAmountMinor: 100, cartId: 'cart-2'
    });

    const intent = await paymentService.createPaymentIntent(order._id, 100, 'LKR');
    intent.status = 'succeeded';
    await intent.save();

    const orderService = require('../services/orderService');
    jest.spyOn(orderService, 'transitionOrderState').mockImplementation(async (id, status) => {
        const order = await Order.findById(id);
        order.status = status;
        await order.save();
        return order;
    });

    const partialRefund = await paymentService.processRefund(intent.intentId, 40, 'Partial');
    expect(partialRefund.refundedAmountMinor).toBe(40);
    expect(partialRefund.status).toBe('succeeded');

    // Attempt to refund more than remaining (100 - 40 = 60)
    await expect(paymentService.processRefund(intent.intentId, 70, 'Exceed')).rejects.toThrow('Refund amount 70 exceeds remaining refundable amount 60');

    const fullRefund = await paymentService.processRefund(intent.intentId, 60, 'Full');
    expect(fullRefund.refundedAmountMinor).toBe(100);
    expect(fullRefund.status).toBe('refunded');
    
    jest.restoreAllMocks();
  });
});
