const router = require('express').Router()
const controllers = require('../controllers/vendors')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Add a new vendor
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { name, legal_title, contact_person, phone, email, note, address } = req.body
        const response = await controllers.addVendor(tenant, user, name, legal_title, contact_person, phone, email, note, address)
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/vendors/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get vendors
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getVendors(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/vendors?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/vendors?page=${response.details.nextPage}&limit=${limit}` : null
        res.status(response.status).send({ 
            total: response.details.total,
            count: response.details.count,
            currentPage: response.details.currentPage,
            pages: response.details.pages,
            prev: prevPage, 
            next: nextPage,
            data: response.details.data
        })
    } catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Check the availability of a name fo vendor
router.get('/verify', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getVendorByName(tenant, name)
        if (response.status != 200) {
            res.status(200).send({ code: 'name_available', message: 'This name is available for a vendor' })
            return
        }
        res.status(200).send({ code: 'name_not_available', message: 'This name is not longer available for a vendor' })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Get a vendor by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getVendorById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get vendor transactions
router.get('/vendor_id/transactions', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { vendor_id } = req.params
        const { page, limit } = req.query
        const { operation_types, start_date, end_date, payment_types, min_amount, max_amount } = req.body
        const response = await controllers.getTransactions(tenant, vendor_id, operation_types, start_date, end_date, payment_types, min_amount, max_amount, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/vendors/${vendor_id}/transactions?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/vendors/${vendor_id}/transactions?page=${response.details.nextPage}&limit=${limit}` : null
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

// Get a vendor transaction
router.get('/vendor_id/transactions/transaction_id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { vendor_id, transaction_id } = req.params
        const response = await controllers.getTransaction(tenant, vendor_id, transaction_id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Update a vendor by id
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { name, legal_title, contact_person, phone, email, note, address } = req.body
        const response = await controllers.updateVendor(tenant, user, id, name, legal_title, contact_person, phone, email, note, address)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Add a vendor transaction
router.patch('/:vendor_id/transactions', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { vendor_id } = req.params
        const { operation_type, date, payment_type, amount, note } = req.body
        const response = await controllers.addTransaction(tenant, user, vendor_id, operation_type, date, payment_type, amount, note)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Update a vendor transaction
router.patch('/:vendor_id/transactions/transaction_id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { vendor_id, transaction_id } = req.params
        const { operation_type, date, payment_type, amount, note } = req.body
        const response = await controllers.updateTransaction(tenant, user, vendor_id, transaction_id, operation_type, date, payment_type, amount, note)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

module.exports = router
