const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
       tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },

        name: { type: String, required: true },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        description:  String,
    },
    {
        timestamps: true
    }
)
