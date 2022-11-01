const mongoose = require('mongoose')

const transferSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        details: {
            transfer_number: { type: String, unique: true },
            issue_date: { type: Date, default: Date.now() },
            expected_transfer_date: Date,
            branch_source: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
            branch_target: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
            status: { type: String, enum: ['waiting_for_approval', 'waiting_transfer', 'completed'], default: 'waiting_for_approval' },
            note: String
        },
        products: [
            {
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                status: { type: String, enum: ['waiting', 'received', 'not_received', 'distinct', 'damaged'], default: 'waiting'},
                quantities: {
                    requested: { type: Number, required: true },
                    received: { type: Number, default: 0 },
                    not_received: { type: Number, default: 0 },
                    damaged: { type: Number, default: 0 }
                }
            }
        ]
    },
    {
        timestamps: true
    }
)

transferSchema.pre('updateOne', { document: true, query: false }, async function (next) {
    if (this.details.status === 'completed') {
        const Product = this.model('Product')
        for (let i = 0; i < this.products.length; i++) {
            const product = await Product.findOne({ tenant: this.tenant.toString(), _id: this.products[i].id.toString() })
            const branch_source = product.branches.find(branch => branch.branch.toString() === this.details.branch_source.toString())
            if (this.products[i].quantities.received <= branch_source.stock_count) branch_source.stock_count = branch_source.stock_count - this.products[i].quantities.requested
            else {
                this.products[i].quantities.received = branch_source.stock_count
                branch_source.stock_count = 0
            }
            await product.save()
        }
    }
    next()
})

transferSchema.post('updateOne', { document: true, query: false }, async function (transfer) {
    if (transfer.details.status === 'completed') {
        const Product = transfer.model('Product')
        for (let i = 0; i < transfer.products.length; i++) {
            const product = await Product.findOne({ tenant: transfer.tenant.toString(), _id: transfer.products[i].id.toString() })
            const branch_source = product.branches.find(branch => branch.branch.toString() === transfer.details.branch_source.toString())
            const branch_target = product.branches.find(branch => branch.branch.toString() === transfer.details.branch_target.toString())
            if (!branch_target) {
                product.branches.push({ 
                    branch: transfer.details.branch_target.toString(),
                    sell_price: branch_source.sell_price,
                    stock_count: transfer.products[i].quantities.received,
                    alarm_count: branch_source.alarm_count
                })
            }
            else branch_target.stock_count += transfer.products[i].quantities.received
            await product.save()
        }
    }
})

module.exports = mongoose.model('Transfer', transferSchema)
