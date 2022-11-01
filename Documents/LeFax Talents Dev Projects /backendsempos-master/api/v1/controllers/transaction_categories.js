const Transaction_Category = require('../models/transaction_category')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')

const getCategory = (category) => {
    return {
        id: category._id.toString(),
        tenant: category.tenant.toString(),
        name: category.name,
        type: category.type
    }
}

module.exports = {
    // Add a transaction category
    async addCategory(tenant, user, name, type) {
        try {
            const category = await Transaction_Category.create({ tenant, name, type })
            await logControllers.addLog(tenant, user, 'create', 'transaction_category', category)
            return { status: 201, details: getCategory(category) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get a category by id
    async getCategoryById (tenant, id) {
        try {
            const category = await Transaction_Category.findOne({ tenant: tenant, _id: id })
            if (!category) return errors.error404
            return { status: 200, details: getCategory(category) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get a category by name
    async getCategoryByName (tenant, name) {
        try {
            const category = await Transaction_Category.findOne({ tenant, name })
            if (!category) return errors.error404
            return { status: 200, details: getCategory(category) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get categories
    async getCategories (tenant, type) {
        try {
            const filter = {}
            filter.tenant = { $eq: tenant }
            if (type) filter.type = { $eq: type }
            const categories = await Transaction_Category.find(filter)
            return { status: 200, details: categories.map(category => getCategory(category)) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    
    // Update a category
    async updateCategory (tenant, user, id, name, type) {
        try {
            if (await Transaction_Category.findOne({ tenant: tenant, name: name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used for another console' } }
            let category = await Transaction_Category.findOne({ tenant: tenant, _id: id })
            const origObj = JSON.parse(JSON.stringify(category))
            await category.updateOne({ name, type })
            category = await Transaction_Category.findOne({ tenant: tenant, _id: id })
            const newObj = JSON.parse(JSON.stringify(category))
            await logControllers.addLog(tenant, user, 'update', 'transaction_category', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: getCategory(category) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Delete a category
    async deleteCategory (tenant, user, id) {
        try {
            const category = await Transaction_Category.findOne({ tenant: tenant, _id: id })
            if (!category) return errors.error404
            await category.deleteOne()
            await logControllers.addLog(tenant, user, 'delete', 'transaction_category', undefined, undefined, category)
            return { status: 200, details: { code: 'category_successfully_deleted', message: 'The category has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
