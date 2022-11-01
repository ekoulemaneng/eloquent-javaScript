const Sale = require('../models/sale')
const Product = require('../models/product')
const Order = require('../models/order')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')
const {  isObjectIDValid, isInputNotEmpty, stringToDate } = require('../utils/inputUtils')

module.exports = {
    // Add a sale
    async addSale (tenant, branch,user,customer,tunnel,payment,status,items,tax,total) {
        try {
            let sales = await Sale.find({ tenant })
            sales = sales.filter(sale => typeof sale.sale_id !== 'undefined')
            let sale_id = ''
            if (sales.length === 0) sale_id = '#100'
            else {
                const last_sale = sales.reduce((last_sale, sale) => {
                    if (sale.date > last_sale.date) return sale
                    return last_sale
                }, sales[0])
                sale_id = "#" + (parseInt(last_sale.sale_id.slice(1)) + 1)
                // while (await Sale.findOne({ tenant, sale_id })) sale_id = '#' + (parseInt(sale_id.slice(1)) + 1)
                while (sales.find(sale => sale.sale_id === sale_id)) sale_id = '#' + (parseInt(sale_id.slice(1)) + 1)
            }
            let sale = await Sale.create({ tenant, sale_id, branch, user, customer, tunnel, payment, status, items ,tax, total })
            sale = await Sale.findOne({ tenant, _id: sale._id }).populate('branch').populate('user').populate('order').populate('customer').populate('items.product')
            await logControllers.addLog(tenant, user, 'create', 'sale', sale)
            return { status: 201, details: sale }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

        // Get sales
        async getSales (tenant, branch, user, start_date, end_date, status, page, limit) {
            try {
                // ------- Set filters ---------
                let filter = {}
                // Set tenant, branch, user, status filters
                filter.tenant = { $eq: tenant }
                if (isInputNotEmpty(branch)) filter.branch = { $eq: branch }
                if (isInputNotEmpty(user)) filter.user = { $eq: user }
                if (isInputNotEmpty(status)) filter.status = { $eq: status }
                // Set start_date and end_date filters
                if (stringToDate('start', start_date) && stringToDate('end', end_date)) filter.$and = [{ date: { $gte: stringToDate('start', start_date) } }, { date: { $lte: stringToDate('end', end_date) } }]
                else if (stringToDate('start', start_date) && !stringToDate('end', end_date)) filter.date = { $gte: stringToDate('start', start_date) }
                else if (!stringToDate('start', start_date) && stringToDate('end', end_date)) filter.date = { $lte: stringToDate('end', end_date) }
                // --------- Query sales ------------
                if (page === undefined && limit === undefined) {
                    const sales = await Sale.find(filter).populate('order').populate({ path: 'customer', select: 'name' }).populate({ path: 'user', select: 'infos.firstname infos.lastname' }).populate({ path: 'items.product', select: 'name' })
                    
                    const count = sales.length
                    return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: sales } }
                }
                else {
                    if (!page) page = 1
                    if (!limit) limit = 20
                    const offset = (page - 1) * limit
                    const sales = await Sale.find(filter).populate('customer').populate('order').populate('user').populate('items.product').limit(limit).skip(offset)
                    const count = sales.length
                    const total = await Sale.countDocuments()
                    const pages = Math.ceil(total/limit)
                    const prevPage = page > 1 ? page - 1 : null
                    const nextPage = page < pages ? page + 1 : null
                    return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: sales }}
                }
            } 
            catch (error) {
                console.error(error)
                return error   
            }
        },

        // Get amounts of sales
        async getAmountsOfSales (tenant, branch, user, start_date, end_date, status) {
            try {
                // ------- Set filters ---------
              
                let filter = {}
                // Set tenant, branch, user, status filters
                filter.tenant = { $eq: tenant }
                if (isInputNotEmpty(branch)) filter.branch = { $eq: branch }
                if (isInputNotEmpty(user)) filter.user = { $eq: user }
                if (isInputNotEmpty(status)) filter.status = { $eq: status }
                // Set start_date and end_date filters
                if (stringToDate('start', start_date) && stringToDate('end', end_date)) filter.$and = [{ date: { $gte: stringToDate('start', start_date) } }, { date: { $lte: stringToDate('end', end_date) } }]
                else if (stringToDate('start', start_date) && !stringToDate('end', end_date)) filter.date = { $gte: stringToDate('start', start_date) }
                else if (!stringToDate('start', start_date) && stringToDate('end', end_date)) filter.date = { $lte: stringToDate('end', end_date) }
                // --------- Query sales ------------
                const sales = await Sale.find(filter)
                // Get total amount of sales
                const amount = sales.reduce((n, {total}) => n + total, 0)
                // Get amounts of sales by payment types
                let payments = []
                sales.forEach(sale => {
                    let addItem = true
                    for (let i = 0; i < payments.length; i++) {
                        if (payments[i].name === sale.payment) {
                            payments[i].total += sale.total
                            addItem = false
                            break
                        }
                    }
                    if (addItem) payments.push({ name: sale.payment, total: sale.total })
                })
                // Get sales by products
                let sales_by_products = []
                for (let i = 0; i < sales.length; i++) {
                    const sale_items = await Promise.all(sales[i].items.map(async (item) => {
                        const product = await Product.findOne({ tenant, _id: item.product.toString() }).select('name')
                        return { product: product.name, quantity: item.quantity, total: item.total, gross_profit: item.total - item.supplyPrice, profit_margin: (item.total - item.supplyPrice) * 100 / item.supplyPrice }
                    }))
                    sale_items.forEach(item => {
                        let addItem = true
                        for (let j = 0; j < sales_by_products.length; j++) {
                            if (sales_by_products[j].product === item.product) {
                                sales_by_products[j].profit_margin = (sales_by_products[j].profit_margin * sales_by_products[j].quantity + item.profit_margin * item.quantity) / (sales_by_products[j].quantity + item.quantity)
                                sales_by_products[j].quantity += item.quantity
                                sales_by_products[j].total += item.total
                                sales_by_products[j].gross_profit += item.gross_profit
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_products.push({ product: item.product, quantity: item.quantity, total: item.total, gross_profit: item.gross_profit, profit_margin: item.profit_margin })
                    })
                }
                // Get sales by categories
                let sales_by_categories = []
                for (let i = 0; i < sales.length; i++) {
                    const sale_items = await Promise.all(sales[i].items.map(async (item) => {
                        const product = await Product.findOne({ tenant, _id: item.product.toString() }).select('product_type').populate('product_type')
                        return { category: product.product_type.name, total: item.total }
                    }))
                    sale_items.forEach(item => {
                        let addItem = true
                        for (let j = 0; j < sales_by_categories.length; j++) {
                            if (sales_by_categories[j].category === item.category) {
                                sales_by_categories[j].total += item.total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_categories.push({ category: item.category, total: item.total})
                    })
                }
                // Return response
                // return { status: 200, details: { amount: amount, payments: payments } }
                return { status: 200, details: { amount, payments, sales_by_products, sales_by_categories } }
            } 
            catch (error) {
                console.error(error)
                return error    
            }
        },

        // Get sales history
        async getSalesHistory (tenant, branch, user, start_date, end_date, status) {
            try {
                // ------- Set filters ---------
                let filter = {}
                // Set tenant, branch, user, status filters
                filter.tenant = { $eq: tenant }
                if (isInputNotEmpty(branch)) filter.branch = { $eq: branch }
                if (isInputNotEmpty(user)) filter.user = { $eq: user }
                if (isInputNotEmpty(status)) filter.status = { $eq: status }
                // Set start_date and end_date filters
                if (stringToDate('start', start_date) && stringToDate('end', end_date)) filter.$and = [{ date: { $gte: stringToDate('start', start_date) } }, { date: { $lte: stringToDate('end', end_date) } }]
                else if (stringToDate('start', start_date) && !stringToDate('end', end_date)) filter.date = { $gte: stringToDate('start', start_date) }
                else if (!stringToDate('start', start_date) && stringToDate('end', end_date)) filter.date = { $lte: stringToDate('end', end_date) }
                // --------- Query sales ------------
                const sales = await Sale.find(filter).populate('order')
                // Get total amount of sales
                const amount = sales.reduce((amount, {total}) => amount + total, 0)
                // Get total supply price amounts of sales
                const supply_price = sales.reduce((amount, sale) => {
                    if (!sale.supplyTotalPrice || typeof sale.supplyTotalPrice !== 'number') return amount + 0
                    return amount + sale.supplyTotalPrice
                }, 0)
                // Calculate gross profit
                const absolute_profit = amount - supply_price
                const percentage_profit = parseInt((absolute_profit * 100) / supply_price)
                // Calculate number of sales by status
                const sales_by_status = [{ status: 'delivery-unfulfilled', quantity: 0 }, { status: 'delivery-completed', quantity: 0 }, { status: 'delivery-cancelled', quantity: 0 }]
                sales.forEach(sale => {
                    for (let i = 0; i < sales_by_status.length; i++) {
                        if (sales_by_status[i].status === sale.status) sales_by_status[i].quantity++
                    }
                })
                // Get the top-5 most sold products
                let top_5_products = []
                sales.forEach(sale => {
                    sale.items.forEach(item => {
                        let addItem = true
                        for (let i = 0; i < top_5_products.length; i++) {
                            if (top_5_products[i].product === item.product.toString()) {
                                top_5_products[i].quantity += item.quantity
                                top_5_products[i].total += item.total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) top_5_products.push({ product: item.product.toString(), quantity: item.quantity, total: item.total })
                    })
                })
                top_5_products.sort((productOne, productTwo) => productTwo.total - productOne.total)
                top_5_products = top_5_products.slice(0, 5)
                top_5_products = await Promise.all(top_5_products.map(async (product) => {
                    const id = product['product']
                    const pdt = await Product.findOne({ tenant, _id: id }).select('name branches').populate('branches')
                    return { product: pdt, quantity: product.quantity, total: product.total }
                }))
                // Get top-5 most sold products categories
                let top_5_categories = []
                for (let i = 0; i < sales.length; i++) {
                    let arr = await Promise.all(sales[i].items.map(async (item) => {
                        const product = await Product.findOne({ tenant, _id: item.product.toString() }).populate('product_type')
                        return { category: product?.product_type.name, quantity: item.quantity, total: item.total }
                    }))
                    arr.forEach(item => {
                        let addItem = true
                        for (let j = 0; j < top_5_categories.length; j++) {
                            if (top_5_categories[j].category === item.category) {
                                top_5_categories[j].quantity += item.quantity
                                top_5_categories[j].total += item.total
                                addItem = false
                                break
                            }
                        }
                        if(addItem) top_5_categories.push({ category: item.category, quantity: item.quantity, total: item.total})
                    })
                }
                top_5_categories.sort((category_one, category_two) => category_two.total - category_one.total)
                top_5_categories = top_5_categories.slice(0, 5)
                // Generate sales history
                const sales_history = { period: '', data: [], label: [] }
                if (['today', 'yesterday'].includes(start_date)) {
                    let data = []
                    for (let i = 0; i < 24; i++) data.push({ time: i, label: i + 'h-' + (i + 1) + 'h', total: 0 })
                    sales.forEach(sale => {
                        const hour = (new Date(sale.date)).getHours()
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].time === hour) {
                                data[i].total += sale.total
                                break
                            }
                        }
                    })
                    sales_history.period = start_date
                    for (let i = 0; i < data.length; i++ ) {
                        sales_history.label.push(data[i].label)
                        sales_history.data.push(data[i].total)
                    }
                }
                else if (['this_week', 'last_week'].includes(start_date)) {
                    let data = []
                    let days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
                    for (let i = 0; i < days.length; i++) data.push({ time: i, label: days[i], total: 0 })
                    sales.forEach(sale => {
                        const day = (new Date(sale.date)).getDay()
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].time === day) {
                                data[i].total += sale.total
                                break
                            }
                        }
                    })
                    sales_history.period = start_date
                    for (let i = 0; i < data.length; i++ ) {
                        sales_history.label.push(data[i].label)
                        sales_history.data.push(data[i].total)
                    }
                }
                else if (['this_month', 'last_month'].includes(start_date)) {
                    let data = []
                    const last_day = stringToDate('end', start_date).getDate()
                    for (let i = 1; i <= last_day; i++) data.push({ time: i, label: i, total: 0 })
                    sales.forEach(sale => {
                        const date = (new Date(sale.date)).getDate()
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].time === date) {
                                data[i].total += sale.total
                                break
                            }
                        }
                    })
                    sales_history.period = start_date
                    for (let i = 0; i < data.length; i++ ) {
                        sales_history.label.push(data[i].label)
                        sales_history.data.push(data[i].total)
                    }
                }
                else if (['this_year', 'last_year'].includes(start_date)) {
                    let data = []
                    let months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
                    for (let i = 0; i < months.length; i++) data.push({ time: i, label: months[i], total: 0 })
                    sales.forEach(sale => {
                        const month = (new Date(sale.date)).getMonth()
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].time === month) {
                                data[i].total += sale.total
                                break
                            }
                        }
                    })
                    sales_history.period = start_date
                    for (let i = 0; i < data.length; i++ ) {
                        sales_history.label.push(data[i].label)
                        sales_history.data.push(data[i].total)
                    }
                }

                // Number of orders

                // console.log('Number of sales: ', sales)
                //const number_of_orders = sales.filter(sale => typeof sale.order !== 'undefined').length

                // Get orders
                let filter_for_orders = {}
                filter_for_orders.tenant = { $eq: tenant }
                if (stringToDate('start', start_date) && stringToDate('end', end_date)) filter_for_orders.$and = [{ createdAt: { $gte: stringToDate('start', start_date) } }, { createdAt: { $lte: stringToDate('end', end_date) } }]
                else if (stringToDate('start', start_date) && !stringToDate('end', end_date)) filter_for_orders.createdAt = { $gte: stringToDate('start', start_date) }
                else if (!stringToDate('start', start_date) && stringToDate('end', end_date)) filter_for_orders.createdAt = { $lte: stringToDate('end', end_date) }
                const orders = await Order.find(filter_for_orders)

                const number_of_orders = orders.length

                // console.log('Number of sales with orders: ', sales.filter(sale => typeof sale.order !== 'undefined'))
                /*
                const orders_unfulfilled = sales.filter(sale => {
                    if (sale.order) return sale.order.status === 'Non traitée'
                    return false
                }).length
                */
                const orders_unfulfilled = orders.filter(order => order.status === 'Non traitée').length
                /*
                const orders_processed = sales.filter(sale => {
                    if (sale.order) return sale.order.status === 'Traitée'
                    return false
                }).length
                */
                const orders_processed = orders.filter(order => order.status === 'Traitée').length
                /*
                const orders_completed = sales.filter(sale => {
                    if (sale.order) return sale.order.status === 'Livrée'
                    return false
                }).length
                */
                const orders_completed = orders.filter(order => order.status === 'Livrée').length
                /*
                const orders_canceled = sales.filter(sale => {
                    if (sale.order) return sale.order.status === 'Annulée'
                    return false
                }).length
                */
                const orders_canceled = orders.filter(order => order.status === 'Annulée').length
                /*
                const orders_in_process = sales.filter(sale => {
                    if (sale.order) return sale.order.status === 'Livraison en cours'
                    return false
                }).length
                */
                const orders_in_process = orders.filter(order => order.status === 'Livraison en cours').length
                /*
                const payment_settled_orders = sales.filter(sale => {
                    if (sale.order) return sale.order.payment_status === 'Reglé'
                    return false
                }).length
                */
                const payment_settled_orders = orders.filter(order => order.payment_status === 'Reglé').length
                /*
                const pending_payment_orders = sales.filter(sale => {
                    if (sale.order) return sale.order.payment_status === 'Attente de paiement'
                    return false
                }).length
                */
                const pending_payment_orders = orders.filter(order => order.payment_status === 'Attente de paiement').length
                /*
                const cancelled_payment_orders = sales.filter(sale => {
                    if (sale.order) return sale.order.payment_status === 'Annulé'
                    return false
                }).length
                */
                const cancelled_payment_orders = orders.filter(order => order.payment_status === 'Annulé').length

                // Return response
                return { status: 200, details: { amount: amount, gross_profit: absolute_profit, profit_margin: percentage_profit, sales_by_status, top_5_products, top_5_categories, sales_history, number_of_orders, orders_unfulfilled, orders_processed, orders_completed, orders_in_process, orders_canceled, payment_settled_orders, pending_payment_orders, cancelled_payment_orders } }
            } 
            catch (error) {
                console.error(error)
                return error    
            }
        },

        // Get sale by id
       async getSaleById (tenant, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' }}
            // const sale = await Sale.findOne({ tenant, _id: id }).populate('customer').populate('order').populate({ path: 'items.product', select: 'name' }).populate('user')
            const sale = await Sale.findOne({ tenant, _id: id }).populate('branch').populate('user').populate('order').populate('customer').populate('items.product')
            if (!sale) return errors.error404
            return { status: 200, details: sale }
        } 
        catch (error) {
           console.error(error)
           return error
        }
    },
    
    
    
    
       async deleteSale (tenant, id) {
        try {
          
            
            await Sale.findByIdAndDelete(id)
            return { status: 200, details: { code: 'sale_deleted', message: 'The sale has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
        }
    }
    
    
    
 
}
