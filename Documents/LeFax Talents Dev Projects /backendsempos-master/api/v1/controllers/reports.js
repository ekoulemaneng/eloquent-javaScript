const Sale = require('../models/sale')
const Product = require('../models/product')
const { stringToDate } = require('../utils/inputUtils')

module.exports = {
    // Report sales
    async reportSales (tenant, sales_to_report, start_date, end_date) {
        try {
            if (!['branches', 'users', 'orders', 'payments', 'tunnels', 'customers', 'customers', 'status', 'products', 'categories', 'brands'].includes(sales_to_report)) {
                return { status: 400, details: { code: 'wrong_input', message: 'The sales-to-report input is not wrong' } }
            }
            // ------- Set filters ---------
            let filter = {}
            filter.tenant = tenant
            if (stringToDate('start', start_date) && stringToDate('end', end_date)) filter.$and = [{ date: { $gte: stringToDate('start', start_date) } }, { date: { $lte: stringToDate('end', end_date) } }]
            else if (stringToDate('start', start_date) && !stringToDate('end', end_date)) filter.date = { $gte: stringToDate('start', start_date) }
            else if (!stringToDate('start', start_date) && stringToDate('end', end_date)) filter.date = { $lte: stringToDate('end', end_date) }
            // Get sales 
            const sales = await Sale.find(filter).populate('branch').populate('user').populate('order').populate('customer')
            let data = []
            // Switch through different sales-to-report values
            switch (sales_to_report) {
                // Calculate sales by branches
                case 'branches':
                    let sales_by_branches = []
                    for (let i = 0; i < sales.length; i++) {
                        let addItem = true
                        for (let j = 0; j < sales_by_branches.length; j++) {
                            if (sales_by_branches[j].branch._id === sales[i].branch._id.toString()) {
                                sales_by_branches[j].total += sales[i].total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_branches.push({ branch: sales[i].branch, total: sales[i].total })
                    }
                    data = [...sales_by_branches]
                    break
                // Calculate sales by users
                case 'users':
                    let sales_by_users = []
                    for (let i = 0; i < sales.length; i++) {
                        let addItem = true
                        for (let j = 0; j < sales_by_users.length; j++) {
                            if (sales_by_users[j].user._id === sales[i].user._id.toString()) {
                                sales_by_users[j].total += sales[i].total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_users.push({ user: sales[i].user, total: sales[i].total})
                    }
                    data = [...sales_by_users]
                    break
                // Calculate sales by orders
                case 'orders':
                    let sales_by_orders = []
                    for (let i = 0; i < sales.length; i++) {
                        let addItem = true
                        for (let j = 0; j < sales_by_orders.length; j++) {
                            if (sales_by_orders[j].order._id === sales[i].order._id.toString()) {
                                sales_by_orders[j].total += sales[i].total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_orders.push({ order: sales[i].order, total: sales[i].total})
                    }
                    data = [...sales_by_orders]
                // Calculate sales by payments
                case 'payments':
                    let sales_by_payments = []
                    for (let i = 0; i < sales.length; i++) {
                        let addItem = true
                        for (let j = 0; j < sales_by_payments.length; j++) {
                            if (sales_by_payments[j].payment === sales[i].payment) {
                                sales_by_payments[j].total += sales[i].total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_payments.push({ payment: sales[i].payment, total: sales[i].total })
                    }
                    data = [...sales_by_payments]
                    break
                // Calculate sales by tunnels
                case 'tunnels':
                    let sales_by_tunnels = []
                    for (let i = 0; i < sales.length; i++) {
                        let addItem = true
                        for (let j = 0; j < sales_by_tunnels.length; j++) {
                            if (sales_by_tunnels[j].tunnel === sales[i].tunnel) {
                                sales_by_tunnels[j].total += sales[i].total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_tunnels.push({ tunnel: sales[i].tunnel, total: sales[i].total })
                    }
                    data = [...sales_by_tunnels]
                    break
                // Calculate sales by customers
                case 'customers':
                    let sales_by_customers = []
                    for (let i = 0; i < sales.length; i++) {
                        let addItem = true
                        for (let j = 0; j < sales_by_customers.length; j++) {
                            if (sales_by_customers[j].customer._id === sales[i].customer._id) {
                                sales_by_customers[j].total += sales[i].total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_customers.push({ customer: sales[i].customer, total: sales[i].total})
                    }
                    data = [...sales_by_customers]
                    break
                // Calculate sales by status
                case 'status':
                    let sales_by_status = []
                    for (let i = 0; i < sales.length; i++) {
                        let addItem = true
                        for (let j = 0; j < sales_by_status.length; j++) {
                            if (sales_by_status[j].status === sales[i].status) {
                                sales_by_status[j].total += sales[i].total
                                addItem = false
                                break
                            }
                        }
                        if (addItem) sales_by_status.push({ status: sales[i].status, total: sales[i].total})
                    }
                    data = [...sales_by_status]
                    break
                // Calculate sales by products
                case 'products':
                    let sales_by_products = []
                    for (let i = 0; i < sales.length; i++) {
                        const sale_items = await Promise.all(sales[i].items.map(async (item) => {
                            const product = await Product.findOne({ tenant, _id: item.product.toString() }).select('name')
                            return { product: product.name, quantity: item.quantity, total: item.total, gross_profit: item.total - item.supplyPrice, profit_margin: (item.total - item.supplyPrice) * 100 / item.supplyPrice }
                        }))
                        sale_items.forEach(item => {
                            let addItem = true
                            for (let j = 0; j < sales_by_products.length; j++) {
                                if (sales_by_products[j].product === item.product) {
                                    sales_by_products[j].profit_margin = (sales_by_products[j].profit_margin * sales_by_products[j].quantity + item.profit_margin * item.quantity) / (sales_by_products[j].quantity + item.quantity)
                                    sales_by_products[j].quantity += item.quantity
                                    sales_by_products[j].total += item.total
                                    sales_by_products[j].gross_profit += item.gross_profit
                                    addItem = false
                                    break
                                }
                            }
                            if (addItem) sales_by_products.push({ product: item.product, quantity: item.quantity, total: item.total, gross_profit: item.gross_profit, profit_margin: item.profit_margin })
                        })
                    }
                    data = [...sales_by_products]
                    break
                // Calculate sales by categories
                case 'categories':
                    let sales_by_categories = []
                    for (let i = 0; i < sales.length; i++) {
                        const sale_items = await Promise.all(sales[i].items.map(async (item) => {
                            const product = await Product.findOne({ tenant, _id: item.product.toString() }).select('product_type').populate('product_type')
                            return { category: product.product_type.name, total: item.total }
                        }))
                        sale_items.forEach(item => {
                            let addItem = true
                            for (let j = 0; j < sales_by_categories.length; j++) {
                                if (sales_by_categories[j].category === item.category) {
                                    sales_by_categories[j].total += item.total
                                    addItem = false
                                    break
                                }
                            }
                            if (addItem) sales_by_categories.push({ category: item.category, total: item.total})
                        })
                    }
                    data = [...sales_by_categories]
                    break
                // Calculate sales by brands
                case 'brands':
                    let sales_by_brands = []
                    for (let i = 0; i < sales.length; i++) {
                        const sale_items = await Promise.all(sales[i].items.map(async (item) => {
                            const product = await Product.findOne({ tenant, _id: item.product.toString() }).select('brand').populate('brand')
                            return { brand: product.brand.name, total: item.total }
                        }))
                        sale_items.forEach(item => {
                            let addItem = true
                            for (let j = 0; j < sales_by_brands.length; j++) {
                                if (sales_by_brands[j].brand === item.brand) {
                                    sales_by_brands[j].total += item.total
                                    addItem = false
                                    break
                                }
                            }
                            if (addItem) sales_by_brands.push({ brand: item.brand, total: item.total})
                        })
                    }
                    data = [...sales_by_brands]
                    break
                default:
                    break
            }
            // Return the result
            return { status: 200, details: { sales_to_report, start_date, end_date, data } }

            /*
            // Initialise arrays of sales by
            // ... branches
            let sales_by_branches = []
            // ... users
            let sales_by_users = []
            // ... orders
            let sales_by_orders = []
            // ... payments
            let sales_by_payments = []
            // ... tunnels
            let sales_by_tunnels = []
            // ... customers
            let sales_by_customers = []
            // ... status
            let sales_by_status = []
            // ... products
            let sales_by_products = []
            // ... categories
            let sales_by_categories = []
            // Loop through sales
            for (let i = 0; i < sales.length; i++) {
                // Calculate sales by branches
                let addItem = true
                for (let j = 0; j < sales_by_branches.length; j++) {
                    if (sales_by_branches[j].branch._id === sales[i].branch._id.toString()) {
                        sales_by_branches[j].total += sales[i].total
                        addItem = false
                        break
                    }
                }
                if (addItem) sales_by_branches.push({ branch: sales[i].branch, total: sales[i].total })
                // Calculate sales by users
                addItem = true
                for (let j = 0; j < sales_by_users.length; j++) {
                    if (sales_by_users[j].user._id === sales[i].user._id.toString()) {
                        sales_by_users[j].total += sales[i].total
                        addItem = false
                        break
                    }
                }
                if (addItem) sales_by_users.push({ user: sales[i].user, total: sales[i].total})
                // Calculate sales by orders
                addItem = true
                for (let j = 0; j < sales_by_orders.length; j++) {
                    if (sales_by_orders[j].order._id === sales[i].order._id.toString()) {
                        sales_by_orders[j].total += sales[i].total
                        addItem = false
                        break
                    }
                }
                if (addItem) sales_by_orders.push({ order: sales[i].order, total: sales[i].total})
                // Calculate sales by payments
                addItem = true
                for (let j = 0; j < sales_by_payments.length; j++) {
                    if (sales_by_payments[j].payment === sales[i].payment) {
                        sales_by_payments[j].total += sales[i].total
                        addItem = false
                        break
                    }
                }
                if (addItem) sales_by_payments.push({ payment: sales[i].payment, total: sales[i].total })
                // Calculate sales by tunnels
                addItem = true
                for (let j = 0; j < sales_by_tunnels.length; j++) {
                    if (sales_by_tunnels[j].tunnel === sales[i].tunnel) {
                        sales_by_tunnels[j].total += sales[i].total
                        addItem = false
                        break
                    }
                }
                if (addItem) sales_by_tunnels.push({ tunnel: sales[i].tunnel, total: sales[i].total })
                // Calculate sales by customers
                addItem = true
                for (let j = 0; j < sales_by_customers.length; j++) {
                    if (sales_by_customers[j].customer._id === sales[i].customer._id) {
                        sales_by_customers[j].total += sales[i].total
                        addItem = false
                        break
                    }
                }
                if (addItem) sales_by_customers.push({ customer: sales[i].customer, total: sales[i].total})
                // Calculate sales by status
                addItem = true
                for (let j = 0; j < sales_by_status.length; j++) {
                    if (sales_by_status[j].status === sales[i].status) {
                        sales_by_status[j].total += sales[i].total
                        addItem = false
                        break
                    }
                }
                if (addItem) sales_by_status.push({ status: sales[i].status, total: sales[i].total})
                // Map sale items then loop through it
                const sale_items = await Promise.all(sales[i].items.map(async (item) => {
                    const product = await Product.findOne({ tenant, _id: item.product.toString() }).select('_id name product_type').populate('product_type')
                    return { product: product.name, category: product.product_type.name, total: item.total }
                }))
                sale_items.forEach(item => {
                    // Calculate sales by products
                    addItem = true
                    for (let j = 0; j < sales_by_products.length; j++) {
                        if (sales_by_products[j].product === item.product) {
                            sales_by_products[j].total += item.total
                            addItem = false
                            break
                        }
                    }
                    if (addItem) sales_by_products.push({ product: item.product, total: item.total })
                    // Calculate sales by categories
                    addItem = true
                    for (let j = 0; j < sales_by_categories.length; j++) {
                        if (sales_by_categories[j].category === item.category) {
                            sales_by_categories[j].total += item.total
                            addItem = false
                            break
                        }
                    }
                    if (addItem) sales_by_categories.push({ category: item.category, total: item.total})
                })
            }
            // Return the result
            return { status: 200, details: { sales_by_branches: sales_by_branches, sales_by_users: sales_by_users, sales_by_orders: sales_by_orders, sales_by_payments: sales_by_payments, sales_by_tunnels: sales_by_tunnels, sales_by_customers: sales_by_customers, sales_by_products: sales_by_products, sales_by_categories: sales_by_categories } }
            */
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    
    // Report stocks
    async reportStocks (tenant, stocks_report_type) {
        try {
            if (!['inventory_on_hand','critic_inventory'].includes(stocks_report_type)) return { status: 400, details: { code: 'wrong_input', message: 'The stocks-report-type input is not correct' } }
            const products = await Product.findOne({ tenant }) 
            let stocks_details = []
            if (stocks_report_type === 'inventory_on_hand') {
                const sales = (await Sale.find({ tenant })).sort((sale_one, sale_two) => sale_one.date - sale_two.date)
                for (let i = 0; i < products.length; i++) {
                    for (let j = 0; j < products[i].branches.length; j++) {
                        const branch = await Branch.findOne({ tenant, _id: products[i].branches[j].toString() }).select('_id name')
                        const branch_sales = sales.filter(sale => sale.branch.toString() === products[i].branches[j].branch.toString())
                        // Calculate duration in month (with 30 days)
                        const start = new Date(branch_sales[0].date).getTime()
                        const end = Date.now()
                        const duration = (end - start) / 30 * 24 * 60 * 60 * 1000
                        // Calculate quantity of sold products
                        for (let k = 0; k < branch_sales.items.length; k++) {
                            if (branch_sales.items[k].product.toString() === products[i]._id) {
                                quantity_sold += branch_sales.items[k].quantity
                                break
                            }
                        }
                        stocks_details.push({ product: { id: products[i]._id, name: products[i].name }, branch: { id: branch._id, name: branch.name }, stock_count: products[i].branches[j].stock_count, alarm_count: products[i].branches[j].alarm_count, stock_cost: products[i].branches[j].stock_cost, average_sales: quantity_sold / duration })
                    }
                }
                const total_stock_count = stocks_details.reduce((total, {stock_count}) => total + stock_count)
                const total_stock_alarm = stocks_details.reduce((total, {stock_alarm}) => total + stock_alarm)
                const total_stock_cost = stocks_details.reduce((total, {stock_cost}) => total + stock_cost)
                const total_average_sales = stocks_details.reduce((total, {average_sales}) => total + average_sales)
                return { status: 200, details: { stocks_details, total_stock_count, total_stock_alarm, total_stock_cost, total_average_sales }}
            }
            else if (stocks_report_type === 'critic_inventory') {
                for (let i = 0; i < products.length; i++) {
                    for (let j = 0; j < products[i].branches.length; j++) {
                        if (products[i].branches[j].stock_count <= products[i].branches[j].stock_alarm) {
                            const branch = await Branch.findOne({ tenant, _id: products[i].branches[j].toString() }).select('_id name')
                            stocks_details.push({ product: { id: products[i]._id, name: products[i].name }, branch: { id: branch._id, name: branch.name }, stock_count: products[i].branches[j].stock_count, alarm_count: products[i].branches[j].alarm_count })
                            break
                        }
                    }
                }
                return { status: 200, details: stocks_details }
            }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }
    /*
    // Report stocks
    async reportStocks (tenant) {
        try {
            const products = await Product.findOne({ tenant })
            const sales = (await Sale.find({ tenant })).sort((sale_one, sale_two) => sale_one.date - sale_two.date) 
            let stocks_details = []
            for (let i = 0; i < products.length; i++) {
                for (let j = 0; j < products[i].branches.length; j++) {
                    const branch = await Branch.findOne({ tenant, _id: products[i].branches[j].toString() }).select('_id name')
                    const branch_sales = sales.filter(sale => sale.branch.toString() === products[i].branches[j].branch.toString())
                    // Calculate duration in month (with 30 days)
                    const start = new Date(branch_sales[0].date).getTime()
                    const end = Date.now()
                    const duration = (end - start) / 30 * 24 * 60 * 60 * 1000
                    // Calculate quantity of sold products
                    for (let k = 0; k < branch_sales.items.length; k++) {
                        if (branch_sales.items[k].product.toString() === products[i]._id) {
                            quantity_sold += branch_sales.items[k].quantity
                            break
                        }
                    }
                    stocks_details.push({ product: { id: products[i]._id, name: products[i].name }, branch: { id: branch._id, name: branch.name }, stock_count: products[i].branches[j].stock_count, alarm_count: products[i].branches[j].alarm_count, stock_cost: products[i].branches[j].stock_cost, average_sales: quantity_sold / duration })
                }
            }
            const total_stock_count = stocks_details.reduce((total, {stock_count}) => total + stock_count)
            const total_stock_alarm = stocks_details.reduce((total, {stock_alarm}) => total + stock_alarm)
            const total_stock_cost = stocks_details.reduce((total, {stock_cost}) => total + stock_cost)
            const total_average_sales = stocks_details.reduce((total, {average_sales}) => total + average_sales)
            return { status: 200, details: { stocks_details, total_stock_count, total_stock_alarm, total_stock_cost, total_average_sales }}
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }
    
    // Report stocks
    async reportStocks (tenant) {
        try {
            const products = await Product.findOne({ tenant })
            let stocks_details = []
            for (let i = 0; i < products.length; i++) {
                for (let j = 0; j < products[i].branches.length; j++) {
                    const branch = await Branch.findOne({ tenant, _id: products[i].branches[j].toString() }).select('_id name')
                    stocks_details.push({ product: { id: products[i]._id, name: products[i].name }, branch: { id: branch._id, name: branch.name }, stock_count: products[i].branches[j].stock_count, alarm_count: products[i].branches[j].alarm_count, stock_cost: products[i].branches[j].stock_cost })
                }
            }
            const total_stock_count = stocks_details.reduce((total, {stock_count}) => total + stock_count)
            const total_stock_alarm = stocks_details.reduce((total, {stock_alarm}) => total + stock_alarm)
            const total_stock_cost = stocks_details.reduce((total, {stock_cost}) => total + stock_cost)
            return { status: 200, details: { stocks_details, total_stock_count, total_stock_alarm, total_stock_cost }}
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }
    */
}
