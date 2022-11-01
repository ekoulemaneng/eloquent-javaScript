const router = require('express').Router()
const controllers = require('../controllers/customers_groups')
const customersControllers = require('../controllers/customers')
const { tenantUserAuth } = require('../middlewares/userAuth')
const { stringToInt } = require('../utils/inputUtils')

// Create a new customers group
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const user = req.user.id
        const { name, description } = req.body
        const response = await controllers.addCustomersGroup(tenant, user, name, description)
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/customersgroups/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Get all customers groups
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getCustomersGroups(tenant, stringToInt(page), stringToInt(limit))
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customersgroups?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customersgroups?page=${response.details.nextPage}&limit=${limit}` : null
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
// Check name availability for customers group
router.get('/verify', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getCustomersGroupByName(tenant, name)
        if (response.status != 200) res.status(200).send({ code: 'name_available', message: 'This name is available for customers group' })
        else res.status(200).send({ code: 'name_not_available', message: 'This name is not longer available for customers group' })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Get customers of a group
router.get('/:id/customers', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { id } = req.params
        const { page, limit } = req.query
        const response = await customersControllers.getCustomersByGroup(tenant, id, stringToInt(page), stringToInt(limit))
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customersgroups/${id}/customers?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/customersgroups/${id}/customers?page=${response.details.nextPage}&limit=${limit}` : null
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
// Get a customers group by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getCustomersGroupById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Update a customers group
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { name, description } = req.body
        const response = await controllers.updateCustomersGroup(tenant, user, id, name, description)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
}),
// Delete a customers group
router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const response = await controllers.deleteCustomersGroup(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
