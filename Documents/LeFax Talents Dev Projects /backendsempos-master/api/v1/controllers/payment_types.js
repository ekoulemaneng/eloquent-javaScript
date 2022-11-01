const PaymentType = require('../models/payment_type')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const { isInputNotEmpty } = require('../utils/inputUtils')
const errors = require('../utils/standardErrors')

const getPaymentType = (paymentType) => {
    return {
        id: paymentType._id.toString(),
        name: paymentType.name,
        description: paymentType.description,
        type: paymentType.type
    }
}

module.exports = {
    // Create a new payment type
    async addPaymentType (tenant, user, name, description, type) {
        try {
            if (await PaymentType.findOne({ tenant, name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used for another payment type'}}
            const paymentType = await PaymentType.create({ tenant, name, description, type })
            await logControllers.addLog(tenant, user, 'create', 'payment_type', paymentType)
            return { status: 201, details: getPaymentType(paymentType) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a payment type by id
    async getPaymentTypeById (tenant, id) {
        try {
            const paymentType = await PaymentType.findOne({ tenant, _id: id })
            if (!paymentType) return errors.error404
            return { status: 200, details: getPaymentType(paymentType) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a payment type by name
    async getPaymentTypeByName (tenant, name) {
        try {
            const paymentType = await PaymentType.findOne({ tenant, name })
            if (!paymentType) return errors.error404
            return { status: 200, details: getPaymentType(paymentType) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get all payment types 
    async getPaymentTypes (tenant, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit
            const paymentTypes = await PaymentType.find({ tenant }).limit(limit).skip(offset)
            const count = paymentTypes.length
            const total = await PaymentType.countDocuments()
            const pages = Math.ceil(total/limit)
            const data = paymentTypes.map(paymentType => getPaymentType(paymentType))
            const prevPage = page > 1 ? page - 1 : null
            const nextPage = page < pages ? page + 1 : null
            return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data } }            
        } 
        catch (error) {
            console.error(error) 
            return error   
        }
    },
    // Update a payment type
    async updatePaymentType (tenant, user, id, name, description, type) {
        try {
            let paymentType = await PaymentType.findOne({ tenant, _id: id })
            const origObj = JSON.parse(JSON.stringify(paymentType))
            if (!paymentType) return errors.error404
            if (isInputNotEmpty(name)) paymentType.name = name
            if (isInputNotEmpty(description)) paymentType.description = description
            if (isInputNotEmpty(type)) paymentType.type = type
            await paymentType.save()
            const newObj = JSON.parse(JSON.stringify(await PaymentType.findOne({ tenant, _id: id })))
            await logControllers.addLog(tenant, user, 'update', 'payment_type', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: getPaymentType(paymentType) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Delete a payment type
    async deletePaymentType (tenant, user, id) {
        try {
            const paymentType = await PaymentType.findOne({ tenant, _id: id })
            if (!paymentType) return errors.error404
            await payment.deleteOne()
            await logControllers.addLog(tenant, user, 'delete', 'payment_type', undefined, undefined, paymentType)
            return { status: 200, details: { code: 'payment_type_successfully_deleted', message: 'The payment type has been successfully deleted' }}
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
