const router = require('express').Router()
const controllers = require('../controllers/admins.js')
const { jwtTokenDecoder, passwordGenerator } = require('../utils/tokenAndGeneratorsUtils')
const { adminEmailVerification, adminAuthenticationEmail, resetAdminPasswordEmail } = require('../utils/emailUtils')
const errors = require('../utils/standardErrors')
const { adminAuth, notForLoggedInUser } = require('../middlewares/userAuth')

// Create a new admin account
router.post('/', async (req, res) => {
    try {
        const token = req.headers.admin_api_key
        const { firstname, lastname, email, phone, password } = req.body
        if (!(await adminEmailVerification(email))) return { status: 404, details: { code: 'email_not_exists', message: 'This email doesn\'t exist' } }
        const _password = password === undefined ? passwordGenerator() : password
        if (!token && (await controllers.getAdmins()).details.total == 0) {
            const responseOne = await controllers.addAdmin(firstname, lastname, email, phone, 'superadmin', _password)
            if (responseOne.status != 201) {
                res.status(responseOne.status).send(responseOne.details)
                return
            }
            await adminAuthenticationEmail(email, password, responseOne.details.emailToken)
            res.status(responseOne.status).send({ id: responseOne.details.id, token: responseOne.details.accesstoken, url: `https://api.onebaz.com/v1/base/admins/${responseOne.details.id}` })
        }
        else if (!token && (await controllers.getSuperAdmin()).status == 200) {
            res.status(errors.error401.status).send(errors.error401.details)
            return
        }
        else if (token && (await controllers.getSuperAdmin()).status == 200) {
            const tokenData = jwtTokenDecoder(token)
            const superadmin = (await controllers.getSuperAdmin()).details
            if (tokenData.id != superadmin.id || tokenData.role != superadmin.role) {
                res.status(errors.error403.status).send(errors.error403.details)
                return
            }
            const responseTwo = await controllers.addAdmin(firstname, lastname, email, phone, 'admin', _password)
            if (responseTwo.status != 201) {
                res.status(responseTwo.status).send(responseTwo.details)
                return
            }
            await adminAuthenticationEmail(email, password, responseTwo.details.emailToken)
            res.status(responseTwo.status).send({ id: responseTwo.details.id, url: `https://api.onebaz.com/v1/base/admins/${responseTwo.details.id}` })
        }
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error }) 
    }
})
// Check if the email is already used by another admin account
router.get('/email/verify', async (req, res) => {
    try {
        const { email } = req.query
        const response = await controllers.getAdminByEmail(email)
        if (response.status != 200) {
            res.status(200).send({ code: 'email-available', message: 'This email is available' })
            return
        }
        res.status(200).send({ code: 'email_not_available', message: 'This email is not longer available' })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Authenticate email
router.patch('/email/authenticate/:token', notForLoggedInUser, async (req, res) => {
    try {
        const token = req.params.token
        const response = await controllers.authenticateEmail(token)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Log in to an admin account
router.post('/login', notForLoggedInUser, async (req, res) => {
    try {
        const { email, password } = req.body
        const response = await controllers.logIn(email, password)
        if (response.status != 200) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ id: response.details.id, token: response.details.accessToken, url: `https://api.onebaz.com/v1/base/admins/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)    
        res.status(500).send({ message: error })
    }
})
// Log out from an admin account
router.patch('/logout', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const id = req.user.id
        const response = await controllers.logOut(id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})
// Get all admins
router.get('/', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const { page, limit } = req.query
        const response = await controllers.getAdmins(page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/base/admins?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/base/admins?page=${response.details.nextPage}&limit=${limit}` : null
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
// Get an admin by id
router.get('/:id', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const id = req.params.id
        const response = await controllers.getAdminById(id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
    }
})
// Update admin infos
router.patch('/:id/infos', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const adminId = req.user.id
        const id = req.params.id
        if (adminId != id) {
            res.status(errors.error403.status).send(errors.error403.details)
            return
        }
        const { firstname, lastname, phone } = req.body
        const response = await controllers.updateAdminInfos(id, firstname, lastname, phone)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)    
        res.status(500).send({ message: error })
    }
})
// Update admin password
router.patch('/:id/password', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const adminId = req.user.id
        const id = req.params.id
        if (adminId != id) {
            res.status(errors.error403.status).send(errors.error403.details)
            return
        }
        const { password } = req.body
        const response = await controllers.updateAdminPassword(id, password)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)    
        res.status(500).send({ message: error })
    }
})
// Request url to reset password
router.get('/reset-password/token', notForLoggedInUser, async (req, res) => {
    try {
        const { email } = req.query
        const response = await controllers.getResetPasswordToken(email)
        if (response.status != 200) {
            res.status(response.status).send(response.details)
            return
        }
        await resetAdminPasswordEmail(email, response.details.resetToken)
        res.status(response.status).send({ code: 'reset_password_token_sent', message: 'The reset password token has been successfully sent into the email box' })
    } 
    catch (error) {
        console.error(error)  
        res.status(500).send({ message: error })
    }
})
// Reset password
router.patch('/reset-password/:token', notForLoggedInUser, async (req, res) => {
    try {
        const token = req.params.token
        const { password } = req.body
        const response = await controllers.resetPassword(token, password)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)    
        res.status(500).send({ message: error })
    }
})
// Delete an admin account
router.delete('/:id', adminAuth('admin', 'superadmin'), async (req, res) => {
    try {
        const role = req.user.role
        const adminId = req.user.id
        const id = req.params.id
        if (role == 'admin' && adminId != id) {
            res.status(errors.error403.status).send(errors.error403.details)
            return
        }
        const response = await controllers.deleteAdmin(id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

module.exports = router