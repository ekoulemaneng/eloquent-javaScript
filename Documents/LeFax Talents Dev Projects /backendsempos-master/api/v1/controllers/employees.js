const Employee = require('../models/employee')
const Branch = require('../models/branch')
const rolesControllers = require('../controllers/roles')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty, isObjectIDValid, updateValue } = require('../utils/inputUtils')
const { jwtTokenGenerator } = require('../utils/tokenAndGeneratorsUtils')
const { hashPassword, checkPassword } = require('../utils/passwordUtils')
const { keyGenerator, generateResetPasswordToken } = require('../utils/tokenAndGeneratorsUtils')
const { resetPasswordTokentExpiryTime } = require('../../../config')

const getRole = async (tenant, name) => {
    try {
        const role = (await rolesControllers.getRoleByName(tenant, name)).details
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            back_office: role.back_office,
            point_of_sale: role.point_of_sale
        }
    }
    catch (error) {
        console.error(error)
        return error
    }
}

const getEmployee = async (tenant, employee) => {
    try {
        return {
            id: employee._id.toString(),
            infos: {
              firstname: employee.infos.firstname,
              lastname: employee.infos.lastname,
              roles: employee.infos.role,
              role: await getRole(tenant, employee.infos.role[employee.infos.role.length - 1]),
              email: employee.infos.email,
              phones: employee.infos.phones,
              legal_identification_number: employee.infos.legal_identification_number,
              branches: employee.infos.branches
            },
            app_use_settings: {
              is_app_user: employee.app_use_settings.is_app_user,
              email: employee.app_use_settings.credentials.email,
              send_email_reports: employee.app_use_settings.send_email_reports
            }
        }
    }
    catch (error) {
        console.error(error)
        return error
    }
}

