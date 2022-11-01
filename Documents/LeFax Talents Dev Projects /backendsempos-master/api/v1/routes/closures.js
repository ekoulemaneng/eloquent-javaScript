const router = require('express').Router()
const controllers = require('../controllers/closures')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Open a closure
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        const employee = req.user.id
        const { branch, start_amount } = req.body
        const response = await controllers.openClosure(tenant, employee, branch, employee, start_amount)
        if (response.status !== 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/closures/${response.details._id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Check if an employee has a opened closure
router.get('/check-closure-availability/:employee', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { employee } = req.params
        const response = await controllers.hasClosureOpened(tenant, employee)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get a closure
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const { branch, employee } = req.query
        const response = await controllers.getClosure(tenant, branch, employee, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Close a closure
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { id } = req.params
        const { branch, employee } = req.query
        const response = await controllers.closeClosure(tenant, user, branch, employee, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

module.exports = router
