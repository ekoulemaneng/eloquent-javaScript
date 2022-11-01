const CustomersGroup = require('../models/customers_group')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const { isInputNotEmpty } = require('../utils/inputUtils')
const errors = require('../utils/standardErrors')

const getCustomersGroup = (customersGroup) => {
    return {
        id: customersGroup._id.toString(),
        name: customersGroup.name,
        description: customersGroup.description
    }
}

module.exports = {
    // Create a new customers group
    async addCustomersGroup (tenant, user, name, description) {
        try {
            if (await CustomersGroup.findOne({ tenant, name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used by another customer group'}}
            const customersGroup = await CustomersGroup.create({ tenant, name, description })
            await logControllers.addLog(tenant, user, 'create', 'customers_group', getCustomersGroup(customersGroup))
            return { status: 201, details: getCustomersGroup(customersGroup) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get a customers group by id
    async getCustomersGroupById (tenant, id) {
        try {
            const customersGroup = await CustomersGroup.findOne({ tenant, _id: id })
            if (!customersGroup) return errors.error404
            return { status: 200, details: getCustomersGroup(customersGroup) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get a customers group by name
    async getCustomersGroupByName (tenant, name) {
        try {
            const customersGroup = await CustomersGroup.findOne({ tenant, name })
            if (!customersGroup) return errors.error404
            return { status: 200, details: getCustomersGroup(customersGroup) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get all customers groups
    async getCustomersGroups (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const customersGroups = await CustomersGroup.find({ tenant })
                const count = customersGroups.length
                const prevPage = null
                const nextPage = null
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: prevPage, nextPage: nextPage, data: customersGroups }}
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const customersGroups = await CustomersGroup.find().limit(limit).skip(offset)
                const count = customersGroups.length
                const total = await CustomersGroup.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: customersGroups } }
            }
        } 
        catch (error) {
            console.error(error)    
            return error
        }
    },
    // Update a customers group
    async updateCustomersGroup (tenant, user, id, name, description) {
        try {
            let customersGroup = await CustomersGroup.findOne({ tenant, _id: id })
            const origObj = JSON.parse(JSON.stringify(customersGroup))
            if (!customersGroup) return errors.error404
            if (name != customersGroup.name && await CustomersGroup.findOne({ name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used by another customer group'}}
            if (isInputNotEmpty(name)) customersGroup.name = name
            if (isInputNotEmpty(description)) customersGroup.description = description
            await customersGroup.save()
            const newObj = JSON.parse(JSON.stringify(await CustomersGroup.findOne({ tenant, _id: id })))
            await logControllers.addLog(tenant, user, 'update', 'customers_group', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: customersGroup }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Delete a customers group
    async deleteCustomersGroup (tenant, user, id) {
        try {
            const customersGroup = await CustomersGroup.findOne(tenant, id)
            if(!customersGroup) return errors.error404
            await customersGroup.deleteOne()
            await logControllers.addLog(tenant, user, 'delete', 'branch', undefined, undefined, customersGroup)
            return { status: 200, details: { code: 'customers_group_successfully_deleted', message: 'The customers group has been successfully deleted' } }
        } catch (error) {
            console.error(error)
            return error
        }
    }
}
