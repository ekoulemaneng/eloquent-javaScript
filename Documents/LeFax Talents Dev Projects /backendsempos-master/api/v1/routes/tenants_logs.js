const router = require('express').Router()
const controllers = require('../controllers/tenants_logs')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Get logs
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { users, types, entities, start_date, end_date } = req.body
        const { page, limit } = req.query
        const response = await controllers.getLogs(tenant, users, types, entities, start_date, end_date, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/tenants_logs?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/tenants_logs?page=${response.details.nextPage}&limit=${limit}` : null
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
// Get a log by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getLog(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
