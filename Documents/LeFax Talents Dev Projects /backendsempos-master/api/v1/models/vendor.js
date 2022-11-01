const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
    {
        operation_type: { type: String, enum: ['opening', 'collect', 'payment', 'order'], required: true },
        date: { type: Date, required: true },
        payment_type: { type: String, enum: ['cash', 'cheque', 'bank_transfer', 'mobile_money', 'orange money'], required: true },
        amount: { type: Number, required: true },
        note: String
    }
)

const vendorSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        name: { type: String, required: true, unique: true },
        legal_title: String,
        contact_person: String,
        phone: String,
        email: String,
        note: String,
        address: String,
        transactions: [transactionSchema]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Vendor', vendorSchema)
