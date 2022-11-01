const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        name: { type: String, required: true },
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isOpened: { type: Boolean, default: false },
        payment_type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PaymentType' }]
    },
    {
        timestamps: true
    }
)