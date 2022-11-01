const router = require('express').Router()
const controllers = require('../controllers/reports')
const { tenantUserAuth } = require('../middlewares/userAuth')

// Get sales reports
router.get('/sales', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { sales_to_report ,start_date, end_date } = req.query
        const response = await controllers.reportSales(tenant, sales_to_report, start_date, end_date)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

// Get stocks reports
router.get('/stocks', tenantUserAuth(), async (req, res) => {
    try {
        const tenant = req.tenant
        const { stocks_report_type } = req.query
        const response = await controllers.reportStocks(tenant, stocks_report_type)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(500).send({ message: error })    
    }
})

module.exports = router
