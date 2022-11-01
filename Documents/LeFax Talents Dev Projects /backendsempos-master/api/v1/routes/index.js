const router = require('express').Router()
const connectTenant = require('../middlewares/connectTenant')

router.use('/base/location', require('./location'))
router.use('/base/admins', require('./admins'))
router.use('/base/tenants', require('./tenants'))
router.use('/:tenant/branches', connectTenant, require('./branches'))
router.use('/:tenant/paymenttypes', connectTenant, require('./payment_types'))
router.use('/:tenant/tenants',connectTenant, require('./tenants'))
router.use('/:tenant/products', connectTenant, require('./products'))
router.use('/:tenant/producttypes', connectTenant, require('./producttypes'))

router.use('/:tenant/sales', connectTenant, require('./sales'))

router.use('/:tenant/customersgroups', connectTenant, require('./customers_groups'))
router.use('/:tenant/customers', connectTenant, require('./customers'))
// Staff
router.use('/:tenant/employees', connectTenant, require('./employees'))
router.use('/:tenant/roles', connectTenant, require('./roles'))

router.use('/:tenant/closures', connectTenant, require('./closures'))

router.use('/:tenant/reports', connectTenant, require('./reports'))

router.use('/:tenant/purchases', connectTenant, require('./purchases.js'))

router.use('/:tenant/vendors', connectTenant, require('./vendors'))

router.use('/:tenant/transfers', connectTenant, require('./transfers'))

router.use('/:tenant/transaction_categories', connectTenant, require('./transaction_categories'))

router.use('/:tenant/transactions', connectTenant, require('./transactions'))

router.use('/:tenant/tenants_logs', connectTenant, require('./tenants_logs'))

router.use('/:tenant/orders', connectTenant, require('./orders'))

module.exports = router
