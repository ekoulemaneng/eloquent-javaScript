const Customer = require('../models/customer')
const Sale = require('../models/sale')
const Branch = require('../models/branch')
const Employee = require('../models/employee')
const Product = require('../models/product')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const { isInputNotEmpty, updateValue } = require('../utils/inputUtils')
const errors = require('../utils/standardErrors')
const { get } = require('lodash')

const generateInvoicesData = async (customer) => {
    try {
        const sales = await Sale.find({ tenant: customer.tenant.toString(), customer: customer._id.toString() })
        return await Promise.all(sales.map(async (sale) => {
            const branch = await Branch.findOne({ tenant: customer.tenant.toString(), _id: sale.branch.toString() })
            const employee = await Employee.findOne({ tenant: customer.tenant.toString(), _id: sale.user.toString() })
            const products = await Promise.all(sale.items.map(async (item) => {
                const pdt = await Product.findOne({ tenant: sale.tenant.toString(), _id: item.product.toString() })
                return {
                    id: item.product.toString(),
                    name: pdt.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    discount: item.discount,
                    amount: item.total
                }
            }))
            return { 
                sale_id: sale._id.toString(),
                branch: branch.business_name,
                seller: employee.infos.firstname + ' ' + employee.infos.lastname,
                products: products,
                amount_excluding_tax: (100 * sale.total) / (100 + sale.tax),
                tax: sale.tax,
                date:sale.createdAt,
                amount_including_tax: sale.total
            }
        }))
    } 
    catch (error) {
        console.error(error)
        return error    
    }
}

