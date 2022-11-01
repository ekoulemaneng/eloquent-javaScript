const router = require('express').Router()
const controllers = require('../controllers/transfers')
const { tenantUserAuth } = require('../middlewares/userAuth')
// Add a new transfer
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const employee = req.user.id
        const subdomain = req.subdomain
        const { details, products } = req.body
        const response = await controllers.addTransfer(tenant, employee, employee, details, products)
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/transfers/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Get transfers
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { page, limit } = req.query
        const { transferred_by, transfer_to, status, start_date, end_date } = req.body
        const response = await controllers.getTransfers(tenant, transferred_by, transfer_to, status, start_date, end_date, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/transfers?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/transfers?page=${response.details.nextPage}&limit=${limit}` : null
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

// Check the availability of a transfer number
router.get('/verify', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { transfer_number } = req.query
        const response = await controllers.getTransferByTransferNumber(tenant, transfer_number)
        if (response.status != 200) {
            res.status(200).send({ code: 'transfer_number_available', message: 'This transfer number is available for a transfer' })
            return
        }
        res.status(200).send({ code: 'transfer_number_not_available', message: 'This transfer number is not longer available for a transfer' })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Get a transfer by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getTransferById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Update a transfer
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { details, products } = req.body
        const response = await controllers.updateTransfer(tenant, user, id, details, products)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })     
    }
})

module.exports = router
