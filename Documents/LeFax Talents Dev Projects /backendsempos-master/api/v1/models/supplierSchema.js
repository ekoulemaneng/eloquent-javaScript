const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        details: {
            name: { type: String, required: true, unique: true },
            description: String,
            default_markup: { type: Number, default: 0 }
        },
        contact_info: {
            firstname: String,
            lastname: String,
            company: String,
            email: String,
            phones: [String],
            fax: String, 
            website: String
        },
        addresses: {
            physical_address: {
                street: String,
                city: String,
                post_code: String,
                state: String,
                country: String
            },
            postal_address: {
                street: String,
                city: String,
                post_code: String,
                state: String,
                country: String
            }
        },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    {
        timestamps: true
    }
)