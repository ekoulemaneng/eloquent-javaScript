const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        description: String,
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    { 
        timestamps: true 
    }
)