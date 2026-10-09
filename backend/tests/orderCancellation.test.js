const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const inventoryService = require("../services/inventoryService");
const orderService = require("../services/orderService");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const InventoryBatch = require("../models/InventoryBatch");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  for (const col of Object.values(mongoose.connection.collections)) {
    await col.deleteMany({});
  }
});

async function createOrder(cartId, status = "pending") {
  return Order.create({
    orderId: "CC-" + Math.random().toString(36).slice(2).toUpperCase(),
    customer: {
      name: "Test User", email: "test@example.com", phone: "0771234567",
      address: { street: "1 Main St", city: "Colombo", postalCode: "00100" }
    },
    items: [],
    subtotalMinor: 1000,
    totalAmountMinor: 1000,
    status,
    cartId
  });
}

async function setupInventory(cartId, initialQty = 10, reserveQty = 3) {
  const product = await Product.create({
    name: "Ceylon Tea", description: "Fine tea", price: 500,
    category: "Tea", image: "img.jpg", stock: initialQty
  });
  const warehouse = await Warehouse.create({ name: "WH-1", location: "Colombo" });
  const batch = await InventoryBatch.create({
    productId: product._id, warehouseId: warehouse._id, quantity: initialQty
  });
  await inventoryService.reserveStock(cartId, [{ productId: product._id, quantity: reserveQty }]);
  return { product, batch };
}

describe("ORDER-003a: Cancelling a pending order restores inventory", () => {
  it("should mark reservation as released and restore batch stock", async () => {
    const cartId = "cart-pre-pay";
    const { batch } = await setupInventory(cartId, 10, 3);
    const afterReserve = await InventoryBatch.findById(batch._id);
    expect(afterReserve.quantity).toBe(7);
    const order = await createOrder(cartId, "pending");
    await orderService.transitionOrderState(order._id, "cancelled", "customer", "Changed mind");
    const reservation = await Reservation.findOne({ cartId });
    expect(reservation.status).toBe("released");
    const afterCancel = await InventoryBatch.findById(batch._id);
    expect(afterCancel.quantity).toBe(10);
    const cancelledOrder = await Order.findById(order._id);
    expect(cancelledOrder.status).toBe("cancelled");
  });
});

describe("ORDER-003b: Cancelling a paid order restores inventory (previously broken)", () => {
  it("should restore batch stock even when reservation is already committed", async () => {
    const cartId = "cart-post-pay";
    const { batch } = await setupInventory(cartId, 10, 3);
    const afterReserve = await InventoryBatch.findById(batch._id);
    expect(afterReserve.quantity).toBe(7);
    await inventoryService.commitReservation(cartId);
    const committedRes = await Reservation.findOne({ cartId });
    expect(committedRes.status).toBe("committed");
    const order = await createOrder(cartId, "paid");
    await orderService.transitionOrderState(order._id, "cancelled", "admin", "Admin override");
    const reservation = await Reservation.findOne({ cartId });
    expect(reservation.status).toBe("released");
    const afterCancel = await InventoryBatch.findById(batch._id);
    expect(afterCancel.quantity).toBe(10);
    const cancelledOrder = await Order.findById(order._id);
    expect(cancelledOrder.status).toBe("cancelled");
  });
});

describe("ORDER-003c: Invalid cancellation transitions are rejected", () => {
  it("should throw when attempting to cancel a shipped order", async () => {
    const order = await createOrder("cart-shipped", "shipped");
    await expect(
      orderService.transitionOrderState(order._id, "cancelled", "customer", "Too late")
    ).rejects.toThrow("Invalid state transition from shipped to cancelled");
    const unchanged = await Order.findById(order._id);
    expect(unchanged.status).toBe("shipped");
  });

  it("should silently no-op when cancelling an already-cancelled order", async () => {
    // The state machine returns the order as-is when currentStatus === newStatus (idempotent).
    const order = await createOrder("cart-already-cancelled", "cancelled");
    const result = await orderService.transitionOrderState(order._id, "cancelled", "admin", "Duplicate");
    expect(result.status).toBe("cancelled");
  });
});

describe("ORDER-003d: releaseReservation is idempotent for already-released reservations", () => {
  it("should return null without error when reservation is already released", async () => {
    const cartId = "cart-double-release";
    await setupInventory(cartId, 10, 3);
    const first = await inventoryService.releaseReservation(cartId, "released");
    expect(first).not.toBeNull();
    expect(first.status).toBe("released");
    const second = await inventoryService.releaseReservation(cartId, "released");
    expect(second).toBeNull();
  });
});
