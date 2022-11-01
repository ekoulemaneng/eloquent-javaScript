const Transaction = require('../models/transaction.js')
const Transaction_Category = require('../models/transaction_category')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty, stringToDate, stringToFloat } = require('../utils/inputUtils')
const { get } = require('lodash')

const getTransaction = (transaction) => {
    return {
        id: transaction._id.toString(),
        name: transaction.name,
        type: transaction.type,
        amount: transaction.amount,
        tax: transaction.tax,
        billing_date: transaction.billing_date,
        payment_date: transaction.payment_date,
        status: transaction.status,
        overdue: (transaction => {
            if (transaction.status === 'completed' || new Date(transaction.payment_date).getTime >= Date.now()) return false
            return true
        })(),
        category: {
            id: transaction.category._id.toString(),
            name: transaction.category.name
        },
        note: transaction.note
    }
}

module.exports = {
    // Add a new transaction
    async addTransaction (tenant, user, name, type, amount, tax, billing_date, payment_date, status, category, note) {
        try {
            const transaction_category = await Transaction_Category.findOne({ tenant, _id: category })
            if (!transaction_category) return { status: 404, details: { code: 'not_found', message: 'This category doesn\'t exist' } }
            if (type !== transaction_category.type) return { status: 404, details: { code: 'invalid_type', message: 'The type of this category is invalid for this transaction' } }
            if (await Transaction.findOne({ tenant, name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used for another transaction'} }
            let transaction = await Transaction.create({ tenant, name, type, amount, tax, billing_date, payment_date, status, category, note })
            transaction = getTransaction(await Transaction.findOne({ tenant, _id: transaction._id }).populate('category'))
            await logControllers.addLog(tenant, user, 'create', 'transaction', transaction)
            return { status: 201, details: transaction }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get a transaction by id
    async getTransactionById (tenant, id) {
        try {
            const transaction = await Transaction.findOne({ tenant, _id: id }).populate('category')
            if (!transaction) return errors.error404
            return { status: 200, details: getTransaction(transaction) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get a transaction by name
    async getTransactionByName (tenant, name) {
        try {
            const transaction = await Transaction.findOne({ tenant, name }).populate('category')
            if (!transaction) return errors.error404
            return { status: 200, details: getTransaction(transaction) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get transactions
    async getTransactions (tenant, types, min_amount, max_amount, min_tax, max_tax, start_billing_date, end_billing_date, start_payment_date, end_payment_date, status, categories, page, limit) {
        try {
            // ------- Set filters ---------
            const filter = {}
            filter.tenant = { $eq: tenant }
            if (isInputNotEmpty(types)) filter.type = { $all: types }
            if (isInputNotEmpty(min_amount) && isInputNotEmpty(max_amount)) filter.$and = [{ amount: { $gte: stringToFloat(min_amount) } }, { amount: { $lte: stringToFloat(max_amount) } }]
            else if (isInputNotEmpty(min_amount) && !isInputNotEmpty(max_amount)) filter.amount = { $gte: stringToFloat(min_amount) }
            else if (!isInputNotEmpty(min_amount) && isInputNotEmpty(max_amount)) filter.amount = { $lte: stringToFloat(max_amount) }
            if (isInputNotEmpty(min_tax) && isInputNotEmpty(max_tax)) filter.$and = [{ tax: { $gte: stringToFloat(min_tax) } }, { tax: { $lte: stringToFloat(max_tax) } }]
            else if (isInputNotEmpty(min_tax) && !isInputNotEmpty(max_tax)) filter.tax = { $gte: stringToFloat(min_tax) }
            else if (!isInputNotEmpty(min_tax) && isInputNotEmpty(max_tax)) filter.tax = { $lte: stringToFloat(max_tax) }
            if (stringToDate('start', start_billing_date) && stringToDate('end', end_billing_date)) filter.$and = [{ billing_date: { $gte: stringToDate('start', start_billing_date) } }, { billing_date: { $lte: stringToDate('end', end_billing_date) } }]
            else if (stringToDate('start', start_billing_date) && !stringToDate('end', end_billing_date)) filter.billing_date = { $gte: stringToDate('start', start_billing_date) }
            else if (!stringToDate('start', start_billing_date) && stringToDate('end', end_billing_date)) filter.billing_date = { $lte: stringToDate('end', end_billing_date) }
            if (stringToDate('start', start_payment_date) && stringToDate('end', end_payment_date)) filter.$and = [{ payment_date: { $gte: stringToDate('start', start_payment_date) }}, { payment_date: { $lte: stringToDate('end', end_payment_date) } }]
            else if (stringToDate('start', start_payment_date) && !stringToDate('end', end_payment_date)) filter.payment_date = { $gte: stringToDate('start', start_payment_date) }
            else if (!stringToDate('start', end_payment_date) && stringToDate('end', end_payment_date)) filter.payment_date = { $lte: stringToDate('end', end_payment_date) }
            if (isInputNotEmpty(status)) filter.status = { $all: status }
            if (isInputNotEmpty(categories)) filter.categories = { $all: categories }
            // --------- Query transfers ------------
            if (page === undefined && limit === undefined) {
                const transactions = await Transaction.find(filter).populate('category')
                const count = transactions.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: transactions.map(transaction => getTransaction(transaction)) }}
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const transactions = await Transaction.find(filter).populate('category').limit(limit).skip(offset)
                const count = transactions.length
                const total = await Transaction.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: transactions.map(transaction => getTransaction(transaction)) }}
            }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    
    // Get monthly treasury reports
    async getTreasuryReports (tenant) {
        try {
            const transactions = (await Transaction.find({ tenant }).populate('category')).map(transaction => getTransaction(transaction))
            const first_transaction = transactions.reduce((first, transaction) => {
                if (new Date(transaction.billing_date) < new Date(first.billing_date)) return transaction
                return first
            }, transactions[0])
            const last_transaction = transactions.reduce((last, transaction) => {
                if (new Date(transaction.payment_date) > new Date(last.payment_date)) return transaction
                return last
            }, transactions[0])
            const collection_categories = (await Transaction_Category.find({ tenant, type: { $eq: 'collection' } })).map(category => {
                return { name: category.name, transactions: [] }
            })
            const disbursement_categories = (await Transaction_Category.find({ tenant, type: { $eq: 'disbursement' } })).map(category => {
                return { name: category.name, transactions: [] }
            })
            const reports = []
            for (let i = new Date(first_transaction.billing_date).getFullYear; i <= new Date(last_transaction).getFullYear; i++) {
                const first_month = i === new Date(first_transaction.billing_date).getFullYear ? new Date(first_transaction.billing_date).getMonth : 0
                const last_month = i === new Date(last_transaction.payment_date).getFullYear ? new Date(last_transaction.payment_date).getMonth : 11 
                for (let j = first_month; j <= last_month; j++) {
                    reports.push({
                        year: i,
                        month: j,
                        month_in_word: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][j],
                        start_cash_flow: 0,
                        end_cash_flow: 0,
                        collections: {
                            amount_underway: 0,
                            amount_completed: 0,
                            categories: collection_categories
                        },
                        disbursements: {
                            amount_underway: 0,
                            amount_completed: 0,
                            categories: disbursement_categories
                        }
                    })
                }
            }
            transactions.forEach(transaction => {
                const report = reports.find(item => item.year === new Date(transaction.billing_date).getFullYear && item.month === new Date(transaction.billing_date).getMonth)
                if (!report) return
                if (transaction.type === 'collection') {
                    const category = report.collections.categories.find(item => item.name === transaction.category.name)
                    category.transactions.push(transaction)
                    if (transaction.status === 'completed') report.collections.amount_completed += transaction.amount
                    else if (transaction.status === 'underway') report.collections.amount_underway += transaction.amount
                }
                if (transaction.type === 'disbursement') {
                    const category = report.disbursements.categories.find(item => item.name === transaction.category.name)
                    category.transactions.push(transaction)
                    if (transaction.status === 'completed') report.disbursements.amount_completed += transaction.amount
                    else if (transaction.status === 'underway') report.disbursements.amount_underway += transaction.amount
                }
            })
            reports.forEach((report, index, array) => {
                if (index !== 0) report.start_cash_flow = array[index - 1].end_cash_flow
                report.end_cash_flow = report.start_cash_flow + report.collections.amount_completed - report.disbursements.amount_completed
            })
            const available_cash_flow = reports[reports.length - 1].end_cash_flow
            return { status: 200, details: { available_cash_flow: available_cash_flow, reports: reports} }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Update a transaction
    async updateTransaction (tenant, user, id, name, type, amount, tax, billing_date, payment_date, status, category, note) {
        try {
            const transaction_category = await Transaction_Category.findOne({ tenant, _id: category })
            if (!transaction_category) return { status: 404, details: { code: 'not_found', message: 'This category doesn\'t exist' } }
            if (type !== transaction_category.type) return { status: 404, details: { code: 'invalid_type', message: 'The type of this category is invalid for this transaction' } }
            if (await Transaction.findOne({ tenant, name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used for another transaction'} }
            let transaction = await Transaction.findOne({ tenant, _id: id})
            const origObj = JSON.parse(JSON.stringify(getTransaction(await Transaction.findOne({ tenant, _id: id}).populate('category'))))
            if (transaction.status === 'underway' && status === 'completed') payment_date = Date.now()
            await transaction.updateOne({ name, type, amount, tax, billing_date, payment_date, status, category, note })
            transaction = getTransaction(await Transaction.findOne({ tenant, _id: id}).populate('category'))
            const newObj = JSON.parse(JSON.stringify(transaction))
            await logControllers.addLog(tenant, user, 'update', 'transaction', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: transaction }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Delete a transaction
    async deleteTransaction (tenant, user, id) {
        try {
            const transaction = await Transaction.findOne({ tenant, _id: id })
            if (!transaction) return errors.error404
            await transaction.deleteOne()
            await logControllers.addLog(tenant, user, 'delete', 'transaction', undefined, undefined, transaction)
            return { status: 200, details: { code: 'transaction_successfully_deleted', message: 'The transaction has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
