const mongoose = require("mongoose")

const roleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        description: String,
        back_office: {
            allow_access_backoffice: { type: Boolean, default: false, required: true },
            product_permissions: {
                products_descriptions: { type: Boolean, default: false, required: true },
                editing_products: { type: Boolean, default: false, required: true },
                editing_definitions: { type: Boolean, default: false, required: true },
                see_products_ingredients: { type: Boolean, default: false, required: true }
            },
            customer_permissions: {
                seeing_customers: { type: Boolean, default: false, required: true },
                editing_customers: { type: Boolean, default: false, required: true }
            },
            inventory_permissions: {
                inventory_viewing_editing: { type: Boolean, default: false, required: true },
                inventory_validation: { type: Boolean, default: false, required: true }
            },
            employee_permissions: {
                seeing_employees: { type: Boolean, default: false, required: true },
                editing_employees: { type: Boolean, default: false, required: true }
            },
            other_permissions: {
                view_reports: { type: Boolean, default: false, required: true },
                setting_access: { type: Boolean, default: false, required: true },
                update_payment_type: { type: Boolean, default: false, required: true }
            },
            marketplace_permissions: {
                viewing_orders: { type: Boolean, default: false, required: true },
                approval_orders: { type: Boolean, default: false, required: true },
                authority_to_create_invoice: { type: Boolean, default: false, required: true },
                brand_category_product: { type: Boolean, default: false, required: true },
                viewing_editing_marketplace_settings: { type: Boolean, default: false, required: true }
            }
        },
        point_of_sale: {
            allow_access_pos: { type: Boolean, default: false, required: true },
            terminal_permissions: {
                view_terminal_status: { type: Boolean, default: false, required: true },
                terminal_open_close: { type: Boolean, default: false, required: true },
                see_sales_transactions: { type: Boolean, default: false, required: true },
                access_pos_settings: { type: Boolean, default: false, required: true }
            },
            sale_permissions: {
                refund: { type: Boolean, default: false, required: true },
                cancellation_of_sales: { type: Boolean, default: false, required: true },
                update_payment_type: { type: Boolean, default: false, required: true },
                update_custom_price: { type: Boolean, default: false, required: true },
                park_deletion: { type: Boolean, default: false, required: true },
                basket_deletion: { type: Boolean, default: false, required: true }
            },
            product_permissions: {
                add_remove_favorite: { type: Boolean, default: false, required: true },
                allow_see_others_branches: { type: Boolean, default: false, required: true }
            },
            discount_rates: {
                product_discount_limit: { type: Number, default: 0, required: true },
                cart_discount_limit: { type: Number, default: 0, required: true }
            }
        }
    },
    {
        timestamps: true
    }
)

module.exports = roleSchema