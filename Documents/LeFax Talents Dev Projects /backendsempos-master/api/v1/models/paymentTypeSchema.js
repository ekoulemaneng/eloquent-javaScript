const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        description: String,
        type: { type: [String], enum: ['cash', 'mobile-banking', 'credit-card'] }
    },
    {
        timestamps: true
    }
)