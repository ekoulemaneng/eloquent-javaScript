const mongoose = require("mongoose");

module.exports = new mongoose.Schema(
  {
    details: {
      supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
      delivered_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
      supplier_invoice_number: String,
      delivery_date: { type: Date, required: true },
      order_number: { type: Number, required: true, unique: true },
      note: String
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        cost_price: { type: Number, required: true },
        total_cost: { type: Number, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
)
