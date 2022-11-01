const Product_type = require('../models/product_type')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty } = require('../utils/inputUtils')

module.exports = {
    
    // Create a new product
    async addProductType (tenant, user, name, description) {
        try {
            if (await Product_type.findOne({ name,tenant })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used for another product type'}}
            const productType = await Product_type.create({ tenant,name, description })
            await logControllers.addLog(tenant, user, 'create', 'product_type', productType)
            return { status: 201, details: { id: productType._id  }}
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
 
    // Get product type by id
    async getProductTypeById (tenant, id) {
        try {
            const product_type = await Product_type.findOne({ tenant, _id: id })
            if (!product_type) return errors.error404
            return { status: 200, details: product_type }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

  
    // Get products
    async getProductTypes (tenant, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit
            const products_type = await Product_type.find({ tenant }).limit(limit).skip(offset)
            const count = products_type.length
            const total = await Product_type.countDocuments()
            const pages = Math.ceil(total/limit)
            const data = products_type.map(product_type => product_type)
            const prevPage = page > 1 ? page - 1 : null
            const nextPage = page < pages ? page + 1 : null
            return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data } }
        } 
        catch (error) {
            console.error(error)   
        }
    },


    async getProductTypesWithProd (tenant, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit
            const products_type = await Product_type.find({ tenant }).populate('products').limit(limit).skip(offset)
            const count = products_type.length
            const total = await Product_type.countDocuments()
            const pages = Math.ceil(total/limit)
            const data = products_type.map(product_type => product_type)
            const prevPage = page > 1 ? page - 1 : null
            const nextPage = page < pages ? page + 1 : null
            return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data } }
        } 
        catch (error) {
            console.error(error)   
        }
    }

    // Update a product
/*     async updateproduct (db, id, business_name, business_type, email, phone, address, town, NIU, RCCM, modules) {
        try {
            const product = models.tenantDbConnection(db).product
            if (isInputNotEmpty(business_name) && (await this.getproductByName(db, business_name)).status == 200) return { status: 400, details: { code: 'business_name_already_used', message: 'This business name is already for another product' } }
            if (isInputNotEmpty(email) && (await this.getproductByEmail(db, email)).status != 200 && !(await emailVerification(email))) return { status: 400, details: { code: 'email_not_exists', message: 'This email doesn\'t exist' }}
            let product = await product.findById(id).populate('productes')
            if (!product) return errors.error404
            if (isInputNotEmpty(business_name)) product.business_name = business_name
            if (isInputNotEmpty(business_type)) product.business_type = business_type
            if (isInputNotEmpty(email)) product.email = email
            if (isInputNotEmpty(phone)) product.phone = phone
            if (isInputNotEmpty(address)) product.address = address
            if (isInputNotEmpty(town)) product.town = town
            if (isInputNotEmpty(NIU)) product.NIU = NIU
            if (isInputNotEmpty(RCCM)) product.RCCM = RCCM
            if (modules.length !== 0) {
                let arr = []
                arr.forEach(module => {
                    if (['treasury', 'products', 'marketing', 'services', 'payroll', 'orders', 'reservations', 'billing'].includes(module) && !product.modules.includes(module) && !arr.includes(module)) arr.push(module)
                })
                product.modules = arr
            }
            await product.save()
            return { status: 200, details: getproduct(product) }
        } 
        catch (error) {
            console.error(error)
        }
    }, */
    // Delete a product
/*     async deleteproduct (db, id) {
        try {
            const product = models.tenantDbConnection(db).product
            const product = await product.findById(id)
            if (!product) return errors.error404
            if (product.isCoreproduct)  return { status: 400, details: { code: 'impossible_to_delete', message: 'Impossible to delete the core product' } }
            let coreproduct = await product.findOne({ isCoreproduct: true })
            const index = coreproduct.productes.indexOf(id)
            if (index > -1) coreproduct.productes.splice(index, 1)
            await coreproduct.save()
            await product.findByIdAndDelete(id)
            if ((await this.getproductById(db, id)).status == 200) return errors.error500
            return { status: 200, details: { code: 'product_deleted', message: 'The product has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
        }
    } */
}
