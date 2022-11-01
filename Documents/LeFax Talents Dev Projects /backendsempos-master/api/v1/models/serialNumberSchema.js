const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        serial_number: { type: String, required: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true }
    },
    {
        timestamps: true
    }
)