const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        details: {
            source_branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
            destination_branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
            reference: { type: String,  required: true },
            transfer_date: { type: Date, required: true }
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