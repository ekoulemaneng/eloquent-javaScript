const mongoose = require('mongoose')

const purchaseSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        purchase_id: { type: String, unique: true, required: true },
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        infos: {
            purchase_number: { type: String },
            expected_arrival_date: { type: Date },
            vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
            branch_to_be_shipped: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true},
            invoice_number: { type: String },
            billing_date: { type: Date, default: Date.now() },
            status: { type: String, default: 'Attente livraison', enum: [ 'Attente livraison','Annulée', 'Livrée partiellement', 'Livrée'] },
            description: String
        },
        products: [
            {   
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                name: String,
                status: {
                    waiting: { type: Boolean, default: true, required: true },
                    received: { type: Number, default: 0, required: true },
                    not_received: { type: Number, default: 0, required: true },
                    damaged: { type: Number, default: 0, required: true }
                },
                quantity: { type: Number, required: true },
                unit_price: { type: Number, required: true },
                tax: { type: Number, default: 0, required: true },
                sub_total: { type: Number, required: true }
            }
        ],
        cart_discount: { type: Number, default: 0},
        total_price: { type: Number, default: 0, required: true }
    },
    { 
        timestamps: true
    }
)

purchaseSchema.pre('save', { document: true, query: false }, async function (next) {
    const Product = this.model('Product')
    this.products = await Promise.all(this.products.map(async (item) => {
        const product = await Product.findOne({ tenant: this.tenant, _id: item.id })
        return {
            id: product._id,
            name: product.name,
            status: item.status,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax: item.tax,
            sub_total: item.quantity * item.unit_price + (item.quantity * item.unit_price) * item.tax / 100
        }

    }))
    const price = this.products.reduce((amount, {sub_total}) => amount + sub_total)
    next()
})

module.exports = mongoose.model('Purchase', purchaseSchema)
