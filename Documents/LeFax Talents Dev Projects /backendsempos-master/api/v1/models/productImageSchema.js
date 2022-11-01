const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        path: String,
        title: String,
        alt: String,
        src: String,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    },
    {
        timestamps: true
    }
)