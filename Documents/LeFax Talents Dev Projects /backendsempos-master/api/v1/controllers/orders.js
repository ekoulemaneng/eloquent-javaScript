const Order = require('../models/order')
const Sale = require('../models/sale')
const Product = require('../models/product')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const { isInputNotEmpty, stringToDate } = require('../utils/inputUtils')
const errors = require('../utils/standardErrors')
const Employee = require('../models/employee')

const getOrder = (order) => {
    return {
        id: order._id.toString(),
        tenant: order.tenant.toString(),
        order_id: order.order_id,
        sale: order.sale,
        delivery_employee: order.delivery_employee,
        delivery_service: order.delivery_service,
        address: order.address,
        note: order.note,
        motif_annulation: order.motif_annulation,
        pay_model: order.pay_model,
        date_payment: order.date_payment,
        exp_fee: order.exp_fee,
        payment_status: order.payment_status,
        payment_type: order.payment_type,
        delivery_date: order.delivery_date,
        delivery_hour: order.delivery_hour,
        delivery_time_period: order.delivery_time_period,
        tunnel: order.tunnel,
        status: order.status,
        modifications_history: order.modifications_history,
        createdAt: order.createdAt
    }
}

module.exports = {
    // Add an order
    
    async addOrder (tenant, user, branch, customer, tunnel, payment, sale_status, items, tax, total, delivery_employee, delivery_service, delivery_date, delivery_time_period,delivery_hour, order_status, pay_model,note,date_payment,exp_fee,payment_type, address) {
        try {
            // Generate order_id
            let orders = await Order.find({ tenant })
            orders = orders.filter(order => typeof order.order_id !== 'undefined')
            let order_id = ''
            if (orders.length === 0) order_id = '#100'
            else {
                const last_order = orders.reduce((last_order, order) => {
                    if (order.date > last_order.date) return order
                    return last_order
                }, orders[0])
                order_id = '#' + (parseInt(last_order.order_id.slice(1)) + 1)
                // while (orders.find(order => order.order_id === order_id)) order_id = '#' + (parseInt(order_id.slice(1)) + 1)
            }
            // Generate sale_id
            let sales = await Sale.find({ tenant })
            sales = sales.filter(sale => typeof sale.sale_id !== 'undefined')
            let sale_id = ''
            if (sales.length === 0) sale_id = '#100'
            else {
                const last_sale = sales.reduce((last_sale, sale) => {
                    if (sale.date > last_sale.date) return sale
                    return last_sale
                }, sales[0])
                sale_id = '#' + (parseInt(last_sale.sale_id.slice(1)) + 1)
                // while (await Sale.findOne({ tenant, sale_id })) sale_id = '#' + (parseInt(sale_id.slice(1)) + 1)
                while (sales.find(sale => sale.sale_id === sale_id)) sale_id = '#' + (parseInt(sale_id.slice(1)) + 1)
            }
            // Add a sale
            const sale = await Sale.create({ tenant, sale_id, branch, user, customer, tunnel, payment, status: sale_status, items, tax, total })
            // Get the employee
            const employee = await Employee.findOne({ tenant, _id: user })
            // Add an order
            let order = await Order.create({ tenant, order_id, sale: sale._id.toString(), delivery_employee, delivery_service, delivery_date, delivery_time_period,delivery_hour, tunnel, pay_model,note,date_payment,exp_fee,payment_type, address, status: order_status, modifications_history: [{ description: `L'employé ${employee.firstname} ${employee.lastname} a ajouté la commande ${order_id}` }] })
            order = await Order.findOne({ tenant, _id: order._id.toString() }).populate('sale').populate('delivery_employee')
            await logControllers.addLog(tenant, user, 'create', 'order', order)
            return { status: 201, details: getOrder(order) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get an order by id
    async getOrderById (tenant_id, order_id) {
        try {
            const order = await Order.findOne({ tenant: tenant_id, _id: order_id }).populate('sale').populate('delivery_employee')
            if (!order) return errors.error404
            return { status: 200, details: getOrder(order) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get orders
    async getOrders (tenant_id, delivery_employees, delivery_services, start_creation_date, end_creation_date, start_delivery_date, end_delivery_date, delivery_time_periods, tunnels, payment_status, status, page, limit) {
        try {
            
            console.log('delivery_employees_2: ', delivery_employees, '\ndelivery_services_2: ', delivery_services, '\nstart_creation_date_2: ', start_creation_date, '\nend_creation_date_2: ', end_creation_date, '\nstart_delivery_date_2', start_delivery_date, '\nend_delivery_date_2', end_delivery_date, '\ndelivery_time_periods_2: ', delivery_time_periods, '\ntunnels_2', tunnels, '\npayment_status_2: ', payment_status, '\nstatus_2: ', status)
        
            let filter = {}
            filter.tenant = { $eq: tenant_id }
            if (isInputNotEmpty(delivery_employees)) filter.delivery_employee = { $all: delivery_employees }
            if (isInputNotEmpty(delivery_services)) filter.delivery_service = { $all: delivery_services }
            if (isInputNotEmpty(delivery_time_periods)) filter.delivery_time_period = { $all: delivery_time_periods }
            if (isInputNotEmpty(tunnels)) filter.tunnel = { $all: tunnels }
            if (isInputNotEmpty(payment_status)) filter.payment_status = { $all: payment_status }
            if (isInputNotEmpty(status)) filter.status = { $all: status }
            // Filter from creation dates
            if (stringToDate('start', start_creation_date) && stringToDate('end', end_creation_date)) filter.$and = [{ createdAt: { $gte: stringToDate('start', start_creation_date) } }, { createdAt: { $lte: stringToDate('end', end_creation_date) } }]
            else if (stringToDate('start', start_creation_date) && !stringToDate('end', end_creation_date)) filter.createdAt = { $gte: stringToDate('start', start_creation_date) }
            else if (!stringToDate('start', start_creation_date) && stringToDate('end', end_creation_date)) filter.createdAt = { $lte: stringToDate('end', end_creation_date) }
            // -------
            // Filter from delivery dates
            if (stringToDate('start', start_delivery_date) && stringToDate('end', end_delivery_date)) filter.$and = [{ delivery_date: { $gte: stringToDate('start', start_delivery_date) } }, { delivery_date: { $lte: stringToDate('end', end_delivery_date) } }]
            else if (stringToDate('start', start_delivery_date) && !stringToDate('end', end_delivery_date)) filter.delivery_date = { $gte: stringToDate('start', start_delivery_date) }
            else if (!stringToDate('start', start_delivery_date) && stringToDate('end', end_delivery_date)) filter.delivery_date = { $lte: stringToDate('end', end_delivery_date) }
            // -------
            if (page === undefined && limit === undefined) {
                console.log('filtre',filter)
                const orders = await Order.find(filter).populate({ path: 'sale', populate: [{ path: 'customer', model: 'Customer', select: 'name' }, { path: 'items.product', select: 'name' }] }).populate('delivery_employee')
                const count = orders.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: orders.map(order => getOrder(order)) } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const orders = await Order.find(filter).populate({
        path: 'sale',
        populate: {
            path: 'customer', 
            model: 'Customer',
         
        }
    }).populate('delivery_employee').limit(limit).skip(offset)
                const count = orders.length
                const total = await Order.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: transfers.map(order => getTransfer(order)) }}
            }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get undelivered products
    async getUndeliveredProducts (tenant_id) {
        try {
            let orders = await Order.find({ tenant: tenant_id }).populate('sale')
            orders = orders.filter(order => order.status === 'delivery-unfulfilled')
            let products = []
            for (let i = 0; i < orders.length; i++) {
                for (let j = 0; j < orders[i].sale.items.length; j++) {
                    const item = orders[i].sale.items[j]
                    const product = await Product.findOne({ tenant: tenant_id, _id: item.product.toString() })
                    let addItem = true
                    for (let k = 0; k < products.length; k++) {
                        if (products[k].id === product._id.toString()) {
                            products[k].quantity += item.quantity
                            addItem = false
                            break
                        }
                    }
                    if (addItem) products.push({ id: product._id.toString(), name: product.name, quantity: item.quantity })
                }
            }
            return { status: 200, details: products }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Update an order
    async updateOrder (tenant_id, user_id, order_id, delivery_employee, delivery_service, delivery_date, delivery_time_period, /* status, */ items) {
        try {
            let order = await Order.findOne({ tenant: tenant_id, _id: order_id })
            if (!order) return errors.error404
            const origObj = JSON.parse(JSON.stringify(await Order.findOne({ tenant: tenant_id, _id: order_id }).populate('sale').populate('delivery_employee')))
            let sale = await Sale.findOne({ tenant: tenant_id, _id: order.sale.toString() })
            if (!sale) return errors.error404
            let update_sale = { $set: {} }
            let update_order = { $set: {} }
            if (!isInputNotEmpty(delivery_employee)) update_order.$set.delivery_employee = delivery_employee
            if (!isInputNotEmpty(delivery_service)) update_order.$set.delivery_service = delivery_employee
            if (!isInputNotEmpty(delivery_date)) update_order.$set.delivery_date = delivery_date
            if (!isInputNotEmpty(delivery_time_period)) update_order.$set.delivery_time_period = delivery_time_period
            // if (!isInputNotEmpty(status)) update_order.$set.status = status
            if (!isInputNotEmpty(items)) update_sale.$set.items = items
            await sale.updateOne(update_sale) 
            await order.updateOne(update_order)
            order = await Order.findOne({ tenant: tenant_id, _id: order_id }).populate('sale').populate('delivery_employee')
            const newObj = JSON.parse(JSON.stringify(order))
            await logControllers.addLog(tenant_id, user_id, 'update', 'order', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: getOrder(order) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Update an order payment status
    async updateOrderPaymentStatus (tenant_id, user_id, order_id, status) {
        try {
            let order = await Order.findOne({ tenant: tenant_id, _id: order_id })
            if (!order) return errors.error404
            const origObj = JSON.parse(JSON.stringify(await Order.findOne({ tenant: tenant_id, _id: order_id }).populate('sale').populate('delivery_employee')))
            const employee = await Employee.findOne({ tenant: tenant_id, _id: user_id })
            if (!isInputNotEmpty(status) && status !== order.payment_status) {
                const old_status = order.payment_status
                order.payment_status = status
                order.modifications_history.push({ description: `L'employé ${employee.firstname} ${employee.lastname} a modifié le statut du paiement de ${old_status} à ${status}` })
                await order.save()
            }
            order = await Order.findOne({ tenant: tenant_id, _id: order_id }).populate('sale').populate('delivery_employee')
            const newObj = JSON.parse(JSON.stringify(order))
            await logControllers.addLog(tenant_id, user_id, 'update_payment_status', 'order', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: getOrder(order) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Update an order status
    async updateOrderStatus (tenant_id, user_id, order_id, status) {
        try {
            let order = await Order.findOne({ tenant: tenant_id, _id: order_id })
            if (!order) return errors.error404
            const employee = await Employee.findOne({ tenant: tenant_id, _id: user_id })
            if (!isInputNotEmpty(status) && status !== order.status) {
                const old_status = order.status
                order.status = status
                order.modifications_history.push({ description: `L'employé ${employee.firstname} ${employee.lastname} a modifié le statut du paiement de ${old_status} à ${status}` })
                await order.save()
            }
            order = await Order.findOne({ tenant: tenant_id, _id: order_id }).populate('sale').populate('delivery_employee')
            const newObj = JSON.parse(JSON.stringify(order))
            await logControllers.addLog(tenant_id, user_id, 'update_order_status', 'order', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: getOrder(order) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }

}
