const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    {
        timestamps: true
    }
)