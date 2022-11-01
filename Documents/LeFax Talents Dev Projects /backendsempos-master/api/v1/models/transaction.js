const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        name: { type: String, trim: true, required: true, unique: true },
        type: { type: String, enum: ['collection', 'disbursement'], required: true },
        amount: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        billing_date: { type: Date, default: Date.now() },
        payment_date: { type: Date, default: Date.now() },
        status: { type: String, enum: ['underway', 'completed'], default: 'completed' },
        overdue: { type: Boolean, default: false },
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction_Category' , required: true },
        note: String
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Transaction', transactionSchema)
