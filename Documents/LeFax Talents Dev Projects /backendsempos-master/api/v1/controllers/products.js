const Product = require('../models/product')
const Product_type = require('../models/product_type')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty } = require('../utils/inputUtils')
const { emailVerification } = require('../utils/emailUtils')
const {  isObjectIDValid } = require('../utils/inputUtils')
const responses = require('../responses/products')

module.exports = {
    
    // Create a new product
    async addProduct (tenant, user, name,brand, description, color,tags,product_type,images,type_of_product,isInventorytracked,sku,suppliers_informations,products,branches,tax,supply_price,retail_price,variants) {
        try {
           
            if (await Product.findOne({ name,tenant })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used for another product'}}
            const product = await Product.create({  tenant,name,brand, description, color,tags,product_type,images,type_of_product,isInventorytracked,sku,suppliers_informations,products,branches,tax,supply_price,retail_price,variants })
           
            const cat = await Product_type.findOne({ _id : product_type }) 

            cat.products.push(product._id);
            await cat.save()
            await logControllers.addLog(tenant, user, 'create', 'product', product)
            return { status: 201, details: { id: product._id  }}
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get product by id
 /*    async getproductById (db, id) {
        try {
            const Product = models.tenantDbConnection(db).product
            const product = await Product.findById(id).populate('productes')
            if (!product) return errors.error404
            return { status: 200, details: getproduct(product)}
        } 
        catch (error) {
            console.error(error)
        }
    }, */
    
    // Get products
    async getProducts (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const products = await Product.find({ tenant }).populate('branches').populate({ path: 'product_type', select: 'name' })
                const count = products.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: products } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const products = await Product.find({ tenant }).populate('branches').populate({ path: 'product_type', select: 'name' }).limit(limit).skip(offset)
                const count = products.length
                const total = await Product.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: products } }
            }
        } 
        catch (error) {
            console.error(error)   
        }
    },
    
    // Get most sold products
    async getMostSoldProducts (tenant) {
        try {
            const sales = await Sale.find({ tenant })
            let products = []
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    let addItem = true
                    for (let i = 0; i < products.length; i++) {
                        if (products[i].product === item.product.toString()) {
                            products[i].quantity += item.quantity
                            products[i].total += item.total
                            addItem = false
                            break
                        }
                    }
                    if (addItem) products.push({ product: item.product.toString(), quantity: item.quantity, total: item.total })
                })
            })
            products.sort((productOne, productTwo) => productTwo.total - productOne.total)
            products = products.slice(0, 10)
            products = await Promise.all(products.map(async (product) => {
                const id = product['product']
                const pdt = await Product.findOne({ tenant, _id: id }).select('name branches').populate('branches')
                return { product: pdt, quantity: product.quantity, total: product.total }
            }))
            return { status: 200 , details: products }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },

       // Get product by id
       async getProductById (tenant, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' }}
            const product = await Product.findOne({ tenant, _id: id }).populate('product_type')
            if (!product) return errors.error404
            return { status: 200, details: product }
        } 
        catch (error) {
           console.error(error)
           return error
        }
    },
    // Update a product
     async updateProduct (tenant, id,qte,qtemin,pachat,pvente,name) {
        try {
            const product = await Product.findOne({ tenant, _id: id })
         
         /*  
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
            
            */
            product.branches[0].stock_count = qte;
            product.branches[0].alarm_count = qtemin;
            product.retail_price = pvente;
             product.name = name;
            product.supply_price = pachat;
            await product.save()
            return { status: 200, details: product }
        } 
        catch (error) {
            console.error(error)
        }
    },
    
    // Delete a product
   async deleteProduct (tenant, id) {
        try {
          
            
           /* if (!product) return errors.error404
            if (product.isCoreproduct)  return { status: 400, details: { code: 'impossible_to_delete', message: 'Impossible to delete the core product' } }
            let coreproduct = await product.findOne({ isCoreproduct: true })
            const index = coreproduct.productes.indexOf(id)
            if (index > -1) coreproduct.productes.splice(index, 1)
            await coreproduct.save()*/
            
            
            await Product.findByIdAndDelete(id)
            if ((await this.getProductById(tenant, id)).status == 200) return errors.error500
            return { status: 200, details: { code: 'product_deleted', message: 'The product has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
        }
    },
    
    // Get products with parameters
    async getSearchedProducts (tenant, operation, fields) {
        try {
            if (operation === 'getInfos') {
                const populate = [
                    {
                        path: 'product_type',
                        select: 'name'
                    },
                    {
                        path: 'brand',
                        select: 'name'
                    },
                    {
                        path: 'suppliers_informations.supplier',
                        select: 'name'
                    },
                    {
                        path: 'branches.branch',
                        select: 'business_name'
                    }
                ]
                const products = await Product.find({ tenant }).populate(populate).lean()
                const _fields = fields.split(',').map(item => item.trim())
                const _products = []
                products.forEach(product => {
                    const branches = product.branches
                    const _product = {}
                    _product.name = product.name
                    _fields.forEach(field => {
                        switch (field) {
                            case 'description':
                                _product.description = (() => {
                                    if (product.description) return product.description
                                    return ''
                                })()
                                break
                            case 'category':
                                _product.category = (() => {
                                    if (product.product_type.name) return product.product_type.name
                                    return ''
                                })()
                                break
                            case 'brand':
                                _product.brand = (() => {
                                    if (product.brand.name) return product.brand.name
                                    return ''
                                })()
                                break
                            case 'supplier':
                                _product.supplier = (() => {
                                    if (product.suppliers_informations.supplier.name) return product.suppliers_informations.supplier.name
                                    return ''
                                })()
                                break
                            case 'sell-price':
                                _product.sell_price = (() => {
                                    const prices = {}
                                    branches.forEach(branch => {
                                        prices.push({
                                            branch: branch.branch.business_name,
                                            price: branch.sell_price
                                        })
                                    })
                                    return prices
                                })()
                                break
                            case 'purchase-price':
                                _product.supply_price = (() => {
                                    if (product.supply_price) return product.supply_price
                                    return ''
                                })()
                                break
                            case 'stock-quantity':
                                _product.stock_quantity = (() => {
                                    const stocks = {}
                                    branches.forEach(branch => {
                                        stocks.push({
                                            branch: branch.branch.business_name,
                                            stock: branch.stock_count
                                        })
                                    })
                                    return stocks
                                })()
                                break
                            case 'alarm-stock':
                                _product.alarm_stock = (() => {
                                    const stocks = {}
                                    branches.forEach(branch => {
                                        stocks.push({
                                            branch: branch.branch.business_name,
                                            stock: branch.alarm_count
                                        })
                                    })
                                    return stocks
                                })()
                                break
                            case 'inventory-tracked':
                                _product.inventory_tracked = (() => {
                                    if (typeof product.isInventorytracked !== 'undefined') return product.isInventorytracked
                                    return ''
                                })()
                                break
                            default:
                                break
                        }
                    })
                    _products.push(_product)
                })
                return responses.getInfosProductsForCatalog(_products)
            }
            else return responses.InvalidOperation
        }
        catch (error) {
            console.error(error)
            throw new Error(error)
        }
    }
}
