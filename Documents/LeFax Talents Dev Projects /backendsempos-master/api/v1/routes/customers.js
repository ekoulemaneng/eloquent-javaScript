const router = require('express').Router()
const controllers = require('../controllers/customers')
const { stringToBool, stringToFloat } = require('../utils/inputUtils')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Create a new customer
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { name, type, email, phones,  customers_groups, sendMarketingEmails, street, city, post_code, state, country, birth_date, gender, website, enableLoyalty } = req.body
        const response = await controllers.addCustomer(tenant, user, name, type, email, phones,  customers_groups, sendMarketingEmails, street, city, post_code, state, country, birth_date, gender, website, stringToBool(enableLoyalty))
      
     
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/customers/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get all customers
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getCustomers(tenant, page, limit)

        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customers?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customers?page=${response.details.nextPage}&limit=${limit}` : null
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


// Get a customer by code
router.get('/search', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { code } = req.query
        const response = await controllers.getCustomerByCode(tenant, code)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Check name availability for customer
router.get('/verify', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getCustomerByName(tenant, name)
        if (response.status != 200) res.status(200).send({ code: 'name_available', message: 'This name is available for customer' })
        else res.status(200).send({ code: 'name_not_available', message: 'This name is not longer available for customer' })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get a customer by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getCustomerById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
}) 
// Get customer transactions
router.get('/:customer_id/transactions', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { customer_id } = req.params
        const { page, limit } = req.query
        const { operation_types, start_date, end_date, payment_types, min_amount, max_amount } = req.body
        const response = await controllers.getTransactions(tenant, customer_id, operation_types, start_date, end_date, payment_types, min_amount, max_amount, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customers/${customer_id}/transactions?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customers/${customer_id}/transactions?page=${response.details.nextPage}&limit=${limit}` : null
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
// Get a customer transaction
router.get('/:customer_id/transactions/transaction_id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { customer_id, transaction_id } = req.params
        const response = await controllers.getTransaction(tenant, customer_id, transaction_id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Update a customer
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { name, type, email, phones_to_add, phones_to_remove, fax, customers_groups_to_add, customers_groups_to_remove, sendMarketingEmails, street, city, post_code, state, country, birth_date, gender, website, enableLoyalty } = req.body
        const response = await controllers.updateCustomer(tenant, user, id, name, type, email, [...new Set(phones_to_add)], [...new Set(phones_to_remove)], fax, [...new Set(customers_groups_to_add)], [...new Set(customers_groups_to_remove)], stringToBool(sendMarketingEmails), street, city, post_code, state, country, birth_date, gender, website, stringToBool(enableLoyalty))
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Add a customer transaction
router.patch('/:customer_id/transactions', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { customer_id } = req.params
        const { operation_type, date, payment_type, amount, note} = req.body
        const response = await controllers.addTransaction(tenant, user, customer_id, operation_type, date, payment_type, stringToFloat(amount), note)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Update a customer transaction
router.patch('/:customer_id/transactions/transaction_id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { customer_id, transaction_id } = req.params
        const { operation_type, date, payment_type, amount, note } = req.body
        const response = await controllers.updateTransaction(tenant, user, customer_id, transaction_id, operation_type, date, payment_type, amount, note)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Delete a customer
router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const response = await controllers.deleteCustomer(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

module.exports = router
