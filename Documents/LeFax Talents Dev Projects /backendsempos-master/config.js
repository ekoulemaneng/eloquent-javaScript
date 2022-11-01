require("dotenv").config()
const mongoose = require("mongoose")

module.exports = {
    // Host settings
    port: 3000,
    // Database settings
    mainDbName: 'admin_db',
    //mongodbCluster: process.env.MONGODB_CLUSTER,
    //mongodbClusterUser: process.env.MONGODB_CLUSTER_USER,
    //mongodbClusterPassword: process.env.MONGODB_CLUSTER_PASSWORD,
    connectMongoDB: async () => {
        await mongoose.connect(`mongodb+srv://${process.env.MONGODB_CLUSTER_USER}:${process.env.MONGODB_CLUSTER_PASSWORD}@${process.env.MONGODB_CLUSTER}/onebazdb`, err => {
            if (err) throw err
            console.log('Successfully connected to database.')
        })
    },
    // Secret keys settings
    secretPassKey: process.env.PASS_SEC,
    secretJWTKey: process.env.JWT_SEC,
    jwtExpirationDelay: '24h',
    // Access token settings
    accessTokenValidityPeriod: 365 * 24 * 60 * 60 * 1000, // for 24 hours
    // Reset token settings
    resetTokenValidityPeriod: 6 * 60 * 60 * 1000, // for 6 hours
    // Email sending settings
    mailSenderHost: process.env.MAIL_SENDER_HOST,
    mailSenderPort: parseInt(process.env.MAIL_SENDER_PORT),
    mailSenderSecure: (() => process.env.MAIL_SENDER_SECURE === 'true')(),
    senderEmailAccount: process.env.SENDER_EMAIL_ACCOUNT,
    senderEmailPassword: process.env.SENDER_EMAIL_PASSWORD,
    // Prohibited sub-domains
    forbiddenSubDomains: ['admin', 'api', 'www', 'app', 'onebaz', 'base'],
    // Default number of digits for unique code
    numberOfDigitsForUniqueCode: 10,
    // ------ Roles settings -------- 
    // Array of roles presetted
    presettedRoles: {
        'Account Owner': {},
        'Manager': {
            name: 'Manager',
            description: 'Gestion complète du business',
            back_office: {
                allow_access_backoffice: true,
                product_permissions: {
                    products_descriptions: true,
                    editing_products: true,
                    editing_definitions: true,
                    see_products_ingredients: true 
                },
                customer_permissions: {
                    seeing_customers: true,
                    editing_customers: true,
                },
                inventory_permissions: {
                    inventory_viewing_editing: true,
                    inventory_validation: true
                },
                employee_permissions: {
                    seeing_employees: true,
                    editing_employees: true
                },
                other_permissions: {
                    view_reports: true,
                    setting_access: true,
                    update_payment_type: true
                },
                marketplace_permissions: {
                    viewing_orders: true,
                    approval_orders: true,
                    authority_to_create_invoice: true,
                    brand_category_product: true,
                    viewing_editing_marketplace_settings: true
                }
            },
            point_of_sale: {
                allow_access_pos: true,
                terminal_permissions: {
                    view_terminal_status: true,
                    terminal_open_close: true,
                    see_sales_transactions: true,
                    access_pos_settings: true
                },
                sale_permissions: {
                    refund: true,
                    cancellation_of_sales: true,
                    update_payment_type: true,
                    update_custom_price: true,
                    park_deletion: true,
                    basket_deletion: true
                },
                product_permissions: {
                    add_remove_favorite: true,
                    allow_see_others_branches: true
                },
                discount_rates: {
                    product_discount_limit: 100,
                    cart_discount_limit: 100
                }
            }
        },
        'Vendeur': {
            name: 'Vendeur',
            description: 'Gestion de caisse',
            back_office: {
                allow_access_backoffice: false,
                product_permissions: {
                    products_descriptions: false,
                    editing_products: false,
                    editing_definitions: false,
                    see_products_ingredients: false 
                },
                customer_permissions: {
                    seeing_customers: false,
                    editing_customers: false,
                },
                inventory_permissions: {
                    inventory_viewing_editing: false,
                    inventory_validation: false
                },
                employee_permissions: {
                    seeing_employees: false,
                    editing_employees: false
                },
                other_permissions: {
                    view_reports: false,
                    setting_access: false,
                    update_payment_type: false
                },
                marketplace_permissions: {
                    viewing_orders: false,
                    approval_orders: false,
                    authority_to_create_invoice: false,
                    brand_category_product: false,
                    viewing_editing_marketplace_settings: false
                }
            },
            point_of_sale: {
                allow_access_pos: true,
                terminal_permissions: {
                    view_terminal_status: false,
                    terminal_open_close: true,
                    see_sales_transactions: false,
                    access_pos_settings: false
                },
                sale_permissions: {
                    refund: false,
                    cancellation_of_sales: false,
                    update_payment_type: false,
                    update_custom_price: false,
                    park_deletion: true,
                    basket_deletion: true
                },
                product_permissions: {
                    add_remove_favorite: false,
                    allow_see_others_branches: true
                },
                discount_rates: {
                    product_discount_limit: 100,
                    cart_discount_limit: 100
                }
            }
        },
        'Gestionnaire de stock': {
            name: 'Gestionnaire de stock',
            description: 'Chargé de la gestion de stock',
            back_office: {
                allow_access_backoffice: true,
                product_permissions: {
                    products_descriptions: true,
                    editing_products: true,
                    editing_definitions: true,
                    see_products_ingredients: true 
                },
                customer_permissions: {
                    seeing_customers: true,
                    editing_customers: true,
                },
                inventory_permissions: {
                    inventory_viewing_editing: true,
                    inventory_validation: true
                },
                employee_permissions: {
                    seeing_employees: true,
                    editing_employees: false
                },
                other_permissions: {
                    view_reports: true,
                    setting_access: false,
                    update_payment_type: true
                },
                marketplace_permissions: {
                    viewing_orders: true,
                    approval_orders: true,
                    authority_to_create_invoice: true,
                    brand_category_product: true,
                    viewing_editing_marketplace_settings: true
                }
            },
            point_of_sale: {
                allow_access_pos: true,
                terminal_permissions: {
                    view_terminal_status: true,
                    terminal_open_close: true,
                    see_sales_transactions: true,
                    access_pos_settings: true
                },
                sale_permissions: {
                    refund: true,
                    cancellation_of_sales: true,
                    update_payment_type: true,
                    update_custom_price: false,
                    park_deletion: true,
                    basket_deletion: true
                },
                product_permissions: {
                    add_remove_favorite: true,
                    allow_see_others_branches: true
                },
                discount_rates: {
                    product_discount_limit: 100,
                    cart_discount_limit: 100
                }
            }
        },
       'Autre': {
            name: 'Autre rôle',
            description: 'Chargé de la gestion de stock',
            back_office: {
                allow_access_backoffice: true,
                product_permissions: {
                    products_descriptions: true,
                    editing_products: true,
                    editing_definitions: true,
                    see_products_ingredients: true 
                },
                customer_permissions: {
                    seeing_customers: true,
                    editing_customers: true,
                },
                inventory_permissions: {
                    inventory_viewing_editing: true,
                    inventory_validation: true
                },
                employee_permissions: {
                    seeing_employees: true,
                    editing_employees: false
                },
                other_permissions: {
                    view_reports: true,
                    setting_access: false,
                    update_payment_type: true
                },
                marketplace_permissions: {
                    viewing_orders: true,
                    approval_orders: true,
                    authority_to_create_invoice: true,
                    brand_category_product: true,
                    viewing_editing_marketplace_settings: true
                }
            },
            point_of_sale: {
                allow_access_pos: true,
                terminal_permissions: {
                    view_terminal_status: true,
                    terminal_open_close: true,
                    see_sales_transactions: true,
                    access_pos_settings: true
                },
                sale_permissions: {
                    refund: true,
                    cancellation_of_sales: true,
                    update_payment_type: true,
                    update_custom_price: false,
                    park_deletion: true,
                    basket_deletion: true
                },
                product_permissions: {
                    add_remove_favorite: true,
                    allow_see_others_branches: true
                },
                discount_rates: {
                    product_discount_limit: 100,
                    cart_discount_limit: 100
                }
            }
        } 
    }
}
