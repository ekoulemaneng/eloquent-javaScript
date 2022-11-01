const mongoose = require("mongoose")

const saleSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        sale_id: { type: String, unique: true, required: true },     
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order'},
        // payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment_Type'},
        payment: { type: String},
        tunnel: { type: String, enum: ['website', 'app-android', 'app-ios', 'pos'] },
        customer: { type:  mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        date: { type: Date, default: Date.now(), required: true },
        status: { type: String, enum: ['en cours', 'complété', 'annulé'] },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                quantity: { type: Number, default: 1 },
                discount: { type: Number, default: 0 },
                price: { type: Number, required: true },
                supplyPrice: { type: Number },
                total: { type: Number, required: true }
            }
        ],
        tax: { type: Number, default: 0},
        supplyTotalPrice: {type: Number},
        total: { type: Number, required: true }
    },
    {
        timestamps: true
    }
)

saleSchema.pre('save', { document: true, query: false }, async function (next) {
    const Product = this.model('Product')
    this.items = await Promise.all(this.items.map(async (item) => {
        let product = await Product.findOne({ tenant: this.tenant, _id: item.product })
        let productBranch = product.branches.find(branch => branch.branch.toString() === this.branch.toString())
        const price = product.retail_price
        const supplyPrice = product.supply_price
        if (product.isInventorytracked && productBranch.stock_count) { productBranch.stock_count = productBranch.stock_count - item.quantity }
        await product.save()
        return {
            product: item.product,
            quantity: item.quantity,
            discount: item.discount,
            price: price,
            supplyPrice: item.quantity * supplyPrice,
            total: item.quantity * price
        }
    }))
    this.supplyTotalPrice = this.items.reduce((n, {supplyPrice}) => n + supplyPrice, 0)
    this.total = this.items.reduce((n, {total}) => n + total, 0)
    next()
})

saleSchema.post('save', { document: true, query: false }, async function (sale) {
    const Transaction_Category = sale.model('Transaction_Category')
    const Transaction = sale.model('Transaction')
    let category = await Transaction_Category.findOne({ tenant: sale.tenant.toString(), name: 'Ventes' })
    if (!category) category = await Transaction_Category.create({ tenant: sale.tenant.toString(), name: 'Ventes', type: 'collection' })
    await Transaction.create({ tenant: sale.tenant.toString(), name: `Vente n° ${sale._id}`, type: 'collection', amount: sale.total, tax: undefined, billing_date: undefined, payment_date: undefined, status: undefined, category: category._id, note: `Sale of products: ${sale}` })
})

module.exports = mongoose.model('Sale', saleSchema)
