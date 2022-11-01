const router = require('express').Router()
const controllers = require('../controllers/branches')
const tenantControllers = require('../controllers/tenants')
const { tenantUserAuth } = require('../middlewares/userAuth')
const { stringToBool } = require('../utils/inputUtils')
const errors = require('../utils/standardErrors')

// Create a new branch
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const user = req.user.id
        const { business_name, business_type, email, phone, address, town, NIU, RCCM } = req.body
        const response = await controllers.addBranch(tenant, user, business_name, business_type, email, phone, address, town, NIU, RCCM, false)
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ id: response.details.id, url: `https://api.onebaz.com/v1/${subdomain}/branches/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Get all branches
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const { page, limit } = req.query
        const response = await controllers.getBranches(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/branches?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/branches?page=${response.details.nextPage}&limit=${limit}` : null
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
// Get core branch
router.get('/corebranch', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const response = await controllers.getCoreBranch(tenant)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Get branch by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const id = req.params.id
        const response = await controllers.getBranchById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Update core branch modules and set catalog visibility
router.patch('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const employee = req.user
        const token = req.token
        let { modules, isCatalogOnline } = req.body
        
         console.log('infos',req.body)
        isCatalogOnline = stringToBool(isCatalogOnline)
        const responseGetCoreBranch = await controllers.getCoreBranch(tenant)
        
        if (responseGetCoreBranch.status != 200) {
            res.status(responseGetCoreBranch.status).send(responseGetCoreBranch.details)
            return
        }
        const responseUpdateBranch = await controllers.updateBranch(tenant, responseGetCoreBranch.details.id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, modules)
        if (responseUpdateBranch.status != 200) {
            res.status(responseUpdateBranch.status).send(responseUpdateBranch.details)
            return
        }


       
        
        res.status(200).send({user:employee, token: token })


    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Update branch
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const id = req.params.id
        const { business_name, business_type, email, phone, address, town, NIU, RCCM, modules } = req.body
        
       
        const responseGetBranch = await controllers.getBranchById(tenant, id)
        
        if (responseGetBranch.status != 200) {
            res.status(responseGetBranch.status).send(responseGetBranch.details)
            return
        }
        if (responseGetBranch.details.isCoreBranch) {
            res.status(errors.error403.status).send(errors.error403.details)
            return
        }
        const responseUpdateBranch = await controllers.updateBranch(tenant, user, id, business_name, business_type, email, phone, address, town, NIU, RCCM)
        res.status(responseUpdateBranch.status).send(responseUpdateBranch.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Delete branch
router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const id = req.params.id
        const response = await controllers.deleteBranch(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

module.exports = router
