const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        general: {
            name: { type: String, required: true, unique: true },
            start_date: { type: Date, required: true },
            start_time: String,
            branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true }
        },
        products_to_count: {
            includeInactiveProducts: { type: Boolean, default: false, required: true },
            products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
        }
    },
    {
        timestamps: true
    }
)