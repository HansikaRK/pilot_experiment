const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
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
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount must be a positive number']
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['success', 'failed'],
      default: 'success'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
