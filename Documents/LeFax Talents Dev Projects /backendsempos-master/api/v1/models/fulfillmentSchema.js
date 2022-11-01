const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        type_of_order: { type: String, enum: ['online-order', 'in-store-order'], required: true },
        sale_receipt: { type: String, required: true },
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        status: { type: String, default: 'new', enum: ['new', 'in-progress', 'packed'], required: true},
        type: { type: String, enum: ['delivery', 'pickup'], required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        items: [
            {
                products: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, required: true }
            }
        ],
        sales_note: String,
        isFulFilled: { type: Boolean, default: false }
    },
    {
        timestamps: true
    }
)