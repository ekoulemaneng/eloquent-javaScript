const mongoose = require('mongoose')
const { mainDbName, mongodbCluster, mongodbClusterUser, mongodbClusterPassword } = require('../../../config')

module.exports = {
    mainDbConnection: () => {
        try {
            const conn = mongoose.createConnection(`mongodb+srv://${mongodbClusterUser}:${mongodbClusterPassword}@${mongodbCluster}/${mainDbName}?retryWrites=true&w=majority`)
            return {
                admin: conn.model('Admin', require('./adminSchema')),
                tenant: conn.model('Tenant', require('./tenantSchema'))
            }
        } catch (error) {
            console.error(error)
            return error
        }
    },
    tenantDbConnection: (dbname) => {
        try {
            const conn = mongoose.createConnection(`mongodb+srv://${mongodbClusterUser}:${mongodbClusterPassword}@${mongodbCluster}/${dbname}?retryWrites=true&w=majority`)
            return {
                // Setup
                branch: conn.model('Branch', require('./branchSchema')),
                register: conn.model('Register', require('./registerSchema')),
                payment_type: conn.model('PaymentType', require('./paymentTypeSchema')),
                // Staff
                employee: conn.model('Employee', require('./employeeSchema')),
                role: conn.model('Role', require('./roleSchema')),
                // Catalog
                product: conn.model('Product', require('./productSchema')),
                promotion: conn.model('Promotion', require('./promotionSchema')),
                price_book: conn.model('PriceBook', require('./priceBookSchema')),
                brand: conn.model('Brand', require('./brandSchema')),
                supplier: conn.model('Supplier', require('./supplierSchema')),
                product_tag: conn.model('ProductTag', require('./productTagSchema')),
                product_type: conn.model('ProductType', require('./productTypeSchema')),
                product_image: conn.model('ProductImage', require('./productImageSchema')),
                variant_attributes: conn.model('VariantAttribute', require('./variantAttributeSchema')),
                // Customers
                customer: conn.model('Customer', require('./customerSchema')),
                customers_group: conn.model('CustomersGroup', require('./customersGroupSchema')),
                // Inventory
                ordered_stock: conn.model('OrderedStock', require('./orderedStockSchema')),
                received_stock: conn.model('ReceivedStock', require('./receivedStockSchema')),
                returned_stock: conn.model('ReturnedStock', require('./returnedStockSchema')),
                transfered_stock: conn.model('TransferedStock', require('./transferedStockSchema')),
                inventory_count: conn.model('InventoryCount', require('./inventoryCountSchema')),
                fulfillment: conn.model('Fulfillment', require('./fulfillmentSchema')),
                serial_number: conn.model('SerialNumber', require('./serialNumberSchema')),
                // Reporting
                register_closures: conn.model('RegisterClosures', require('./registerClosuresSchema')),
                // Sell
                sale: conn.model('Sale', require('./saleSchema'))
            }
        } catch (error) {
            console.error(error)
            return error
        }
    }
}
