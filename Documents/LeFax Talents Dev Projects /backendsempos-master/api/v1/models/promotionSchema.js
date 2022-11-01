const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        general: {
            name: { type: String, required: true, unique: true },
            description: String,
            date_from: Date,
            date_to: Date,
            branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }]
        },
        type_of_promotion: {
            type_of_promotion: { type: String, enum: ['basic', 'advanced'] },
            basic_promotion: {
                discount: Number,
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
            },
            advanced_promotion: {
                condition: { type: String, enum: ['buy_items', 'spend_amount'] },
                reward: { type: String, enum: ['get_items', 'save_amount', 'pay_fixed_price', 'earn_loyalty'] },
                buy_items_condition: {
                    quantity: Number,
                    minimum: Number,
                    maximum: Number,
                    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
                },
                spend_amount_condition: {
                    amount: Number,
                    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
                },
                get_items_reward: {
                    discount: { type: String, enum: ['free', 'percentage', 'amount'] },
                    amount: Number,
                    quantity: Number,
                    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]                
                },
                save_amount_reward: {
                    amount_type: { type: String, enum: ['percentage', 'amount'] },
                    amount: Number,
                    save_off: { type: String, enum: ['entire sale', 'specific_items'], default: 'entire_sale' }
                },
                pay_fixed_price_reward: {
                    amount: Number
                },
                earn_loyalty_reward: {
                    earn: Number
                }
            }
        },
        target: {
            type_of_target: { type: String, enum: ['everyone', 'exclusive'] },
            exclusive_target: {
                target: { type: String, enum: ['customer_group', 'promo_code'] },
                customers_groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerGroup'}],
                promo_codes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode'}]
            }
        },
        offer_loyalty: { type: Boolean, default: false }
    },
    { 
        timestamps: true 
    }
)