const Purchase = require('../models/purchase')
const Product = require('../models/product')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const { isInputNotEmpty } = require('../utils/inputUtils')
const { emailSentToVendorAfterPurchaseCreation, emailSentToVendorAfterPurchaseUpdating } = require('../utils/emailUtils')

module.exports = {
    // Add a purchase
    async addPurchase (tenant, user, employee, infos, products, cart_discount,total_price ) {
        try {
            let purchases = await Purchase.find({ tenant })
            purchases = purchases.filter( purchase => purchase.purchase_id !== 'undefined')
            let purchase_id = ''
            if (purchases.length === 0) purchase_id = '#100'
            else {
                const last_purchase = purchases.reduce((last_purchase, purchase) => {
                    if (purchase.date > last_purchase.date) return purchase
                    return last_purchase
                }, purchases[0])
                purchase_id = '#' + (parseInt(last_purchase.purchase_id.slice(1)) + 1)
                // while (await Purchase.findOne({ tenant, purchase_id })) purchase_id = '#' + (parseInt(purchase_id.slice(1)) + 1)
                while (purchases.find(purchase => purchase.purchase_id === purchase_id)) purchase_id = '#' + (parseInt(purchase_id.slice(1)) + 1)
            }
            let purchase = await Purchase.create({ tenant, employee, infos, products, cart_discount,total_price })
            purchase = await Purchase.findOne({ tenant, _id: purchase._id}).populate('employee').populate('infos.vendor').populate('infos.branch_to_be_shipped')
            if (purchase.infos.vendor) {
                const email = purchase.infos.vendor.mail
                if (email) await emailSentToVendorAfterPurchaseCreation(email, purchase)
            }
            await logControllers.addLog(tenant, user, 'create', 'purchase', purchase)
            return { status: 201, details: purchase }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get purchase by id
    async getPurchaseById (tenant, id) {
        try {
            const purchase = await Purchase.findOne({ tenant, _id: id })
            return { status: 200, details: purchase }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get purchases
    async getPurchases (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const purchases = await Purchase.find({ tenant }).populate('employee').populate('infos.vendor').populate('infos.branch_to_be_shipped')
                const count = purchases.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: purchases } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const purchases = await Purchase.find({ tenant }).populate('Employee').populate('infos.vendor').populate('infos.branch_to_be_shipped').limit(limit).skip(offset)
                const count = purchases.length
                const total = await Purchase.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: purchases }}
            }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get purchases sorted by date
    async getPurchasesSortedByDate (tenant, order, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                let purchases = await Purchase.find({ tenant }).populate('employee').populate('infos.vendor').populate('infos.branch_to_be_shipped')
                if (order === 'asc') purchases.sort((purchaseOne, purchaseTwo) => purchaseOne.infos.billing_date - purchaseTwo.infos.billing_date)
                else if (order === 'desc') purchases.sort((purchaseOne, purchaseTwo) => purchaseTwo.infos.billing_date - purchaseOne.infos.billing_date)
                const count = purchases.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: purchases } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                let purchases = await Purchase.find({ tenant }).populate('Employee').populate('infos.vendor').populate('infos.branch_to_be_shipped').limit(limit).skip(offset)
                if (order === 'asc') purchases.sort((purchaseOne, purchaseTwo) => purchaseOne.infos.billing_date - purchaseTwo.infos.billing_date)
                else if (order === 'desc') purchases.sort((purchaseOne, purchaseTwo) => purchaseTwo.infos.billing_date - purchaseOne.infos.billing_date)
                const count = purchases.length
                const total = await Purchase.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: purchases }}
            }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Update a purchase
    async updatePurchase (tenant, user, id, infos, products, cart_discount) {
        try {
            let purchase = await Purchase.findOne({ tenant, _id: id })
            if (!purchase) return errors.error404
            const origObj = JSON.parse(JSON.stringify(await Purchase.findOne({ tenant, _id: id }).populate('employee').populate('infos.vendor').populate('infos.branch_to_be_shipped')))
            if (!cart_discount) cart_discount = purchase.cart_discount
            if (purchase.infos.status === 'Livrée') return { status: 400, details: { code: 'impossible_to_update', message: 'It\'s impossible to update a completed purchase'}}
            if (!isInputNotEmpty(products)) products = purchase.products
            products.forEach(product => {
                if ((product.status.received > 0 || product.status.not_received > 0 || product.status.damaged > 0) && product.status.received + product.status.not_received + product.status.damaged === product.quantity) {
                    product.status.waiting = false
                    product.quantity = product.status.received
                }
            })
            products = products.map(product => {
                return {
                    id: product.id,
                    name: product.name,
                    status: product.status,
                    quantity: product.quantity,
                    unit_price: product.unit_price,
                    tax: product.tax,
                    sub_total: product.quantity * product.unit_price + (product.quantity * product.unit_price) * product.tax / 100
                }
            })
            if (products.every(product => product.status.waiting === false)) {
                if (products.every(product => product.status.not_received === 0 && product.status.damaged === 0)) infos.status = 'Livrée'
                else infos.status = 'Livrée partiellement'
            }
            const price = products.reduce((amount, {sub_total}) => amount + sub_total, 0)
            const total_price = price - price * cart_discount / 100
            await purchase.updateOne({ $set: { infos: infos, products: products, cart_discount: cart_discount, total_price: total_price } })
            purchase = await Purchase.findOne({ tenant, _id: id }).populate('employee').populate('infos.vendor').populate('infos.branch_to_be_shipped')
            if (['Livrée partiellement', 'Livrée'].includes(purchase.infos.status)) {
                for (let i = 0; i < purchase.products.length; i++) {
                    let product = await Product.findOne({ tenant: purchase.tenant.toString(), _id: purchase.products[i].id.toString() })
                    let branch = product.branches.find(branch => branch.branch.toString() === purchase.infos.branch_to_be_shipped._id.toString())
                    if (branch) branch.stock_count += purchase.products[i].quantity
                    else product.branches.push({ 
                        branch: purchase.infos.branch_to_be_shipped,
                        sell_price: purchase.products[i].sub_total / purchase.products[i].quantity,
                        stock_count: purchase.products[i].quantity,
                        alarm_count: 0
                    })
                    await product.save()
                }
            }
            if (purchase.infos.vendor) {
                const email = purchase.infos.vendor.mail
                if (email) await emailSentToVendorAfterPurchaseUpdating(email, purchase)
            }
            const newObj = JSON.parse(JSON.stringify(purchase))
            await logControllers.addLog(tenant, user, 'update', 'purchase', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: purchase }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
