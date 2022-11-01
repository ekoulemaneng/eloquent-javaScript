const Role = require('../models/role')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty, updateValue, isObjectIDValid, preventToCrushDataObject, resetAllProperties, stringToBool } = require('../utils/inputUtils')
const { presettedRoles } = require('../../../config')

const getRole = (role) => {
    return {
        id: role._id == undefined ? undefined : role._id.toString(),
        name: role.name,
        description: role.description,
        back_office: {
            allow_access_backoffice: role.back_office.allow_access_backoffice,
            product_permissions: {
                products_descriptions: role.back_office.product_permissions.products_descriptions,
                editing_products: role.back_office.product_permissions.editing_products,
                editing_definitions: role.back_office.product_permissions.editing_definitions,
                see_products_ingredients: role.back_office.product_permissions.see_products_ingredients
            },
            customer_permissions: {
                seeing_customers: role.back_office.customer_permissions.seeing_customers,
                editing_customers: role.back_office.customer_permissions.editing_customers,
            },
            inventory_permissions: {
                inventory_viewing_editing: role.back_office.inventory_permissions.inventory_viewing_editing,
                inventory_validation: role.back_office.inventory_permissions.inventory_validation
            },
            employee_permissions: {
                seeing_employees: role.back_office.employee_permissions.seeing_employees,
                editing_employees: role.back_office.employee_permissions.editing_employees
            },
            other_permissions: {
                view_reports: role.back_office.other_permissions.view_reports,
                setting_access: role.back_office.other_permissions.setting_access,
                update_payment_type: role.back_office.other_permissions.update_payment_type
            },
            marketplace_permissions: {
                viewing_orders: role.back_office.marketplace_permissions.viewing_orders,
                approval_orders: role.back_office.marketplace_permissions.approval_orders,
                authority_to_create_invoice: role.back_office.marketplace_permissions.authority_to_create_invoice,
                brand_category_product: role.back_office.marketplace_permissions.brand_category_product,
                viewing_editing_marketplace_settings: role.back_office.marketplace_permissions.viewing_editing_marketplace_settings
            }
        },
        point_of_sale: {
            allow_access_pos: role.point_of_sale.allow_access_pos,
            terminal_permissions: {
                view_terminal_status: role.point_of_sale.terminal_permissions.view_terminal_status,
                terminal_open_close: role.point_of_sale.terminal_permissions.terminal_open_close,
                see_sales_transactions: role.point_of_sale.terminal_permissions.see_sales_transactions,
                access_pos_settings: role.point_of_sale.terminal_permissions.access_pos_settings
            },
            sale_permissions: {
                refund: role.point_of_sale.sale_permissions.refund,
                cancellation_of_sales: role.point_of_sale.sale_permissions.cancellation_of_sales,
                update_payment_type: role.point_of_sale.sale_permissions.update_payment_type,
                update_custom_price: role.point_of_sale.sale_permissions.update_custom_price,
                park_deletion: role.point_of_sale.sale_permissions.park_deletion,
                basket_deletion: role.point_of_sale.sale_permissions.basket_deletion
            },
            product_permissions: {
                add_remove_favorite: role.point_of_sale.product_permissions.add_remove_favorite,
                allow_see_others_branches: role.point_of_sale.product_permissions.allow_see_others_branches
            },
            discount_rates: {
                product_discount_limit: role.point_of_sale.discount_rates.product_discount_limit,
                cart_discount_limit: role.point_of_sale.discount_rates.cart_discount_limit
            }
        }
    }
}

module.exports = {
    // Add a new role
    async addRole (tenant, user, name, description, back_office, point_of_sale) {
        try {
            if (await Role.findOne({ name }) || Object.keys(presettedRoles).includes(name)) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used by another role'}}
            if (stringToBool(back_office.allow_access_backoffice) === false || back_office.allow_access_backoffice === undefined) resetAllProperties(back_office)
            if (stringToBool(point_of_sale.allow_access_pos) === false || point_of_sale.allow_access_pos === undefined) resetAllProperties(point_of_sale)
            const role = await Role.create({ tenant, name, description, back_office, point_of_sale })
            await logControllers.addLog(tenant, user, 'create', 'role', role)
            return { status: 201, details: getRole(role) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a role by id
    async getRoleById (tenant, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id_format', message: 'The id format is not valid' } }
            const role = await Role.findById(id)
            if (!role) return errors.error404
            return { status: 200, details: getRole(role) }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Get a role by name
    async getRoleByName (tenant, name) {
        try {
            let role
            if (Object.keys(presettedRoles).slice(1).includes(name)) role = presettedRoles[name]
            else role = await Role.findOne({ name })
            if (!role) return errors.error404
            return { status: 200, details: getRole(role) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get all roles
    async getRoles (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const roles = await Role.find()
                const count = roles.length
                const data = [ ...Object.values(presettedRoles).slice(1), ...roles].map(role => getRole(role))
                const prevPage = null
                const nextPage = null
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: prevPage, nextPage, nextPage: nextPage, data: data } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const roles = await Role.find().limit(limit).skip(offset)
                const count = roles.length
                const total = await Role.countDocuments()
                const pages = Math.ceil(total/limit)
                const data = [ ...Object.values(presettedRoles).slice(1), ...roles].map(role => getRole(role))
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
    // Update a role
    async updateRole (tenant, user, id, name, description, back_office, point_of_sale) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id_format', message: 'The id format is not valid' } }
            let role = await Role.findOne({ tenant, _id: id })
            const origObj = JSON.parse(JSON.stringify(role))
            if (!role) return errors.error404
            if (isInputNotEmpty(name) && role.name !== name && await Role.findOne({ name })) return { status: 400, details: { code: 'name_already_used', message: 'This name is already used by another role'}}
            if (stringToBool(back_office.allow_access_backoffice) === true || back_office.allow_access_backoffice === undefined) preventToCrushDataObject(back_office, role.back_office)
            else resetAllProperties(back_office)
            if (stringToBool(point_of_sale.allow_access_pos) === true || point_of_sale.allow_access_pos === undefined) preventToCrushDataObject(point_of_sale, role.point_of_sale)
            else resetAllProperties(point_of_sale)
            await role.updateOne({ 
                $set: {
                    name: updateValue(name), 
                    description: updateValue(description), 
                    back_office: updateValue(back_office), 
                    point_of_sale: updateValue(point_of_sale)
                } 
            })
            role = await Role.findOne({ tenant, _id: id })
            const newObj = JSON.parse(JSON.stringify(role))
            await logControllers.addLog(tenant, user, 'update', 'role', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: getRole(role) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Delete a role
    async deleteRole (tenant, user, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id_format', message: 'The id format is not valid' } }
            const role = await Role.findOne({ tenant, _id: id })
            if (!role) return errors.error404
            await role.deleteOne()
            await logControllers.addLog(tenant, user, 'delete', 'role', undefined, undefined, role)
            return { status: 200, details: { code: 'role_successfully_deleted', message: 'The role has has been successfully deleted' }}
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
