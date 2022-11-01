const router = require('express').Router()
const controllers = require('../controllers/employees')
const roleControllers = require('../controllers/roles')
const tenantControllers = require('../controllers/tenants')
const { tenantUserAuth, notForLoggedInUser } = require('../middlewares/userAuth.js')
const { employeeCredentialsEmail, resetEmployeePasswordEmail } = require('../utils/emailUtils')
const { stringToBool, isInputNotEmpty } = require('../utils/inputUtils')
const { passwordGenerator } = require('../utils/tokenAndGeneratorsUtils')


// Add an employee
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const { infos, app_use_settings } = req.body
        if (!isInputNotEmpty(infos.role)) {
            res.status(400).send({ code: 'role_not_provided', message: 'The role has not been provided' })
            return
        }
        if (infos.role === 'Account Owner') {
            res.status(400).send({ code: 'role_not_available', message: 'This role is not longer available'})
            return
        } 
        if ((await roleControllers.getRoleByName(tenant, infos.role)).status !== 200) {
            res.status(400).send({ code: 'invalid_role', message: 'This role is not valid' })
            return
        }
        infos.role = [infos.role]
        // if app user, generate password
       // const password = passwordGenerator()
       // if (app_use_settings.is_app_user) app_use_settings.credentials.password = password
        // Turn string to boolean
        app_use_settings.is_app_user = stringToBool(app_use_settings.is_app_user)
        app_use_settings.send_email_reports = stringToBool(app_use_settings.send_email_reports)
        // Send request
        let pass = app_use_settings.credentials.password;
        const response = await controllers.addEmployee(tenant, user, infos, app_use_settings)
        if (response.status !== 201) {
            res.status(response.status).send(response.details)
            return
        }
        if (!stringToBool(app_use_settings.is_app_user)) {
            res.status(response.status).send({ data: response.details, url: `https://api.onebaz.com/v1/${subdomain}/employees/${response.details.id}` })
            return
        }

        if (!(await employeeCredentialsEmail(subdomain,infos.firstname,infos.lastname,app_use_settings.credentials.email,pass))) {
           // await controllers.deleteEmployee(tenant, response.details.data.id)
           // res.status(400).send({ code: 'unsuccessfull_operation', message: 'The add-employee operation failed because the email does not exist' })
            return
        }
        res.status(response.status).send({ data: response.details.data, url: `https://api.onebaz.com/v1/${subdomain}/employees/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Check email availability for employee as credential
router.get('/verify', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { email } = req.query
        const response = await controllers.getEmployeeByEmail(tenant, email)
        if (response.status != 200) {
            res.status(200).send({ code: 'email_available', message: 'The email is available' })
            return
        }
        res.status(200).send({ code: 'email_not_available', message: 'This email is not longer available' })
    } catch (error) {
       console.error(error)
       res.status(500).send({ message: error })
    }
})
// Log in to an employee account
router.post('/login', notForLoggedInUser, async (req, res) => {
    try {
        const tenant = req.tenant
        const { email, password} = req.body
        const response = await controllers.logInToEmployeeAccount(tenant, email, password)
        const responsetenant = await tenantControllers.getTenantById(tenant)
        res.status(response.status).send({ data: response.details, tenant: responsetenant })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
}) 
// Log out from an employee account
router.patch('/logout', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const id = req.user.id
        const response = await controllers.logOutFromEmployeeAccount(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get all employees
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { page, limit } = req.query
        const response = await controllers.getEmployees(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/employees?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/employees?page=${response.details.nextPage}&limit=${limit}` : null
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
// Get infos tenants by employee
router.get('/tenant-infos', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const response = await tenantControllers.getTenantById(tenant)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Get branches where an employee works
router.get('/:id/branches', tenantUserAuth(), async (req, res) => {
    try { 
        const tenant = req.tenant
        const { id } = req.params
        const response = await controllers.getEmployeeById(tenant, id)
        res.status(response.status).send(response.details.infos.branches)
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
        const response = await controllers.getEmployeeById(tenant, id)
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
        const tenant = req.tenant
        const user = req.user.id
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
        const response = await controllers.updateEmployee(tenant, user, id, infos, app_use_settings)
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
        const user = req.user.id
        const { id } = req.params
        const response = await controllers.deleteEmployee(tenant, user, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
