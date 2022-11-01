const Closure = require('../models/closure')
const logControllers = require('../controllers/tenants_logs')
const Sale = require('../controllers/sales')
const errors = require('../utils/standardErrors')

module.exports = {
    // Open a closure
    async openClosure (tenant, user, branch, employee, start_amount) {
        try {
            let closure = await Closure.findOne({ tenant, employee })
            if (closure && closure.isOpened) return { status: 400, details: { code: 'impossible_to_open_closure', message: 'An employee cannot have two closures opened at the same time' } }
            closure = await Closure.create({ tenant, branch, employee, start_amount})
            closure = await Closure.findOne({ tenant, branch, employee, _id: closure._id }).populate('branch').populate('employee')
            await logControllers.addLog(tenant, user, 'open', 'closure', closure)
            return { status: 201, details: closure }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Check if an employee has a opened closure
    async hasClosureOpened (tenant, employee) {
        try {
            const closures = await Closure.find({ tenant, employee })
            if (closures.length === 0) return { status: 200, details: { hasOpenedClosure: false, code: 'no_closure', message: 'The employee has no closure' } }
            const closure = closures.find(closure => closure.isOpened)
            if (!closure) return { status: 200, details: { hasOpenedClosure: false, code: 'no_opened_closure', message: 'The employee has no opened closure' } }
            return { status: 200, details: { hasOpenedClosure: true, code: 'opened_closure', message: 'The employee has an opened closure' } }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a closure
    async getClosure (tenant, branch, employee, id) {
        try {
            const closure = await Closure.findOne({ tenant, branch, employee, _id: id }).populate('branch').populate('employee')
            if (!closure) return errors.error404
            const sales = await Sale.find({ tenant, branch, user: employee, start_date: { $gte: closure.start_date } })
            const sales_amount = sales.reduce((amount, {total}) => amount + total, 0)
            let payments = []
            sales.forEach(sale => {
                let addItem = true
                for (let i = 0; i < payments.length; i++) {
                    if (payments[i].name === sale.payment) {
                        payments[i].total += sale.total
                        addItem = false
                        break
                    }
                }
                if (addItem) payments.push({ name: sale.payment, total: sale.total })
            }) 
            const sales_to_complete = sales.filter(sale => ['parked', 'picked-unfulfilled'].includes(sale.status)).length
            return { status: 200, details: { data: closure, sales_amount: sales_amount, payments: payments, sales_to_complete: sales_to_complete } }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }, 
    // Close closure
    async closeClosure (tenant, user, branch, employee, id) {
        try {
            let closure = await Closure.findOne({ tenant, branch, employee, _id: id })
            if (!closure) return errors.error404
            const sales = await Sale.find({ tenant, branch, user: employee, start_date: { $gte: closure.start_date } })
            if (sales.find(sale => ['parked', 'picked-unfulfilled'].includes(sale.status)) !== undefined) return { status: 400, details: { code: 'impossible_to_close_cashier', message: 'It is impossible to close cashier because there is parked or/and picked-unfulfilled sales' } }
            closure.isOpened = false
            closure.end_date = Date.now()
            closure.sales_amount = sales.reduce((amount, {total}) => amount + total, 0)
            closure.end_amount = closure.sales_amount + start_amount
            await closure.updateOne()
            closure = await Closure.findOne({ tenant, branch, employee, _id: closure._id }).populate('branch').populate('employee')
            // Get amounts of sales by payment types
            let payments = []
            sales.forEach(sale => {
                let addItem = true
                for (let i = 0; i < payments.length; i++) {
                    if (payments[i].name === sale.payment) {
                        payments[i].total += sale.total
                        addItem = false
                        break
                    }
                }
                if (addItem) payments.push({ name: sale.payment, total: sale.total })
            }) 
            await logControllers.addLog(tenant, user, 'close', 'closure', closure)
            // Return result
            return { status: 200 , details: { data: closure, payments: payments } }   
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
