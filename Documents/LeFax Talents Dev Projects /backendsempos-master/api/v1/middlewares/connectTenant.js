const tenantControllers = require('../controllers/tenants')
const errors = require('../utils/standardErrors')

module.exports = async (req, res, next) => {
    try {
        const { tenant } = req.params
        if (!tenant) {
            res.status(errors.error403.status).send(errors.error403.details)
            return
        }
        else {
            const response = await tenantControllers.getTenantBySubDomain(tenant)
            if (response.status != 200) {
                res.status(response.status).send(response.details)
                return
            }
            if (!response.details.isActivated) {
                res.status(400).send({ code: 'tenant_desactivated', message: 'The associated tenant has been deactivated' })
                return
            }
            req.tenant = response.details.id
            req.subdomain = response.details.sub_domain
            next()
        }
    } 
        catch (error) {
        console.error(error)
        next(error)
    }
}
  
