const Tenant = require('../models/tenant')
const { tenantEmailVerification } = require('../utils/emailUtils')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty } = require('../utils/inputUtils')

const getTenant = (tenant) => {
    return { 
        id: tenant._id.toString(), 
        core_branch: tenant['core_branch'], 
        business_type: tenant['business_type'], 
        db_name: tenant['db_name'], 
        owner_id: tenant['owner_id'], 
        owner_name: tenant['owner_name'], 
        email: tenant['email'], 
        phone: tenant['phone'],
        niu: tenant['niu'], 
        rccm: tenant['rccm'],
        address: tenant['address'],
        sub_domain: tenant['sub_domain'], 
        modules: tenant['modules'],
        isActivated: tenant['isActivated']
    } 
}

module.exports = {
    // Create a new tenant account
    async addTenant (core_branch, business_type, db_name, owner_name, email, phone, country, phone_code, currency_code, sub_domain) {
        try {
            if ((await this.getTenantByEmail(email)).status == 200) return { status: 400, details: { code: 'email_already_used', message: 'This email is already used by another tenant account'}}
            if ((await this.getTenantBySubDomain(sub_domain)).status == 200) return { status: 400, details: { code: 'subdomain_already_used', message: 'This subdomain is already used by another tenant account' } }
            const tenant = await Tenant.create({ core_branch, business_type, db_name, owner_name, email, phone, country, phone_code, currency_code, sub_domain})
            if (!tenant) return errors.error500
            return { status: 201, details: getTenant(tenant) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get tenant by id
    async getTenantById (id) {
        try {
            const tenant = await Tenant.findById(id)
            if (!tenant) return errors.error404
            return { status: 200, details: getTenant(tenant) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }
    ,
    // Get tenant by email
    async getTenantByEmail (email) {
        try {
            const tenant = await Tenant.findOne({ email })
            if (!tenant) return { status: 404, details: { code: 'no_tenant_with_this_email', message: 'There is no tenant with this email' } }
            return { status: 200, details: getTenant(tenant) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get tenant by subdomain
    async getTenantBySubDomain (sub_domain) {
        try {
            const tenant = await Tenant.findOne({ sub_domain })
            if (!tenant) return { status: 404, details: { code: 'no_tenant_with_this_subdomain', message: 'There is no tenant with this subdomain' } }
            return { status: 200, details: getTenant(tenant) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get tenant by database name
    async getTenantByDatabaseName (db_name) {
        try {
            const tenant = await Tenant.findOne({ db_name })
            if (!tenant) return { status: 404, details: { code: 'no_tenant_with_this_database_name', message: 'There is no tenant with this database name' }}
            return { status: 200, details: getTenant(tenant) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get tenants
    async getTenants (page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit
            const tenants = await Tenant.find().limit(limit).skip(offset)
            const count = tenants.length
            const total = await Tenant.countDocuments()
            const pages = Math.ceil(total/limit)
            const data = tenants.map(tenant => getTenant(tenant))
            const prevPage = page > 1 ? page - 1 : null
            const nextPage = page < pages ? page + 1 : null
            return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data } }
        } 
        catch (error) {
            console.error(error)   
            return error
        }
    }
    ,
    // Update tenant
    async updateTenant (tenantreq, user,  core_branch, email, phone, address, niu, rccm) {
        console.log('le tenant',niu)
        console.log('le tenant user',user)
        try {
            if ((await this.getTenantById(tenantreq)).status != 200) return errors.error404
          //  if (isInputNotEmpty(email) && (await this.getTenantByEmail(email)).status == 200) return { status: 400, details: { code: 'email_already_used', message: 'This email is already used by another tenant'}}
            let tenant = await Tenant.findById(tenantreq)
            // if (isInputNotEmpty(email) && tenant.email == email ) return { status: 400, details: { code: 'email_not_exists', message: 'This email doesn\'t exist' }} 
            if (isInputNotEmpty(core_branch)) tenant.core_branch = core_branch
            if (isInputNotEmpty(email)) tenant.email = email
            if (isInputNotEmpty(phone)) tenant.phone = phone
             if (isInputNotEmpty(address)) tenant.address = address
            if (isInputNotEmpty(niu)) tenant.niu = niu
             if (isInputNotEmpty(rccm)) tenant.rccm = rccm
            
            await tenant.save()
            return { status: 200, details: getTenant(tenant) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Update tenant modules and set catalog visibility
    async updateTenantModules (id, modules, isCatalogOnline) {
        try {
            let tenant = await Tenant.findById(id)
            if (!tenant) return errors.error404
            if (modules.length !== 0) {
                let arr = []
                arr.forEach(module => {
                    if (['treasury', 'products', 'marketing', 'services', 'payroll', 'orders', 'reservations', 'billing'].includes(module) && !tenant.modules.includes(module) && !arr.includes(module)) arr.push(module)
                })
                tenant.modules = arr
            }
            if (isCatalogOnline === true || isCatalogOnline === false) tenant.isCatalogOnline = isCatalogOnline
            await tenant.save()
            return { status: 200, details: getTenant(tenant) }
        } 
        catch (error) {
            console.error(error)    
            return error
        }
    },
    // Desactivate a tenant account
    async desactivateTenant (id) {
        try {
            if ((await this.getTenantById(id)).status != 200) return errors.error404
            let tenant = await Tenant.findById(id)
            tenant.isActivated = false
            await tenant.save()
            if (tenant.isActivated) return errors.error500
            return { status: 200, details: { code: 'tenant_desactivated', message: 'The tenant has been successfully desactivated', data: getTenant(tenant) } }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Activate a tenant account
    async activateTenant (id) {
        try {
            if ((await this.getTenantById(id)).status != 200) return errors.error404
            let tenant = await Tenant.findById(id)
            tenant.isActivated = true
            await tenant.save()
            if (!tenant.isActivated) return errors.error500
            return { status: 200, details: { code: 'tenant_reactivated', message: 'The tenant has been successfully reactivated', data: getTenant(tenant) } }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Delete a tenant account
    async deleteTenant (id) {
        try {
            if ((await this.getTenantById(id)).status != 200) return errors.error404
            await Tenant.findByIdAndDelete(id)
            const tenant = await Tenant.findById(id)
            if (!tenant) return errors.error500
            return { status: 200, details: { code: 'tenant_account_deleted', message: 'The tenant account has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }
}