module.exports = {
    // Add an employee
    async addEmployee (tenant, user, infos, app_use_settings) {
        try { 
            if (!infos.firstname) return { status: 400, details: { code: 'firstname_not_provided', message: 'The firstname has not been provided' } }
            let employee
            infos.branches = infos.branches.filter(branch => isObjectIDValid(branch.toString()))   
            if (!app_use_settings.is_app_user) {
                app_use_settings.credentials.email = undefined
                app_use_settings.credentials.password = undefined
                app_use_settings.credentials.access_key = undefined
                app_use_settings.send_email_reports = undefined
                employee = await Employee.create({ tenant,infos, app_use_settings })
                employee = await Employee.findOne({ tenant, _id: employee._id}).populate('infos.branches')
                return { status: 201, details: await getEmployee(tenant, employee) }
            }
            if (!app_use_settings.credentials.email) return { status: 400, details: { code: 'email_not_provided', message: 'The email has not been provided' } }
            if (await Employee.findOne({ tenant, 'app_use_settings.credentials.email': app_use_settings.credentials.email })) return { status: 400, details: { code: 'email_already_used', message: 'This email is already used by another employee'} }
            if (!app_use_settings.credentials.password) return { status: 400, details: { code: 'password_not_provided', message: 'The password has not been provided' } }
            app_use_settings.credentials.password = await hashPassword(app_use_settings.credentials.password)
            app_use_settings.credentials.access_key = keyGenerator()
            employee = await Employee.create({ tenant, infos, app_use_settings })
            employee = await Employee.findOne({ tenant, _id: employee._id }).populate('infos.branches')
         
            if ( user == '' ) {user = employee._id }
            await logControllers.addLog(tenant, user, 'create', 'employee', await getEmployee(tenant, employee))
            return { status: 201, details: { data: await getEmployee(tenant, employee), token: jwtTokenGenerator({ tenant: tenant, id: employee._id, key: employee.app_use_settings.credentials.access_key }) } }
        }
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Log in to an employee account
    async logInToEmployeeAccount (tenant, email, password) {
        try {
            if (!isInputNotEmpty(email)) return { status: 400, details: { code: 'email_not_provided', message: 'The email has not been provided' } }
            if (!isInputNotEmpty(password)) return { status: 400, details: { code: 'password_not_provided', message: 'The password has not been provided'} }
            const employee = await Employee.findOne({ tenant, 'app_use_settings.credentials.email': email }).populate('infos.branches')
            if (!employee) return { status: 404, details: { code: 'no_employee_with_this_email', message: 'There is no employee with this email' } }
            if (!(await checkPassword(password, employee.app_use_settings.credentials.password))) return { status: 400, details: { code: 'password_incorrect', message: 'The password is incorrect' } }
            await logControllers.addLog(tenant, employee._id, 'connect', 'employee')
            return { status: 200, details: { data: await getEmployee(tenant, employee), token: jwtTokenGenerator({ tenant: tenant, id: employee._id, key: employee.app_use_settings.credentials.access_key }) } }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Log out from an employee account
    async logOutFromEmployeeAccount (tenant, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' }}
            const employee = await Employee.findOne({ tenant, _id: id })
            if (!employee) return errors.error404
            await employee.updateOne({ 'app_use_settings.credentials.access_key': keyGenerator() })
            await logControllers.addLog(tenant, employee._id, 'disconnect', 'employee')
            return { status: 200, details: { code: 'successfully_logout', message: 'Successfully out from employee account' } }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },

    // Get an employee by id for authentication
    async getEmployeeByIdForAuth (tenant, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' }}
            const employee = await Employee.findOne({ tenant, _id: id }).populate('infos.branches')
            if (!employee) return errors.error404
            return { status: 200, details: await getEmployee(tenant, employee) }
        } 
        catch (error) {
           console.error(error)
           return error
        }
    },
    // Get an employee by id
    async getEmployeeById (tenant, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' }}
            let employee = await Employee.findOne({ tenant, _id: id }).populate('infos.branches')
            if (!employee) return errors.error404
            if (employee.infos.role.includes('Account Owner')) {
                employee.infos.branches = (await Branch.find({ tenant })).map(branch => branch._id.toString())
                await employee.save()
                employee = await Employee.findOne({ tenant, _id: id }).populate('infos.branches')
            }
            return { status: 200, details: await getEmployee(tenant, employee) }
        } 
        catch (error) {
           console.error(error)
           return error
        }
    },
    // Get an employee by email (as credential)
    async getEmployeeByEmail (tenant, email) {
        try {
            if (!isInputNotEmpty(email)) return { status: 400, details: { code: 'email_not_provided', message: 'The email has not been provided' } }
            const employee = await Employee.findOne({ tenant, 'app_use_settings.credentials.email': email }).populate('infos.branches')
            if (!employee) return { status: 404, details: { code: 'no_employee_with_this_email', message: 'There is no employee with this email' }}
            return { status: 200, details: await getEmployee(tenant, employee) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get employees by role
    async getEmployeesByRole (tenant, role, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const employees = await Employee.find({ tenant, 'infos.role': { $in: [role] } }).populate('infos.branches')
                const count = employees.length
                const data = await Promise.all(employees.map(async (employee) => await getEmployee(tenant, employee)))
                const prevPage = null
                const nextPage = null
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: prevPage, nextPage, nextPage: nextPage, data: data } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const employees = await Employee.find({ tenant: tenant, 'infos.role': { $in: [role] } }).populate('infos.branches').limit(limit).skip(offset)
                const count = employees.length
                const total = await Employee.countDocuments()
                const pages = Math.ceil(total/limit)
                const data = await Promise.all(employees.map(async (employee) => await getEmployee(tenant, employee)))
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
    // Get all employees
    async getEmployees (tenant, page, limit) {
        try {
            if (page === undefined && limit === undefined) {
                const employees = await Employee.find({ tenant }).populate('infos.branches')
                const count = employees.length
                const data = await Promise.all(employees.map(async (employee) => await getEmployee(tenant, employee)))
                const prevPage = null
                const nextPage = null
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: prevPage, nextPage, nextPage: nextPage, data: data } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const employees = await Employee.find({ tenant }).populate('infos.branches').limit(limit).skip(offset)
                const count = employees.length
                const total = await Role.countDocuments()
                const pages = Math.ceil(total/limit)
                const data = await Promise.all(employees.map(async (employee) => await getEmployee(tenant, employee)))
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
    // Get an employee access key
    async getEmployeeAccessKey (tenant, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' }}
            const employee = await Employee.findOne({ tenant, _id: id })
            if (!employee) return { key: null }
            return { key: employee.app_use_settings.credentials.access_key }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Update employee
    async updateEmployee (tenant, user, id, infos, app_use_settings) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' } }
            let employee = await Employee.findOne({ tenant, _id: id })
            const origObj = JSON.parse(JSON.stringify(await Employee.findOne({ tenant, _id: id }).populate('infos.branches')))
            if (!employee) return errors.error404
            // Prevent to modify account owner role
            if (employee.infos.role[0] === 'Account Owner') return { status: 400, details: { code: 'non_changeable_role', message: 'This role cannot be change' } }
            // Add and remove phone numbers
            let phones = employee.infos.phones
            if (infos.phones_to_add) phones = [...new Set([...phones, ...infos.phones_to_add])]
            if (infos.phones_to_remove) phones = [...new Set(phones.filter(phone => !infos.phones_to_remove.includes(phone)))]
            // Add and remove branches
            let branches = employee.infos.branches
            branches = branches.map(branch => branch.toString())
            if (infos.branches_to_add) branches = [...new Set([...branches, ...infos.branches_to_add])]
            if (infos.branches_to_remove) branches = [...new Set(branches.filter(branch => !infos.branches_to_remove.includes(branch)))]
            // If is_app_user is false, crush app_use_settings input data
            if (!app_use_settings.is_app_user) {
                // Update employee
                await employee.updateOne(
                    {
                        $set: {
                            // Infos
                            'infos.firstname': updateValue(infos.firstname),
                            'infos.lastname': updateValue(infos.lastname),
                            'infos.role': updateValue(infos.role),
                            'infos.email': updateValue(infos.email),
                            'infos.phones': updateValue(phones),
                            'infos.egal_identification_number': updateValue(infos.egal_identification_number),
                            'infos.branches': updateValue(branches),
                            // App-use settings 
                            'app_use_settings.is_app_user': false, 
                            'app_use_settings.send_email_reports': false 
                        }, 
                        $unset: {
                            // App-use settings 
                            'app_use_settings.credentials': ''
                        } 
                    }
                )
                // Get the updated employee and return the result
                employee = await Employee.findOne({ tenant, _id: id }).populate('infos.branches')
                employee = await getEmployee(tenant, employee)
                const newObj = JSON.parse(JSON.stringify(employee))
                await logControllers.addLog(tenant, user, 'update', 'employee', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
                return { status: 200, details: employee, send_email: false }
            }
            
            // if is_app_user switchs from false to true
            if (!employee.app_use_settings.is_app_user) {
                if (!isInputNotEmpty(app_use_settings.credentials.email)) return { status: 400, details: { code: 'email_not_provided', message: 'The email has not been provided' } }
                if (await Employee.findOne({ tenant, 'app_use_settings.credentials.email': app_use_settings.credentials.email })) return { status: 400, details: { code: 'email_already_used', message: 'This email is already used by another employee'} }
                if (!isInputNotEmpty(app_use_settings.credentials.password)) return { status: 400, details: { code: 'password_not_provided', message: 'The password has not been provided' } }
                // Hash password and generate access key
                app_use_settings.credentials.password = await hashPassword(app_use_settings.credentials.password)
                app_use_settings.credentials.access_key = keyGenerator()
                // Update employee
                await employee.updateOne({
                    $set: {
                        // Infos
                        'infos.firstname': updateValue(infos.firstname),
                        'infos.lastname': updateValue(infos.lastname),
                        'infos.role': updateValue(infos.role),
                        'infos.email': updateValue(infos.email),
                        'infos.phones': updateValue(phones),
                        'infos.egal_identification_number': updateValue(infos.egal_identification_number),
                        'infos.branches': updateValue(branches),
                        // App-use settings
                        'app_use_settings.is_app_user': updateValue(app_use_settings.is_app_user),
                        'app_use_settings.credentials.email': updateValue(app_use_settings.credentials.email),
                        'app_use_settings.credentials.password': updateValue(app_use_settings.credentials.password),
                        'app_use_settings.credentials.access_key': updateValue(app_use_settings.credentials.access_key),
                        'app_use_settings.send_email_reports': updateValue(app_use_settings.send_email_reports)
                    }
                })
                // Get the updated employee and return the result
                employee = await Employee.findOne({ tenant, _id: id }).populate('infos.branches')
                const newObj = JSON.parse(JSON.stringify(await getEmployee(tenant, employee)))
                await logControllers.addLog(tenant, user, 'update', 'employee', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
                return { status: 400, details: { data: await getEmployee(tenant, employee), token: jwtTokenGenerator({ tenant: tenant, id: employee._id, key: employee.app_use_settings.credentials.access_key }) }, send_email: true }
            }

            // if is_app_user were true and remains true
            if (employee.app_use_settings.is_app_user) {
                // To prevent to modify email
                app_use_settings.credentials.email = undefined
                // If password has not been changed
                if (!isInputNotEmpty(app_use_settings.credentials.password)) {
                    // Update employee
                    await employee.updateOne({
                        $set: {
                            // Infos
                            'infos.firstname': updateValue(infos.firstname),
                            'infos.lastname': updateValue(infos.lastname),
                            'infos.role': updateValue(infos.role),
                            'infos.email': updateValue(infos.email),
                            'infos.phones': updateValue(phones),
                            'infos.egal_identification_number': updateValue(infos.egal_identification_number),
                            'infos.branches': updateValue(branches),
                            // App-use settings
                            'app_use_settings.is_app_user': updateValue(app_use_settings.is_app_user),
                            'app_use_settings.credentials.email': updateValue(app_use_settings.credentials.email),
                            'app_use_settings.credentials.password': updateValue(app_use_settings.credentials.password),
                            'app_use_settings.send_email_reports': updateValue(app_use_settings.send_email_reports)
                        }
                    })
                    // Get the updated employee and return the result
                    employee = await Employee.findOne({ tenant, _id: id }).populate('infos.branches')
                    employee = await getEmployee(tenant, employee)
                    const newObj = JSON.parse(JSON.stringify(employee))
                    await logControllers.addLog(tenant, user, 'update', 'employee', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
                    return { status: 200, details: employee, send_email: false }
                }
                else {
                    // If password has been changed
                    // Hash password and generate a new access key
                    app_use_settings.credentials.password = await hashPassword(app_use_settings.credentials.password)
                    app_use_settings.credentials.access_key = keyGenerator()
                    // Update employee
                    await employee.updateOne({
                        $set: {
                            // Infos
                            'infos.firstname': updateValue(infos.firstname),
                            'infos.lastname': updateValue(infos.lastname),
                            'infos.role': updateValue(infos.role),
                            'infos.email': updateValue(infos.email),
                            'infos.phones': updateValue(phones),
                            'infos.egal_identification_number': updateValue(infos.egal_identification_number),
                            'infos.branches': updateValue(branches),
                            // App-use settings
                            'app_use_settings.is_app_user': updateValue(app_use_settings.is_app_user),
                            'app_use_settings.credentials.email': updateValue(app_use_settings.credentials.email),
                            'app_use_settings.credentials.password': updateValue(app_use_settings.credentials.password),
                            'app_use_settings.credentials.access_key': updateValue(app_use_settings.credentials.access_key),
                            'app_use_settings.send_email_reports': updateValue(app_use_settings.send_email_reports)
                        }
                    })
                    // Get the updated employee and return the result
                    employee = await Employee.findOne({ tenant, _id: id }).populate('infos.branches')
                    const newObj = JSON.parse(JSON.stringify(await getEmployee(tenant, employee)))
                    await logControllers.addLog(tenant, user, 'update', 'employee', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
                    return { status: 200, details: { data: await getEmployee(tenant, employee), token: jwtTokenGenerator({ tenant: tenant, id: employee._id, key: employee.app_use_settings.credentials.access_key }) }, send_email: false }
                }
            }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Request a reset-password token
    async requestResetPasswordToken (tenant, email) {
        try {
            if (!isInputNotEmpty(email)) return { status: 400, details: { code: 'email_not_provided', message: 'The email has not been provided' } }
            const employee = await Employee.findOne({ tenant, 'app_use_settings.credentials.email': email })
            if (!employee) return errors.error404
            const token = generateResetPasswordToken()
            await employee.updateOne({ 
                $set: { 
                    'app_use_settings.credentials.reset_password.token': token,
                    'app_use_settings.credentials.reset_password.expiry': Date.now() + resetPasswordTokentExpiryTime
                } 
            })
            await logControllers.addLog(tenant, employee._id, 'request_reset_password_token', 'employee')
            return { status: 200, details: { code: 'tokent_successfully_sent', message: 'The token has been successfully sent' }, token: token }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    },
    // Reset the password
    async resetPassword (tenant, email, token, password) {
        try {
            if (!isInputNotEmpty(email)) return { status: 400, details: { code: 'email_not_provided', message: 'The email has not been provided' } }
            if (!isInputNotEmpty(token)) return { status: 400, details: { code: 'token_not_provide', message: 'The token has not been provided' } }
            if (!isInputNotEmpty(password)) return { status: 400, details: { code: 'password_not_provided', message: 'The password has not been provided' } }
            let employee = await Employee.findOne({ tenant, 'app_use_settings.credentials.email': email })
            // Check failures
            if (!employee) return errors.error404
            if (employee.app_use_settings.credentials.reset_password.token !== token) return { status: 400, details: { code: 'invalid_token', message: 'This token is not valid' }}
            if (employee.app_use_settings.credentials.reset_password.expiry < Date.now()) {
                await employee.updateOne({ $unset: { 'app_use_settings.credentials.reset_password': '' } })
                return { status: 400, details: { code: 'token_not_longer', message: 'This token is not longer valid' }}
            }
            // Reset password
            await employee.updateOne({
                $set: {
                    'app_use_settings.credentials.password': await hashPassword(password),
                    'app_use_settings.credentials.access_key': keyGenerator()
                },
                $unset: { 'app_use_settings.credentials.reset_password': '' }
            })
            // Get updated employee
            employee = await Employee.findOne({ tenant, 'app_use_settings.credentials.email': email }).populate('infos.branches')
            await logControllers.addLog(tenant, employee._id, 'reset_password', 'employee')
            return { status: 200, details: { data: await getEmployee(tenant, employee) , token: jwtTokenGenerator({ tenant: tenant, id: employee._id, key: employee.app_use_settings.credentials.access_key }) } }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Delete an employee
    async deleteEmployee(tenant, user, id) {
        try {
            if (!isObjectIDValid(id)) return { status: 400, details: { code: 'invalid_id', message: 'The id format is not valid' } }
            const employee = await Employee.findOne({ tenant, _id: id })
            if (!employee) return errors.error404
            await employee.deleteOne()
            if (await Employee.findOne({ tenant, _id: id })) return errors.error500
            await logControllers.addLog(tenant, user, 'delete', 'employee', undefined, undefined, employee)
            return { status: 200, details: { code: 'employee_successfully_deleted', message: 'The employee account has been successfully deleted' }}
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    }
}
