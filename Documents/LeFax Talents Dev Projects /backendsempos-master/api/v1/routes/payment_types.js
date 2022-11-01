const router = require('express').Router()
const controllers = require('../controllers/payment_types')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Create a new payment type
router.post('/', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { name, description, type } = req.body
        const response = await controllers.addPaymentType(tenant, user, name, description, type)
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/paymenttypes/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get all payment types
router.get('/', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getPaymentTypes(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/paymenttypes?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/paymenttypes?page=${response.details.nextPage}&limit=${limit}` : null
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
// Check if the name is already used for payment type
router.get('/verify', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getPaymentTypeByName(tenant, name)
        if (response.status != 200) res.status(200).send({ code: 'name_available', message: 'This name is available for payment type' })
        else res.status(200).send({ code: 'name_not_available', message: 'This name is not longer available for payment type' })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get a payment type by id
router.get('/:id', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getPaymentTypeById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Update a payment type
router.patch('/:id', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { name, description, type} = req.body
        const response = await controllers.updatePaymentType(tenant, user, id, name, description, type)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Delete a payment type
router.delete('/:id', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const response = await controllers.deletePaymentType(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

module.exports = router
