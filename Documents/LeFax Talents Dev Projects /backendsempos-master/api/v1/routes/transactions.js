const router = require('express').Router()
const controllers = require('../controllers/transactions.js')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Add a new transaction
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { name, type, amount, tax, billing_date, payment_date, status, category, note } = req.body
        const response = await controllers.addTransaction(tenant, user, name, type, amount, tax, billing_date, payment_date, status, category, note)
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/transactions/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get transactions
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { page, limit } = req.query
        const { types, min_amount, max_amount, min_tax, max_tax, start_billing_date, end_billing_date, start_payment_date, end_payment_date, status, categories } = req.body
        const response = await controllers.getTransactions(tenant, types, min_amount, max_amount, min_tax, max_tax, start_billing_date, end_billing_date, start_payment_date, end_payment_date, status, categories, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/transactions?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/transactions?page=${response.details.nextPage}&limit=${limit}` : null
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

// Check the availability of a transaction name
router.get('/verify', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getTransactionByName(tenant, name)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get cash flow reports
router.get('/reports', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const response = await controllers.getTreasuryReports(tenant)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get a transaction by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getTransactionById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Update a transaction
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { name, type, amount, tax, billing_date, payment_date, status, category, note } = req.query
        const response = await controllers.updateTransaction(tenant, user, id, name, type, amount, tax, billing_date, payment_date, status, category, note)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Delete a transaction
router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const response = await controllers.deleteTransaction(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
