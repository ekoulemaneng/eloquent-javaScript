const mongoose = require("mongoose")
const { isInputNotEmpty } = require('../utils/inputUtils')
const _ = require('lodash')

const productTypeSchema = new mongoose.Schema(
  {
     tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },

    name: { type: String, required: true},
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    description:  String,
},
  {
    timestamps: true
  }
)




module.exports = mongoose.model('Product_type', productTypeSchema)
