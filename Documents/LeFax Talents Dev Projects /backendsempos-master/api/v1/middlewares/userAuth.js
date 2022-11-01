const employeeControllers = require('../controllers/employees')
const adminControllers = require('../controllers/admins')
const errors = require('../utils/standardErrors')
const { jwtTokenDecoder } = require('../utils/tokenAndGeneratorsUtils')


module.exports =  {

    adminAuth: (...roles) => {
        try {
            return async (req, res, next) => {
                try {
                    const token = req.headers.admin_api_key
                    if (!token) {
                        res.status(errors.error401.status).send(errors.error401.details)
                        return
                    }
                    const tokenData = jwtTokenDecoder(token)
                    if ((await adminControllers.getAdminById(tokenData.id)).status != 200) {
                        res.status(errors.error403.status).send(errors.error403.details)
                        return
                    }
                    if (!(await adminControllers.getAdminById(tokenData.id)).details.isEmailAuthenticated) {
                        res.status(errors.error403.status).send(errors.error403.details)
                        return
                    }
                    if (!roles.includes(tokenData.role)) {
                        res.status(errors.error403.status).send(errors.error403.details)
                        return
                    }
                    if (tokenData.accessKey != (await adminControllers.getAdminAccessKey(tokenData.id)).details.accessKey) {
                        res.status(errors.error403.status).send(errors.error403.details)
                        return
                    }
                    if (tokenData.expiryTime < Date.now()) {
                        res.status(errors.error403.status).send(errors.error403.details)
                        return
                    }
                    req.user = tokenData
                    next()
                } 
                catch (error) {
                    console.error(error)
                    next(error)
                }
            }
        } 
        catch (error) {
            console.error(error)
        }
    },

    tenantUserAuth: (permissions) => {
        try {
            return async (req, res, next) => {
                try {
                    const tenant = req.tenant
                    const token = req.headers.tenant_user_api_key
                    if (!token) {
                        res.status(errors.error401.status).send(errors.error401.details)
                        return
                    }
                    const tokenData = jwtTokenDecoder(token)
                 
                    if (tokenData.tenant != tenant) {
                        res.status(errors.error401.status).send(errors.error401.details)
                        return
                    }
                    const response = await employeeControllers.getEmployeeByIdForAuth(tenant, tokenData.id)
                    if (response.status != 200) {
                        res.status(errors.error404.status).send(errors.error404.details)
                        return
                    }
                    if (tokenData.key !== (await employeeControllers.getEmployeeAccessKey(tenant, tokenData.id))['key']) {
                        res.status(errors.error403.status).send(errors.error403.details)
                        return
                    }
                    req.token = token
                    req.user = response.details
                    next()
                } 
                catch (error) {
                    console.error(error)
                    next(error)
                }
            }
        } 
        catch (error) {
            console.error(error)
        }
    },

    notForLoggedInUser: (req, res, next) => {
        try {
            const token = req.headers.admin_api_key || req.headers.tenant_user_api_key
            if (token) { 
                res.status(errors.error403.status).send(errors.error403.details)
                return
            }
            next()
        } 
        catch (error) {
            console.error(error)
        }
    }
}
