const router = require('express').Router()
const controllers = require('../controllers/products')
const { tenantUserAuth } = require('../middlewares/userAuth')
const { stringToBool } = require('../utils/inputUtils')
const errors = require('../utils/standardErrors')

// Create a new product
router.post('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const user = req.user.id
        const subdomain = req.subdomain
        const {  name,brand, description, color,tags,product_type,images,type_of_product,isInventorytracked,sku,suppliers_informations,products,branches,tax,supply_price,retail_price,variants } = req.body
        const response = await controllers.addProduct(tenant, user, name,brand, description, color,tags,product_type,images,type_of_product,isInventorytracked,sku,suppliers_informations,products,branches,tax,supply_price,retail_price,variants)
        if (response.status != 201) {
            res.status(response.status).send(response.details)
            return
        }
        res.status(response.status).send({ id: response.details.id, url: `https://api.onebaz.com/v1/${subdomain}/paymenttypes/${response.details.id}` })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})




// Get all productes
router.get('/', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { page, limit } = req.query
        const subdomain = req.subdomain
        const response = await controllers.getProducts(tenant, page, limit)
        const prevPage = response.details.prevPage !== null ? `https://api.onebaz.com/v1/${subdomain}/products?page=${response.details.prevPage}&limit=${limit}` : null
        const nextPage = response.details.nextPage !== null ? `https://api.onebaz.com/v1/${subdomain}/products?page=${response.details.nextPage}&limit=${limit}` : null
        res.status(response.status).send({ 
            total: response.details.total,
            count: response.details.count,
            currentPage: response.details.currentPage,
            pages: response.details.pages,
            prev: prevPage, 
            next: nextPage,
            data: response.details.data
        })
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
})

// Get products with parameters
router.get('/search', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { operation, fields } = req.query
        const response = await controllers.getSearchedProducts(tenant, operation, fields)
        res.status(response.status).send(response.details)
    }
    catch (error) {
        console.error(error)
        res.status(500).send({ code: 'ServerError', message: error.message })
    }
})

// Get the 10-most-sold products
router.get('/most-sold-products', async (req, res) => {
    try {
        const tenant = req.tenant
        const response = await controllers.getMostSoldProducts(tenant)
        res.status(response.status).send(response.details)
    } 
    catch (error) {

    }
})




// Get product by id
 router.get('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const id = req.params.id
        const response = await controllers.getProductById(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
}) 
// Update core product modules and set catalog visibility
/* router.patch('/', tenantUserAuth('owner', 'admin'), async (req, res) => {
    try {
        const db = req.db
        const id = req.user.id
        let { modules, isCatalogOnline } = req.body
        isCatalogOnline = stringToBool(isCatalogOnline)
        const responseGetCoreproduct = await controllers.getCoreproduct(db)
        if (responseGetCoreproduct.status != 200) {
            res.status(responseGetCoreproduct.status).send(responseGetCoreproduct.details)
            return
        }
        const responseUpdateproduct = await controllers.updateproduct(db, responseGetCoreproduct.details.id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, modules)
        if (responseUpdateproduct.status != 200) {
            res.status(responseUpdateproduct.status).send(responseUpdateproduct.details)
            return
        }

   } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
}) */
// Update product quantity
 router.patch('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const id = req.params.id
        const { qte,qtemin,pachat,pvente,name } = req.body
        const responseGetproduct = await controllers.getProductById(tenant, id)
        if (responseGetproduct.status != 200) {
            res.status(responseGetproduct.status).send(responseGetproduct.details)
            return
        }
     /*   if (responseGetproduct.details.isCoreproduct) {
            res.status(errors.error403.status).send(errors.error403.details)
            return
        }*/
        const responseUpdateproduct = await controllers.updateProduct(tenant, id, qte,qtemin,pachat,pvente,name)
        res.status(responseUpdateproduct.status).send(responseUpdateproduct.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
}) 
// Delete product
 router.delete('/:id', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const id = req.params.id
        const response = await controllers.deleteProduct(tenant, id)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })
    }
}) 

module.exports = router
