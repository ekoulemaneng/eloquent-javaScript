const router = require('express').Router()
const controllers = require('../controllers/tenants')
const branchControllers = require('../controllers/branches')
const employeeControllers = require('../controllers/employees')
const deleteDb = require('../utils/deleteDb')
const { tenantCreationEmail } = require('../utils/emailUtils')
const { adminAuth, tenantUserAuth, notForLoggedInUser } = require('../middlewares/userAuth')
const { forbiddenSubDomains } = require('../../../config')
const errors = require('../utils/standardErrors')

// Create a new tenant account
router.post('/', notForLoggedInUser, async (req, res) => {
    try {
        const { firstname, lastname, core_branch, business_type, subdomain, email, phone, country, phone_code, currency_code,  password } = req.body
        if (forbiddenSubDomains.includes(subdomain.toLowerCase())) {
            res.status(400).send({ code: 'incorrect_subdomain', message: 'The subdomain is incorrect' })
            return
        }
       const db_name = (subdomain + '_db').toLowerCase()
        const responseAddTenant = await controllers.addTenant(core_branch, business_type, db_name, firstname + ' ' + lastname, email, phone_code + phone, country, phone_code, currency_code, subdomain.toLowerCase())
        if (responseAddTenant.status !== 201) {
            res.status(responseAddTenant.status).send(responseAddTenant.details)
            return
        }
        const infos = {
            firstname: firstname,
            lastname: lastname,
            role: ['Account Owner', 'Manager'],
            email: email,
            phones: [...[(phone_code + phone)]],
            legal_identification_number: undefined,
            branches: []
        }
        const app_use_settings = {
            is_app_user: true,
            credentials: {
              email: email,
              password: password
            },
            send_email_reports: true
        }
        const responseAddEmployee = await employeeControllers.addEmployee(responseAddTenant.details.id,'', infos, app_use_settings)
        if (responseAddEmployee.status !== 201) {
            res.status(responseAddEmployee.status).send(responseAddEmployee.details)
            return
        }


        const responseCoreBranch = await branchControllers.addBranch(responseAddTenant.details.id,responseAddEmployee.details.id, core_branch, business_type, email, phone_code + phone, undefined, undefined, undefined, undefined, true)
        if (responseCoreBranch.status !== 201) {
            res.status(responseCoreBranch.status).send(responseCoreBranch.details)
            return
        }



        if (!(await tenantCreationEmail(subdomain, email,firstname))) {
            await deleteDb(db_name)
            res.status(400).send({ code: 'unsuccessfull_operation', message: 'The create-torrent operation failed because the email does not exist' })
            return
        }

        res.status(201).send({ 
            tenant: responseAddTenant.details,
            id: responseAddEmployee.details.id , 
            firstname: firstname, 
            lastname: lastname, 
            token: responseAddEmployee.details.token, 
            url: `https://${subdomain}.onebaz.com` 
        })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Check if the email is already used by another tenant account
router.get('/email/verify', async (req, res) => {
    try {
        const { email } = req.query
        const response = await controllers.getTenantByEmail(email)
        if (response.status == 200) {
            res.status(200).send({ code: 'email_not_available', message: 'This email is not longer available' })
            return
        }
        res.status(200).send({ code: 'email-available', message: 'This email is available' })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Check if the subdomain is already used by another tenant account
router.get('/subdomain/verify', async (req, res) => {
    try {
        const { subDomain } = req.query
        const response = await controllers.getTenantBySubDomain(subDomain.toLowerCase())
        if (response.status == 200) {
            res.status(200).send({ code: 'subdomain_not_available', message: 'This subdomain is not longer available' })
            return
        }
        res.status(200).send({ code: 'subdomain-available', message: 'This subdomain is available', url: `https://${subDomain}.onebaz.com` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Get tenants
router.get('/', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const { page, limit } = req.query
        const response = await controllers.getTenants(page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/base/tenants?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/base/tenants?page=${response.details.nextPage}&limit=${limit}` : null
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
// Get tenant by id
router.get('/:id', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const id = req.params.id
        const response = await controllers.getTenantById(id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Desactivate tenant
router.patch('/:id/desactivate', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const id = req.params.id
        const response = await controllers.desactivateTenant(id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})
// Activate tenant
router.patch('/:id/activate', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const id = req.params.id
        const response = await controllers.activateTenant(id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error) 
        res.status(500).send({ message: error })
    }
})


// Update tenant
router.patch('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const { core_branch,email, phone,address, niu, rccm } = req.body
        
       
      
        const responseUpdateTenant = await controllers.updateTenant(tenant, user,  core_branch, email, phone, address, niu, rccm)
        res.status(responseUpdateTenant.status).send(responseUpdateTenant.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Delete tenant
router.delete('/:id', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const id = req.params.id
        const responseGetTenant = await controllers.getTenantById(id)
        if (responseGetTenant.status !== 200) {
            res.status(responseGetTenant.status).send(responseGetTenant.details)
            return
        }
        const dbToDelete = responseGetTenant.details.db_name
        await connectTenantDB(dbToDelete)
        await deleteDb()
        const responseDeleteTenant = await controllers.deleteTenant(id)
        res.status(responseDeleteTenant.status).send(responseDeleteTenant.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
