const mongoose = require("mongoose")
const { generateUniqueCode } = require('../utils/tokenAndGeneratorsUtils')

const supplierSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        details: {
            supplier_code: { type: String, default: generateUniqueCode(10), required: true, unique: true},
            name: { type: String, required: true, unique: true },
            description: String
        },
        contact: {
            firstname: String,
            lastname: String,
            email: String,
            phones: [String],
            fax: String, 
            website: String
        },
        address: {
            street: String,
            city: String,
            post_code: String,
            state: String,
            country: String
        },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Supplier', supplierSchema)