const router = require('express').Router()
const controllers = require('../controllers/orders')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Add an order
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { branch, customer,sale_status,payment, items, tax, total, delivery_employee, delivery_service, delivery_date, delivery_time_period,delivery_hour, tunnel, order_status, pay_model,address,note,date_payment,exp_fee,payment_type,payment_status } = req.body
        console.log('sale_status_1: ', sale_status)
        const response = await controllers.addOrder(tenant, user, branch, customer, tunnel, payment, sale_status, items, tax, total, delivery_employee, delivery_service, delivery_date, delivery_time_period, delivery_hour, order_status, pay_model, note, date_payment, exp_fee, payment_type,payment_status, address)
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/orders/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Get orders
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant_id = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const { delivery_employees, delivery_services, start_creation_date, end_creation_date, start_delivery_date, end_delivery_date, delivery_time_periods, tunnels, payment_status, status } = req.body
        
        console.log('delivery_employees_1: ', delivery_employees, '\ndelivery_services_1: ', delivery_services, '\nstart_creation_date_1: ', start_creation_date, '\nend_creation_date_1: ', end_creation_date, '\nstart_delivery_date_1', start_delivery_date, '\nend_delivery_date_1', end_delivery_date, '\ndelivery_time_periods_1: ', delivery_time_periods, '\ntunnels_1', tunnels, '\npayment_status_1: ', payment_status, '\nstatus_1: ', status)
        
        const response = await controllers.getOrders(tenant_id, delivery_employees, delivery_services, start_creation_date, end_creation_date, start_delivery_date, end_delivery_date, delivery_time_periods, tunnels, payment_status, status, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/orders?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/orders?page=${response.details.nextPage}&limit=${limit}` : null
        res.status(response.status).send({ 
            total: response.details.total,
            count: response.details.count,
            currentPage: response.details.currentPage,
            pages: response.details.pages,
            prev: prevPage, 
            next: nextPage,
            data: response.details.data
        })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Get an order by id
router.get('/:order_id', tenantUserAuth(), async (res, req) => {
    try {
        const tenant_id = req.tenant
        const { order_id } = req.params
        const response = await controllers.getOrderById(tenant_id, order_id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Get undelivered products
router.get('/p/undelivered_products', tenantUserAuth(), async (req, res) => {
    try {
        const tenant_id = req.tenant
        const response = await controllers.getUndeliveredProducts(tenant_id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Update an order
router.patch('/:order_id', tenantUserAuth(), async (res, req) => {
    try {
        const tenant_id = req.tenant
        const user_id = req.user.id
        const { order_id } = req.params
        const { delivery_employee, delivery_service, delivery_date, delivery_time_period, status } = req.body
        const response = await controllers.updateOrder(tenant_id, user_id, order_id, delivery_employee, delivery_service, delivery_date, delivery_time_period, status)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Update payment status
router.patch('/:order_id/payment', tenantUserAuth(), async (req, res) => {
    try {
        const tenant_id = req.tenant
        const user_id = req.user.id
        const { order_id } = req.params
        const { status } = req.query
        const response = await controllers.updateOrderPaymentStatus(tenant_id, user_id, order_id, status)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// // Update an order status
router.patch('/:order_id/general', tenantUserAuth(), async (res, req) => {
    try {
        const tenant_id = req.tenant
        const user_id = req.user.id
        const { order_id } = req.params
        const { status } = req.query
        const response = await controllers.updateOrderStatus(tenant_id, user_id, order_id, status)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

module.exports = router
