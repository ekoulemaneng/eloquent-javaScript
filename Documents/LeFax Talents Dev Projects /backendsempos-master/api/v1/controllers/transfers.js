const Transfer = require('../models/transfer')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const { isInputNotEmpty, stringToDate } = require('../utils/inputUtils')
const errors = require('../utils/standardErrors')

const getTransfer = transfer => {
    return {
        tenant: transfer.tenant.toString(),
        employee: {
            id: transfer.employee._id.toString(),
            firstname: transfer.employee.infos.firstname,
            lastname: transfer.employee.infos.lastname
        },
        details: {
            transfer_number: transfer.details.transfer_number,
            issue_date: transfer.details.issue_date,
            expected_transfer_date: transfer.details.expected_transfer_date,
            branch_source: {
                id: transfer.details.branch_source._id.toString(),
                name: transfer.details.branch_source.business_name
            },
            branch_target: {
                id: transfer.details.branch_target._id.toString(),
                name: transfer.details.branch_target.business_name
            },
            status: transfer.details.status,
            note: transfer.details.note
        },
        products: transfer.products.map(product => { 
            return {
                product: {
                    id: product._id.toString(),
                    name: product.name
                },
                status: product.status,
                quantities: {
                    requested: product.quantities.requested,
                    received: product.quantities.received,
                    not_received: product.quantities.not_received,
                    damaged: product.quantities.damaged
                }
            } 
        })
    }
}  

module.exports = {
    // A a new transfer
    async  addTransfer (tenant, user, employee, details, products) {
        try {
            let transfer = await Transfer.create({ tenant, employee, details, products})
            transfer = await Transfer.findOne({ tenant, _id: transfer._id }).populate('employee').populate('details.branch_source').populate('details.branch_target').populate('products.id')
            await logControllers.addLog(tenant, user, 'create', 'transfer', getTransfer(transfer))
            return { status: 201, details: getTransfer(transfer) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get a transfer by id
    async getTransferById (tenant, id) {
        try {
            const transfer = await Transfer.findOne({ tenant, _id: id }).populate('employee').populate('details.branch_source').populate('details.branch_target').populate('products.id')
            return { status: 200, details: getTransfer(transfer) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get a transfer by transfer number
    async getTransferByTransferNumber (tenant, transfer_number) {
        try {
            const transfer = await Transfer.findOne({ tenant, 'details.transfer_number': transfer_number }).populate('employee').populate('details.branch_source').populate('details.branch_target').populate('products.id')
            if (!transfer) return errors.error404
            return { status: 200, details: getTransfer(transfer) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get transfers
    async getTransfers (tenant, transferred_by, transfer_to, status, start_date, end_date, page, limit) {
        try {
            // ------- Set filters ---------
            let filter = {}
            // Set tenant, transferred_by, transfer_to and status filters
            filter.tenant = { $eq: tenant }
            if (isInputNotEmpty(transferred_by)) filter['details.branch_source'] = { $all: transferred_by }
            if (isInputNotEmpty(transfer_to)) filter['details.branch_target'] = { $all: transfer_to }
            if (isInputNotEmpty(status)) filter['details.status'] = { $all: status }
            // Set range_date filters
            if (stringToDate('start', start_date) && stringToDate('end', end_date)) filter.$and = [{ 'details.issue_date': { $gte: stringToDate('start', start_date) } }, { 'details.issue_date': { $lte: stringToDate('end', end_date) } }]
            else if (stringToDate('start', start_date) && !stringToDate('end', end_date)) filter['details.issue_date'] = { $gte: stringToDate('start', start_date) }
            else if (!stringToDate('start', start_date) && stringToDate('end', end_date)) filter['details.issue_date'] = { $lte: stringToDate('end', end_date) }
            // --------- Query transfers ------------
            if (page === undefined && limit === undefined) {
                // const transfers = await Transfer.find(filter).populate({ path: 'employee', select: '_id infos.firstname infos.lastname' }).populate({ path: 'details.branch_source', select: '_id business_name' }).populate({ path: 'details.branch_target', select: '_id business_name' }).populate({ path: 'products.id', select: '_id name' })
                const transfers = await Transfer.find(filter).populate('employee').populate('details.branch_source').populate('details.branch_target').populate('products.id')
                const count = transfers.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: transfers.map(transfer => getTransfer(transfer)) } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                // const transfers = await Transfer.find(filter).populate({ path: 'employee', select: '_id infos.firstname infos.lastname' }).populate({ path: 'details.branch_source', select: '_id business_name' }).populate({ path: 'details.branch_target', select: '_id business_name' }).populate({ path: 'products.id', select: '_id name' }).limit(limit).skip(offset)
                const transfers = await Transfer.find(filter).populate('employee').populate('details.branch_source').populate('details.branch_target').populate('products.id').limit(limit).skip(offset)
                const count = transfers.length
                const total = await Transfer.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: transfers.map(transfer => getTransfer(transfer)) }}
            }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Update a transfer
    async updateTransfer (tenant, user, id, details, products) {
        try {
            let transfer = await Transfer.findOne({ tenant, _id: id })
            if (!transfer) return errors.error404
            const origObj = JSON.parse(JSON.stringify(getTransfer(await Transfer.findOne({ tenant, _id: id }).populate('employee').populate('details.branch_source').populate('details.branch_target').populate('products.id'))))
            if (transfer.details.status === 'completed') return { status: 400, details: { code: 'impossible_to_update', message: 'It\'s impossible to update a completed transfert'}}
            products.forEach(product => {
                const quantity_requested = transfer.products.find(item => item.id.toString() === product.id).quantities.requested
                if (product.status === 'received') product.quantities = { received: quantity_requested, not_received: 0, damaged: 0 }
                else if (product.status === 'not_received') product.quantities = { received: 0, not_received: quantity_requested, damaged: 0 }
                else if (product.status === 'damaged') product.quantities = { received: 0, not_received: 0, damaged: quantity_requested }
                else if (product.status === 'distinct') {
                    if (!product.quantities.received) product.quantities.received = 0
                    if (!product.quantities.not_received) product.quantities.not_received = 0
                    if (!product.quantities.damaged) product.quantities.damaged = 0
                    if (product.quantities.received + product.quantities.not_received + product.quantities.damaged < quantity_requested) {
                        const extra = quantity_requested - (product.quantities.received + product.quantities.not_received + product.quantities.damaged)
                        product.quantities = { received: product.quantities.received + extra, not_received: product.quantities.not_received, damaged: product.quantities.damaged }
                    }
                    else if (product.quantities.received + product.quantities.not_received + product.quantities.damaged > quantity_requested) {
                        const extra = (product.quantities.received + product.quantities.not_received + product.quantities.damaged) - quantity_requested
                        product.quantities = { received: product.quantities.received - extra, not_received: product.quantities.not_received, damaged: product.quantities.damaged }
                    }
                }
            })
            if (products.every(product => product.status !== 'waiting') && transfer.details.status === 'waiting_transfer') details.status = 'completed'
            await transfer.updateOne({ $set: { details: details, products: products } })
            transfer = getTransfer(await Transfer.findOne({ tenant, _id: id }).populate('employee').populate('details.branch_source').populate('details.branch_target').populate('products.id'))
            const newObj = JSON.parse(JSON.stringify(transfer))
            await logControllers.addLog(tenant, user, 'update', 'transfer', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: transfer }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }
}
