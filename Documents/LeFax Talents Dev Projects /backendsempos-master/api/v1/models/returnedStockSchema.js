const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        details: {
            return_number: { type: String, required: true , unique: true },
            delivery_due: { type: Date, required: true },
            deliver_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
            reference: { type: String,  required: true },
            return_from: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
            supplier_invoice: { type: String,  required: true }
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