const router = require('express').Router()
const controllers = require('../controllers/roles')
const employeeControllers = require('../controllers/employees')
const { tenantUserAuth } = require('../middlewares/userAuth')
const { objectParser, stringToInt } = require('../utils/inputUtils')

// Add a role
router.post('/', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { name, description, back_office, point_of_sale } = req.body
        const response = await controllers.addRole(tenant, user, name, description, objectParser(back_office), objectParser(point_of_sale))
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/roles/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })   
    }
})
// Get all roles
router.get('/', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getRoles(tenant, stringToInt(page), stringToInt(limit))
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/roles?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/roles?page=${response.details.nextPage}&limit=${limit}` : null
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
// Check name availability for a new role
router.get('/verify', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getRoleByName(tenant, name)
        if (response.status != 200) {
            res.status(200).send({ code: 'name_available', message: 'This name is available for a new'})
            return
        }
        res.status(200).send({ code: 'name_not_available', message: 'This is is not longer available for a new role'})
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get a role by name
router.get('/search', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const { name } = req.query
        const response = await controllers.getRoleByName(tenant, name)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Get a role by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getRoleById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get employees that have a role
router.get('/:role/employees', tenantUserAuth, async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { role } = req.params
        const { page, limit } = req.query
        const response = await employeeControllers.getEmployeesByRole(tenant, role, stringToInt(page), stringToInt(limit))
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/roles/${role}/customers?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/roles/${role}/customers?page=${response.details.nextPage}&limit=${limit}` : null
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
// Update a role
router.patch('/:id', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { name, description, back_office, point_of_sale } = req.body
        const response = await controllers.updateRole(tenant, user, id, name, description, objectParser(back_office), objectParser(point_of_sale))
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Delete a role
router.delete('/:id', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const response = await controllers.deleteRole(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
