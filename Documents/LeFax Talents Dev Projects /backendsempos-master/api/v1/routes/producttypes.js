const router = require('express').Router()
const controllers = require('../controllers/producttype')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Create a new producttype type
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { name, description } = req.body
        const response = await controllers.addProductType(tenant, user, name, description)
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ id: response.details.id, url: `https://api.onebaz.com/v1/${subdomain}/producttypes/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
//producttype
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getProductTypes(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/producttypes?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/producttypes?page=${response.details.nextPage}&limit=${limit}` : null
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

// Get products categories without auth
router.get('/no_auth', async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getProductTypes(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/producttypes/no_auth?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/producttypes/no_auth?page=${response.details.nextPage}&limit=${limit}` : null
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

router.get('/withprods', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getProductTypesWithProd(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/producttypes?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/producttypes?page=${response.details.nextPage}&limit=${limit}` : null
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

// Get a products categorie without auth
router.get('/:id/no_auth', async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getProductTypeById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Update a payment type
/* router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const db = req.db
        const { id } = req.params
        const { name, description, type} = req.body
        const response = await controllers.updatePaymentType(db, id, name, description)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
}) */
// Delete a product type
/* router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const db = req.db
        const { id } = req.params
        const response = await controllers.deletePaymentType(db, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
}) */

module.exports = router
