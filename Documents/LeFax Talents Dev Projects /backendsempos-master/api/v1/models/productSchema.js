const mongoose = require("mongoose");

module.exports = new mongoose.Schema(
  {
    
      name: { type: String, required: true, unique: true },
      brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
      description: String,
      color:String,
      tags: [{ type: mongoose.Schema.Types.ObjectId, ref:'ProductTag' }],
      product_type: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductType' },
      isAvailable: { type: Boolean, default: true },
      images: [{ type: mongoose.Schema.Types.ObjectId, ref:'ProductImage' }],
      type_of_product: { type: String, default: 'standard_product', enum: ['standard_product', 'variant_product', 'composite_product'] },
      isInventorytracked: { type: Boolean, default: true },
      sku: String,
     
      suppliers_informations: [
        {
          supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
          supplier_code: String,
          supplier_price: Number
        }
      ],
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        supplier_price: Number
      }
    ],
    branches: [
      {
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        sell_price: Number,
        stock_count: Number,
        alarm_count: Number,
      }
    ],
 
    tax: [
      {
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        tax: Number
      }
    ],
    
    supply_price: Number,
    retail_price: Number,
  
    variants: {
      variant_attributes: [
        { 
          attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'VariantAttribute' }, 
          value: [String] 
        }
      ],
      variant_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] 
    }
  },
  { 
    timestamps: true 
  }
)
