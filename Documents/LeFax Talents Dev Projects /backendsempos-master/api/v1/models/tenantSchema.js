const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
    {
        core_branch: { 
            type: String, 
            trim: true, 
            required: true 
        },
        business_type: { 
            type: String, 
            trim: true 
        },
        db_name: { 
            type: String, 
            required: true, 
            unique: true 
        },
        owner_id: mongoose.ObjectId,
        owner_name: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String, 
            unique: true, 
            required: true 
        },
        phone: String,
        country: { 
            type: String, 
            required: true 
        },
        phone_code: { 
            type: String, 
            required: true 
        },
        currency_code: { 
            type: String, 
            required: true 
        },
        sub_domain: { 
            type: String, 
            unique: true, 
            required: true 
        },
        isActivated: { 
            type: Boolean, 
            default: true, 
            required: true 
        },
        modules: [
            { 
                name: { 
                    type: String, 
                    enum: ['treasury', 'products', 'marketing', 'services', 'payroll', 'orders', 'reservations', 'billing'],
                }, 
                isActivated: { 
                    type: Boolean, 
                    default: true
                }
            }
        ],
        isCatalogOnline: { 
            type: Boolean, 
            default: true 
        }
    },
    { 
        timestamps: true
    }
)
