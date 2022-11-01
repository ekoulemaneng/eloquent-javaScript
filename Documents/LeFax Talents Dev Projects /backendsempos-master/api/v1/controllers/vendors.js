const Vendor = require('../models/vendor')
const Purchase = require('../models/purchase')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const { isInputNotEmpty } = require('../utils/inputUtils')

const getVendor = async (vendor) => {
    try {
        return {
            id: vendor._id.toString(),
            name: vendor.name,
            contact_person: vendor.contact_person,
            legal_title:vendor.legal_title,
            type: vendor.type,
            email: vendor.email,
            note: vendor.note,
            phone: vendor.phone,
            address: vendor.address,
            transactions: vendor.transactions,
            balance: vendor.transactions.reduce((balance, transaction) => { return balance + transaction.amount }, 0),
            purchases: await Purchase.find({ tenant: vendor.tenant.toString(), 'infos.vendor': vendor._id.toString() })
        }
    } 
    catch (error) {
        console.error(error)
        return error    
    }
}

module.exports = {
    
     async addVendor (tenant,user,name, legal_title, contact_person, phone, email, note, address) {
        try {
         //   if (await Vendor.findOne({ tenant, name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used by another customer'}}
            let vendor = await Vendor.create({ 
                tenant,name, legal_title, contact_person, phone, email, note, address
            })
            console.log(vendor)
            vendor = await Vendor.findOne({ tenant, _id: vendor._id })
            await logControllers.addLog(tenant, user, 'create', 'vendor', vendor)
            return { status: 201, details: await getVendor(vendor) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get a vendor by id
    async getVendorById (tenant, id) {
        try {
            const vendor = await Vendor.findOne({ tenant, _id: id })
            if (!vendor) return errors.error404
            return { status: 200, details: await getVendor(vendor) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get a vendor by name
    async getVendorByName (tenant, name) {
        try {
            const vendor = await Vendor.findOne({ tenant, name })
            if (!vendor) return errors.error404
            return { status: 200, details: await getVendor(vendor) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

//Get all vendors
    async getVendors (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const vendors = await Vendor.find({tenant})
                const count = vendors.length
                const data = await Promise.all(vendors.map(async (vendor) => await getVendor(vendor)))
                const prevPage = null
                const nextPage = null
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: prevPage, nextPage, nextPage: nextPage, data: data } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const vendors = await Vendor.find({tenant}).limit(limit).skip(offset)
                const count = vendors.length
                const total = await Vendor.countDocuments()
                const pages = Math.ceil(total/limit)
                const data = await Promise.all(vendors.map(async (vendor) => await getVendor(vendor)))
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data } } 
            }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Add a vendor transaction
    async addTransaction (tenant_id, user_id, vendor_id, operation_type, date, payment_type, amount, note) {
        try {
            let vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            if (!vendor) return errors.error404
            const origObj = JSON.parse(JSON.stringify(vendor))
            let transactions = vendor.transactions
            if (['opening', 'order', 'collect'].includes(operation_type) && amount > 0) amount = - amount
            else if (operation_type === 'payment' && amount < 0) amount = - amount
            transactions.push({ operation_type, date, payment_type, amount, note })
            await vendor.save()
            vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            const newObj = JSON.parse(JSON.stringify(vendor))
            await logControllers.addLog(tenant_id, user_id, 'create_transaction', 'vendor', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: await getVendor(vendor) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get a vendor transaction
    async getTransaction (tenant_id, vendor_id, transaction_id) {
        try {
            let vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            if (!vendor) return errors.error404
            let transaction = vendor.transactions.id(transaction_id)
            if (!transaction) return errors.error404
            return { status: 200, details: transaction }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get vendor transactions
    async getTransactions (tenant_id, vendor_id, operation_types, start_date, end_date, payment_types, min_amount, max_amount, page, limit) {
        try {
            const vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            let transactions = vendor.transactions
            if (operation_types !== undefined || operation_types.length > 0 ) transactions = transactions.filter(transaction => operation_types.includes(transaction.operation_type))
            if (start_date !== undefined) transactions = transactions.filter(transaction => new Date(transaction.date).getTime() >= new Date(stringToDate(start_date)).getTime())
            if (end_date !== undefined) transactions = transactions.filter(transaction => new Date(transaction.date).getTime() <= new Date(stringToDate(end_date)).getTime())
            if (payment_types !== undefined || payment_types.length > 0) transactions = transactions.filter(transaction => payment_types.includes(transaction.payment_type))
            if (min_amount !== undefined) transactions = transactions.filter(transaction => transaction.amount >= min_amount)
            if (max_amount !== undefined) transactions = transactions.filter(transaction => transaction.amount <= max_amount)
            if (page === undefined && limit === undefined) {
                const count = transactions.length
                return { 
                    status: 200, 
                    details: { 
                        total: count, 
                        count: count, 
                        currentPage: 1, 
                        pages: 1, 
                        prevPage: null, 
                        nextPage: null, 
                        data: transactions.map(transaction => {
                            return {
                                id: transaction._id,
                                operation_type: transaction.operation_type,
                                date: transaction.date,
                                payment_type: transaction.payment_type,
                                amount: transaction.amount,
                                balance: transactions.filter(item => new Date(item.date).getTime() < new Date(transaction.date).getTime()).reduce((balance, transaction) => { return balance + transaction.amount }, 0),
                                note: transaction.note
                            }
                        }) 
                    }
                }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const total = transactions.length
                transactions = transactions.slice(offset, offset + limit)
                const count = transactions.length
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { 
                    status: 200, 
                    details: { 
                        total: total, 
                        count: count, 
                        currentPage: page, 
                        pages: pages, 
                        prevPage: prevPage, 
                        nextPage: nextPage, 
                        data: transactions.map(transaction => {
                            return {
                                id: transaction._id,
                                operation_type: transaction.operation_type,
                                date: transaction.date,
                                payment_type: transaction.payment_type,
                                amount: transaction.amount,
                                balance: transactions.filter(item => new Date(item.date).getTime() < new Date(transaction.date).getTime()).reduce((balance, transaction) => { return balance + transaction.amount }, 0),
                                note: transaction.note
                            }
                        })
                    }
                }
            }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Update a vendor transaction
    async updateTransaction (tenant_id, user_id, vendor_id, transaction_id, operation_type, date, payment_type, amount, note) {
        try {
            let vendor = await Vendor.findOne({ tenant: tenant_id, _id, vendor_id })
            if (!vendor) return errors.error404
            const origObj = JSON.parse(JSON.stringify(vendor))
            let transaction = vendor.transactions.id(transaction_id)
            if (transaction) return errors.error404
            if (['opening', 'payment', 'retail_sale'].includes(operation_type) && amount < 0) amount = - amount
            else if (['collect', 'retail_collect'].includes(operation_type) && amount > 0) amount = - amount
            if (operation_type) transaction.operation_type = operation_type
            if (date) transaction.date = date
            if (payment_type) transaction.payment_type = payment_type
            if (amount) transaction.amount = amount
            if (note) transaction.note = note
            await vendor.save()
            vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            const newObj = JSON.parse(JSON.stringify(vendor))
            await logControllers.addLog(tenant_id, user_id, 'update_transaction', 'vendor', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: await getVendor(vendor) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Updated a vendor
    async updateVendor (tenant, user, id, name, legal_title, contact_person, phone, email, note, address) {
        try {
            let vendor = await Vendor.findOne({ tenant, _id: id }) 
            if (!vendor) return errors.error404
            const origObj = JSON.parse(JSON.stringify(vendor))
            let update = { $set: {} }
            if (!isInputNotEmpty(name)) update.$set.name = name
            if (!isInputNotEmpty(legal_title)) update.$set.legal_title = legal_title
            if (!isInputNotEmpty(contact_person)) update.$set.contact_person = contact_person
            if (!isInputNotEmpty(phone)) update.$set.phone = phone
            if (!isInputNotEmpty(email)) update.$set.email = email
            if (!isInputNotEmpty(note)) update.$set.note = note
            if (!isInputNotEmpty(address)) update.$set.address = address
            vendor = await updateOne(update)
            vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            const newObj = JSON.parse(JSON.stringify(vendor))
            await logControllers.addLog(tenant, user, 'update', 'vendor', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: await getVendor(vendor) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
    
/*
const Vendor = require('../models/vendor')
const errors = require('../utils/standardErrors')

module.exports = {
    // Add a vendor
    async addVendor (tenant, name, legal_title, contact_person, phone, email, note, address) {
        try {
            const vendor = await Vendor.create({ tenant, name, legal_title, contact_person, phone, email, note, address })
            return { status: 201, details: vendor }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get a vendor by id
    async getVendorById (tenant, id) {
        try {
            const vendor = await Vendor.findOne({ tenant, _id: id })
            if (!vendor) return errors.error404
            return { status: 200, details: vendor }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get a vendor by name
    async getVendorByName (tenant, name) {
        try {
            const vendor = await Vendor.findOne({ tenant, name })
            if (!vendor) return errors.error404
            return { status: 200, details: vendor }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get vendors
    async getVendors (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const vendors = await Vendor.find({ tenant })
                const count = vendors.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: vendors } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const vendors = await Vendor.find({ tenant }).limit(limit).skip(offset)
                const count = vendors.length
                const total = await Vendor.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: vendors }}
            }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Add a vendor transaction
    async addTransaction (tenant_id, vendor_id, operation_type, date, payment_type, amount, note) {
        try {
            let vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            if (!vendor) return errors.error404
            let transactions = vendor.transactions
            if (['opening', 'order', 'collect'].includes(operation_type) && amount > 0) amount = - amount
            else if (operation_type === 'payment' && amount < 0) amount = - amount
            transactions.push({ operation_type, date, payment_type, amount })
            vendor.transactions.push({ operation_type, date, payment_type, amount, note })
            vendor.balance = vendor.transactions.reduce((balance, transaction) => { return balance + transaction.amount }, 0)
            await vendor.save()
            return { status: 200, details: vendor }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get a vendor transaction
    async getTransaction (tenant_id, vendor_id, transaction_id) {
        try {
            let vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            if (!vendor) return errors.error404
            let transaction = vendor.transactions.id(transaction_id)
            if (!transaction) return errors.error404
            return { status: 200, details: transaction }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Get vendor transactions
    async getTransactions (tenant_id, vendor_id, operation_types, start_date, end_date, payment_types, min_amount, max_amount, page, limit) {
        try {
            const vendor = await Vendor.findOne({ tenant: tenant_id, _id: vendor_id })
            let transactions = vendor.transactions
            if (operation_types !== undefined || operation_types.length > 0 ) transactions = transactions.filter(transaction => operation_types.includes(transaction.operation_type))
            if (start_date !== undefined) transactions = transactions.filter(transaction => new Date(transaction.date).getTime() >= new Date(stringToDate(start_date)).getTime())
            if (end_date !== undefined) transactions = transactions.filter(transaction => new Date(transaction.date).getTime() <= new Date(stringToDate(end_date)).getTime())
            if (payment_types !== undefined || payment_types.length > 0) transactions = transactions.filter(transaction => payment_types.includes(transaction.payment_type))
            if (min_amount !== undefined) transactions = transactions.filter(transaction => transaction.amount >= min_amount)
            if (max_amount !== undefined) transactions = transactions.filter(transaction => transaction.amount <= max_amount)
            if (page === undefined && limit === undefined) {
                const count = transactions.length
                return { 
                    status: 200, 
                    details: { 
                        total: count, 
                        count: count, 
                        currentPage: 1, 
                        pages: 1, 
                        prevPage: null, 
                        nextPage: null, 
                        data: transactions.map(transaction => {
                            return {
                                id: transaction._id,
                                operation_type: transaction.operation_type,
                                date: transaction.date,
                                payment_type: transaction.payment_type,
                                amount: transaction.amount,
                                balance: transactions.filter(item => new Date(item.date).getTime() < new Date(transaction.date).getTime()).reduce((balance, transaction) => { return balance + transaction.amount }, 0),
                                note: transaction.note
                            }
                        }) 
                    }
                }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const total = transactions.length
                transactions = transactions.slice(offset, offset + limit)
                const count = transactions.length
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { 
                    status: 200, 
                    details: { 
                        total: total, 
                        count: count, 
                        currentPage: page, 
                        pages: pages, 
                        prevPage: prevPage, 
                        nextPage: nextPage, 
                        data: transactions.map(transaction => {
                            return {
                                id: transaction._id,
                                operation_type: transaction.operation_type,
                                date: transaction.date,
                                payment_type: transaction.payment_type,
                                amount: transaction.amount,
                                balance: transactions.filter(item => new Date(item.date).getTime() < new Date(transaction.date).getTime()).reduce((balance, transaction) => { return balance + transaction.amount }, 0),
                                note: transaction.note
                            }
                        })
                    }
                }
            }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Update a vendor transaction
    async updateTransaction (tenant_id, vendor_id, transaction_id, operation_type, date, payment_type, amount, note) {
        try {
            let vendor = await Customer.findOne({ tenant: tenant_id, _id, vendor_id })
            if (!vendor) return errors.error404
            let transaction = vendor.transactions.id(transaction_id)
            if (transaction) return errors.error404
            if (['opening', 'payment', 'retail_sale'].includes(operation_type) && amount < 0) amount = - amount
            else if (['collect', 'retail_collect'].includes(operation_type) && amount > 0) amount = - amount
            if (operation_type) transaction.operation_type = operation_type
            if (date) transaction.date = date
            if (payment_type) transaction.payment_type = payment_type
            if (amount) transaction.amount = amount
            if (note) transaction.note = note
            await vendor.save()
            return { status: 200, details: vendor }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

    // Updated a vendor
    async updateVendor (tenant, id, name, legal_title, contact_person, phone, email, note, address) {
        try {
            let vendor = await Vendor.findOne({ tenant, _id: id })
            vendor = await updateOne({ name, legal_title, contact_person, phone, email, note, address })
            return { status: 200, details: vendor }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
*/
