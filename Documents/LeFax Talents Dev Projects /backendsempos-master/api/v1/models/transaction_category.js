const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        name: { type: String, trim: true, required: true },
        type: { type: String, enum: ['collection', 'disbursement'], required: true}
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Transaction_Category', categorySchema)
