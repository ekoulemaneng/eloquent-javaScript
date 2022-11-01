const mongoose = require('mongoose')

const closureSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
        isOpened: { type: Boolean, default: true, required: true },
        start_date: { type: Date, default: Date.now(), required: true },
        end_date: Date,
        start_amount: { type: Number, default: 0, required: true },
        sales_amount: Number,
        end_amount: Number
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Closure', closureSchema)
