const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        register: { type: mongoose.Schema.Types.ObjectId, ref: 'Register', required: true },
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        time_opened: Date,
        time_closed: Date,
        cash: { type: Number, default: 0 },
        store_credit: { type: Number, default: 0 },
        gift_card:{ type: Number, default: 0 },
        loyalty: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    {
        timestamps: true
    }
)