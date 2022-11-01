const mongoose = require("mongoose")

module.exports = new mongoose.Schema(
  {
    business_name: { 
      type: String, 
      required: true 
    },
    business_type: String,
    email: String,
    phone: String,
    address: String,
    town: String,
    NIU: String,
    RCCM: String,
    isCoreBranch: { 
      type: Boolean, 
      default: false, 
      required: true 
    },
    branches:[
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref:'Branch' 
      }
    ],
    registers: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Register' 
      }
    ],
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
  ]
  },
  { 
    timestamps: true 
  }
)

