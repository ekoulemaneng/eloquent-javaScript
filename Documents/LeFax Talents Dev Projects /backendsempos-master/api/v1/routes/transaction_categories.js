const router = require('express').Router()
const controllers = require('../controllers/transaction_categories')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Add a category
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { name, type } = req.body
        const response = await controllers.addCategory(tenant, user, name, type)
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/transaction_categories/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get categories
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { type } = req.query
        const response = await controllers.getCategories(tenant, type)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Check the availability of a category name
router.get('/verify', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getCategoryByName(tenant, name)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get a category by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getCategoryById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Update a category
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { name, type } = req.body
        const response = await controllers.updateCategory(tenant, user, id, name, type)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Delete a category
router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const response = await controllers.deleteCategory(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
