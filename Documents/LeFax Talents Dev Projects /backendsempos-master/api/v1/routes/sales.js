const router = require('express').Router()
const controllers = require('../controllers/sales')
const roleControllers = require('../controllers/roles')
const { tenantUserAuth, notForLoggedInUser } = require('../middlewares/userAuth.js')
const { employeeCredentialsEmail, resetEmployeePasswordEmail } = require('../utils/emailUtils')
const { stringToBool, isInputNotEmpty } = require('../utils/inputUtils')


// Add a sale
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain


        req.body.user = req.user.id
        const { branch,user,customer,tunnel,payment,status,items,tax,total } = req.body

   

        
        // Send request
        const response = await controllers.addSale(tenant, branch,user,customer,tunnel,payment,status,items,tax,total )
        if (response.status !== 201) {
            res.status(response.status).send(response.details)
            return
        }
  
   
        res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/sales/${response.details._id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})


// Get all sales
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const subdomain = req.subdomain
        let { branch, user, start_date, end_date, status, page, limit } = req.query
        const response = await controllers.getSales(tenant, branch, user, start_date, end_date, status, page, limit)
console.log("Details sales ---",response)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/employees?branch=${branch}&user=${user}&start_date=${start_date}$end_date=${end_date}&status=${status}&page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/employees?branch=${branch}&user=${user}&start_date=${start_date}$end_date=${end_date}&status=${status}&page=${response.details.prevPage}&limit=${limit}` : null
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
// Get total amount of sales et amounts by payment
router.get('/amounts', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        let { branch, user, start_date, end_date, status } = req.query
        const response = await controllers.getAmountsOfSales(tenant, branch, user, start_date, end_date, status)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get sales history
router.get('/sales-history', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        let { branch, user, start_date, end_date, status } = req.query
        const response = await controllers.getSalesHistory(tenant, branch, user, start_date, end_date, status)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get an employee by id
router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getSaleById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Request a reset-password token
router.patch('/reset-password-token', notForLoggedInUser, async (req, res) => {
    try {
        const tenant = req.tenant
        const { email } = req.body
        const response = await controllers.requestResetPasswordToken(tenant, email)
        if (response.status != 200) {
            res.status(response.status).send(response.details)
            return
        }
        await resetEmployeePasswordEmail(email, response.token)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Reset password
router.patch('/reset-password', notForLoggedInUser, async (req, res) => {
    try {
        const tenant = req.tenant
        const { email, token, password } = req.body
        const response = await controllers.resetPassword(tenant, email, token, password)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Update an employee
router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        console.log('Bingooooooo')
        const tenant = req.tenant
        const { id } = req.params
        const { infos, app_use_settings} = req.body
        // Handle role
        if (infos.role) {
            if (infos.role === 'Account Owner') {
                res.status(400).send({ code: 'role_not_available', message: 'This role is not longer available'})
                return
            } 
            if ((await roleControllers.getRoleByName(tenant, infos.role)).status !== 200) {
                res.status(400).send({ code: 'invalid_role', message: 'This role is not valid' })
                return
            }
            infos.role = [infos.role]
        }
        // Turn string to boolean
        app_use_settings.is_app_user = stringToBool(app_use_settings.is_app_user)
        app_use_settings.send_email_reports = stringToBool(app_use_settings.send_email_reports)
        // If necessary, store the password
        const password = app_use_settings.is_app_user && isInputNotEmpty(app_use_settings.credentials.password) ? app_use_settings.credentials.password : undefined
        // Send request
        const response = await controllers.updateEmployee(tenant, id, infos, app_use_settings)
        if (response.send_email) {
            if (!(await employeeCredentialsEmail(app_use_settings.credentials.email, password))) {
                app_use_settings.is_app_user = false
                await controllers.updateEmployee(tenant, id, infos, app_use_settings)
                res.status(400).send({ code: 'unsuccessfull_operation', message: 'The update-employee operation failed because the email does not exist' })
            }
        }
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Delete an employee
router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.deleteSale(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