const getCustomer = async (customer) => {
    try {
        return {
            id: customer._id.toString(),
            name: customer.name,
            lastname: customer.lastname,
            type: customer.type,
            email: customer.email,
            phones: customer.phones,
            customers_groups: customer.customers_groups.map(customers_group => {
                return {
                    id: customers_group._id.toString(),
                    name: customers_group.name,
                    description: customers_group.description
                }
            }),
            sendMarketingEmails: customer.sendMarketingEmails,
            street: customer.street,
            city: customer.city,
            post_code: customer.post_code,
            state: customer.state,
            country: customer.country,
            birth_date: customer.birth_date,
            gender: customer.gender,
            website: customer.website,
            enableLoyalty: customer.enableLoyalty,
            transactions: customer.transactions,
            balance: customer.transactions.reduce((balance, transaction) => { return balance + transaction.amount }, 0),
            invoices_data: await generateInvoicesData(customer)
        }
    } 
    catch (error) {
        console.error(error)
        return error    
    }
}
module.exports = {
    // Add a new customer
    async addCustomer (tenant, user, name, type, email, phones, customers_groups, sendMarketingEmails, street, city, post_code, state, country, birth_date, gender, website, enableLoyalty) {
        try {
         //   if (await Customer.findOne({ tenant, name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used by another customer'}}
            let customer = await Customer.create({ 
                tenant,
                name,
                type,
                email,
                phones,
                customers_groups,
                sendMarketingEmails,
                street,
                city,
                post_code,
                state,
                country,
                birth_date,
                gender,
                website,
                enableLoyalty
            })
            customer = await Customer.findOne({ tenant, _id: customer._id }).populate('customers_groups')
            customer = await getCustomer(customer)
            await logControllers.addLog(tenant, user, 'create', 'customer', customer)
            return { status: 201, details: customer }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get a customer by id
    async getCustomerById (tenant, id) {
        try {
            const customer = await Customer.findOne({_id: id,tenant}).populate('customers_groups')
            if (!customer) return errors.error404
            return { status: 200, details: await getCustomer(customer) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a customer by name
    async getCustomerByName (tenant, name) {
        try {
            const customer = await Customer.findOne({ 'name': name }).populate('customers_groups')
            if (!customer) return errors.error404
            return { status: 200, details: await getCustomer(customer) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a customer by code
    async getCustomerByCode (tenant, code) {
        try {
            const customer = await Customer.findOne({ 'details.additional_information.customer_code': code }).populate('customers_groups')
            if (!customer) return errors.error404
            return { status: 200, details: await getCustomer(customer) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get customers by group
    async getCustomersByGroup (tenant, group, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const customers = await Customer.find({ tenant, 'customers_groups': { '$all': [ new ObjectId(group) ] } }).populate('customers_groups')
                const count = customers.length
                const prevPage = null
                const nextPage = null
                const data = await Promise.all(customers.map(async (customer) => await getCustomer(customer)))
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: prevPage, nextPage, nextPage: nextPage, data: data } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const customers = await Customer.find({ 'customers_groups': { '$all': [ new ObjectId(group) ] } }).populate('customers_groups').limit(limit).skip(offset)
                const count = customers.length
                const total = await Customer.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                const data = await Promise.all(customers.map(async (customer) => await getCustomer(customer)))
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data } } 
            }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get all customers
    async getCustomers (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const customers = await Customer.find({tenant}).populate('customers_groups')
                const count = customers.length
                const data = await Promise.all(customers.map(async (customer) => await getCustomer(customer)))
                const prevPage = null
                const nextPage = null
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: prevPage, nextPage, nextPage: nextPage, data: data } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const customers = await Customer.find({tenant}).populate('customers_groups').limit(limit).skip(offset)
                const count = customers.length
                const total = await Customer.countDocuments()
                const pages = Math.ceil(total/limit)
                const data = await Promise.all(customers.map(async (customer) => await getCustomer(customer)))
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
    // Update a customer
    async updateCustomer (tenant, user, id, name, type, email, phones_to_add, phones_to_remove, fax, customers_groups_to_add, customers_groups_to_remove, sendMarketingEmails, street, city, post_code, state, country, birth_date, gender, website, enableLoyalty) {
        try {
            // Get model
            // Get customer et carry up verifications
            let customer = await Customer.findOne({ tenant, _id: id })
            const origObj = JSON.parse(JSON.stringify(await Customer.findOne({ tenant, _id: id }).populate('customers_groups')))
            if (!customer) return errors.error404
            if (isInputNotEmpty(name) && customer.name !== name  && await Customer.findOne({ name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used by another customer'}}
            // Add and remove phone numbers
            let phones = customer.contact.phones
            phones = [...new Set([...phones, ...phones_to_add])]
            phones = [...new Set(phones.filter(phone => !phones_to_remove.includes(phone)))]
            // Add and remove customers
            let customers_groups = customer.customers_groups
            customers_groups = customers_groups.map(customers_group => customers_group.toString())
            customers_groups = [...new Set([...customers_groups, ...customers_groups_to_add])]
            customers_groups = [...new Set(customers_groups.filter(customers_group => !customers_groups_to_remove.includes(customers_group)))]
            // Update the customer
            await customer.updateOne({ 
                'name': updateValue(name), 
                'type': updateValue(type), 
                'contact.email': updateValue(email), 
                'contact.phones': phones, 
                'contact.fax': updateValue(fax), 
                'customers_groups': customers_groups, 
                'contact.sendMarketingEmails': updateValue(sendMarketingEmails), 
                'details.postal_address.street': updateValue(street), 
                'details.postal_address.city': updateValue(city), 
                'details.postal_address.post_code': updateValue(post_code),  
                'details.postal_address.state': updateValue(state),
                'details.postal_address.country': updateValue(country),
                'details.additional_information.birth_date': updateValue(birth_date),
                'details.additional_information.gender': updateValue(gender),
                'details.additional_information.website': updateValue(website),
                'details.additional_information.enableLoyalty': updateValue(enableLoyalty)
            })
            //customer = await Customer.findById(id)
            customer = await Customer.findOne({ tenant, _id: customer._id.toString }).populate('customers_groups')
            customer = await getCustomer(customer)
            const newObj = JSON.parse(JSON.stringify(customer))
            await logControllers.addLog(tenant, user, 'update', 'customer', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: customer }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Add a customer transaction
    async addTransaction (tenant_id, user_id, customer_id, operation_type, date, payment_type, amount, note) {
        try {
            let customer = await Customer.findOne({ tenant: tenant_id, _id: customer_id })
            const origObj = JSON.parse(JSON.stringify(await getCustomer(await Customer.findOne({ tenant: tenant_id, _id: customer_id }).populate('customers_groups'))))
            if (!customer) return errors.error404
            let transactions = customer.transactions
            if (['opening', 'payment', 'retail_sale'].includes(operation_type) && amount < 0) amount = - amount
            else if (['collect', 'retail_collect'].includes(operation_type) && amount > 0) amount = - amount
            transactions.push({ operation_type, date, payment_type, amount, note })
            // customer.balance = customer.transactions.reduce((balance, transaction) => { return balance + transaction.amount }, 0)
            await customer.save()
            customer = await Customer.findOne({ tenant: tenant_id, _id: customer._id.toString() }).populate('customers_groups')
            customer = await getCustomer(customer)
            const newObj = JSON.parse(JSON.stringify(customer))
            await logControllers.addLog(tenant_id, user_id, 'create_transaction', 'customer', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: customer }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a customer transaction
    async getTransaction (tenant_id, customer_id, transaction_id) {
        try {
            let customer = await Customer.findOne({ tenant: tenant_id, _id: customer_id })
            if (!customer) return errors.error404
            let transaction = customer.transactions.id(transaction_id)
            if (!transaction) return errors.error404
            return { status: 200, details: transaction }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get customer transactions
    async getTransactions (tenant_id, customer_id, operation_types, start_date, end_date, payment_types, min_amount, max_amount, page, limit) {
        try {
            const customer = await Customer.findOne({ tenant: tenant_id, _id: customer_id })
            let transactions = customer.transactions
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
    // Update a customer transaction
    async updateTransaction (tenant_id, user_id, customer_id, transaction_id, operation_type, date, payment_type, amount, note) {
        try {
            let customer = await Customer.findOne({ tenant: tenant_id, _id: customer_id })
            const origObj = JSON.parse(JSON.stringify(await getCustomer(await Customer.findOne({ tenant: tenant_id, _id: customer_id }).populate('customers_groups'))))
            if (!customer) return errors.error404
            let transaction = customer.transactions.id(transaction_id)
            if (transaction) return errors.error404
            if (['opening', 'payment', 'retail_sale'].includes(operation_type) && amount < 0) amount = - amount
            else if (['collect', 'retail_collect'].includes(operation_type) && amount > 0) amount = - amount
            if (operation_type) transaction.operation_type = operation_type
            if (date) transaction.date = date
            if (payment_type) transaction.payment_type = payment_type
            if (amount) transaction.amount = amount
            if (note) transaction.note = note
            await customer.save()
            customer = await Customer.findOne({ tenant: tenant_id, _id: customer._id.toString }).populate('customers_groups')
            customer = await getCustomer(customer)
            const newObj = JSON.parse(JSON.stringify(customer))
            await logControllers.addLog(tenant_id, user_id, 'update_transaction', 'customer', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: transaction }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Delete a customer
    async deleteCustomer (tenant, user, id) {
        try {
            const customer = await Customer.findOne({ tenant, _id: id })
            if (!customer) return errors.error404
            await customer.deleteOne()
            if (await Customer.findById(id)) return errors.error500
            await logControllers.addLog(tenant, user, 'delete', 'customer', undefined, undefined, customer)
            return { status: 200, details: { code: 'customer_successfully_deleted', message: 'The customer has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
