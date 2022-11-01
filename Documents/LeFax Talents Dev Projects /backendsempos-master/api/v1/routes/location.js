const router = require('express').Router()
const controllers  = require('../controllers/location')
const errors = require('../utils/standardErrors')

router.get('/', async (req, res) => {
    try {
        const { ip } = req.query
        const response = await controllers.getLocation(ip)
        res.status(response.status).send(response.details)
    } 
    catch (error) {
        console.error(error)
        res.status(errors.error500.status).send(errors.error500.details)
    }
})

module.exports = router