const router = require('express').Router()
const controllers = require('../controllers/purchases')
const { tenantUserAuth } = require('../middlewares/userAuth')
const { stringToInt } = require('../utils/inputUtils')

// Add a purchase
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const employee = req.user.id
        const { infos, products, cart_discount,total_price} = req.body
        const response = await controllers.addPurchase(tenant, employee, employee, infos, products, cart_discount,total_price)
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/purchases/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get purchases
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getPurchases(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/purchases?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/purchases?page=${response.details.nextPage}&limit=${limit}` : null
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

// Get purchases sorted by date
router.get('/sorted-by-date', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { order, page, limit } = req.query
        const response = await controllers.getPurchasesSortedByDate(tenant, order, stringToInt(page), stringToInt(limit))
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/purchases/sorted-by-date?order=${order}&page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/purchases/sorted-by-date?order=${order}&page=${response.details.nextPage}&limit=${limit}` : null
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
        res.status(500).status({ message: error })
    }
})

// Get a purchase by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getPurchaseById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Update a purchase purchase
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { infos, products, cart_discount } = req.body
        const response = await controllers.updatePurchase(tenant, user, id, infos, products, cart_discount)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
