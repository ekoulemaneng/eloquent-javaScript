const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema(
    {
        operation_type: { type: String, enum: ['opening', 'collect', 'payment', 'retail_sale', 'retail_collect'], required: true },
        date: { type: Date, default: Date.now() },
        payment_type: { type: String, enum: ['cash', 'cheque','mobile_money','orange_money', 'bank_transfer'], required: true },
        amount: { type: Number, required: true },
        note: String
    }
)

/*
const productSchema = new mongoose.Schema(
    {
        product_id: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        unit_price: Number,
        discount: Number,
        amount: Number
    }
)

const invoiceSchema = new mongoose.Schema(
    {
        sale_id: mongoose.Schema.Types.ObjectId,
        branch: String,
        seller: String,
        date: { type: Date, default: Date.now() },
        products: [productSchema],
        amount_excluding_tax: Number,
        tax: Number,
        amount_excluding_tax: Number
    }
)
*/

const customerSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        name: { type: String, required: true, unique: true },
        lastname: String,
        type: { type: String, enum: ['individual', 'corporate'], required: true},
        email: String,
        phones: String,
        customers_groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customers_Groups' }],
        sendMarketingEmails: { type: Boolean, default: false },
        street: String,
        city: String,
        post_code: String,
        state: String,
        country: String,
        birth_date: Date,
        gender: { type: String, enum: ['male', 'female'] },
        website: String,
        enableLoyalty: { type: Boolean, default: false },
        //balance: { type: String, default: 0 },
        transactions: [transactionSchema]
        // invoices: [invoiceSchema]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Customer', customerSchema)

