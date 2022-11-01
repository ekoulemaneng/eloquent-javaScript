const mongoose = require("mongoose")

const paymentTypeSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        name: { type: String, required: true, unique: true },
        description: String,
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Payment_Type', paymentTypeSchema)