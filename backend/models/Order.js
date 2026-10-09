const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        required: [true, 'Customer phone number is required'],
        trim: true
      },
      address: {
        street: {
          type: String,
          required: [true, 'Street address is required']
        },
        city: {
          type: String,
          required: [true, 'City is required']
        },
        postalCode: {
          type: String,
          required: [true, 'Postal code is required']
        }
      }
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        unitPriceMinor: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
        },
        amountMinor: {
          type: Number,
          required: true
        }
      }
    ],
    subtotalMinor: { type: Number, required: true },
    discountTotalMinor: { type: Number, default: 0 },
    shippingCostMinor: { type: Number, default: 0 },
    taxAmountMinor: { type: Number, default: 0 },
    totalAmountMinor: {
      type: Number,
      required: true,
      min: [0, 'Total amount must be a positive number']
    },
    currency: { type: String, default: 'LKR' },
    currencyRate: { type: Number, default: 1 }, // Snapshotted exchange rate
    status: {
      type: String,
      enum: ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    cartId: { type: String, required: true } // Link back to the cart/reservation
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
