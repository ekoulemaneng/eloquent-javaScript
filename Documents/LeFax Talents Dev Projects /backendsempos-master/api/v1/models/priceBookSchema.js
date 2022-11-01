const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        details: {
            name: { type: String, required: true, unique: true },
            customers_groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerGroup' }],
            branches: [{ type: mongoose.Schema.Types.ObjectId, ref:'Branch' }],
            valid_from: { type: Date, default: null },
            valid_to: { type: Date, default: null }
        },
        prices: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                retail_price: Number,
                loyalty_earned: Number
            }
        ]
    },
    { 
        timestamps: true
    }
)