const Admin = require('../models/admins')
const errors = require('../utils/standardErrors')
const { jwtTokenGenerator, jwtTokenDecoder, keyGenerator } = require('../utils/tokenAndGeneratorsUtils')
const { accessTokenValidityPeriod, resetTokenValidityPeriod } = require('../../../config')
const { checkPassword } = require('../utils/passwordUtils')
const { isInputNotEmpty } = require('../utils/inputUtils')

const getAdmin = (admin) => {
    return {
        id: admin['_id'],
        firstname: admin['firstname'],
        lastname: admin['lastname'],
        email: admin['email'],
        phone: admin['phone'],
        role: admin['role'],
        isEmailAuthenticated: admin['isEmailAuthenticated']
    }
}


module.exports = {
    // Create a new admin account
    async addAdmin (firstname, lastname, email, phone, role, password) {
        try {
            if ((await this.getAdminByEmail(email)).status == 200) return { status: 400, details: { code: 'email_already_used', message: 'This email is already used by another admin account'}}
            const admin = await Admin.create({ firstname, lastname, email, phone, role, password })
            if (!admin) return errors.error500
            const emailToken = jwtTokenGenerator({ id: admin._id})
            if (role == 'superadmin') {
                const accessToken = jwtTokenGenerator({ id: admin._id, role: admin.role, accessKey: admin.accessKey, expiryTime: Date.now() + accessTokenValidityPeriod })
                return { status: 201, details: { id: admin._id, emailToken: emailToken, accesstoken: accessToken } }
            }
            else if (role == 'admin') return { status: 201, details: { id: admin._id, emailToken: emailToken } }
        } 
        catch (error) {
            console.error(error)    
        }
    },
    // Authenticate admin email
    async authenticateEmail (token) {
        try {
            const tokenData = jwtTokenDecoder(token)
            if (tokenData.status == 400) return { status: tokenData.status, details: tokenData.details }
            if (!tokenData.id || (await this.getAdminById(tokenData.id)).status != 200) return errors.error404
            const admin = await Admin.findById(tokenData.id)
            admin.isEmailAuthenticated = true
            await admin.save()
            return { status: 200, details: { code: 'email_authenticated', message: 'The admin email has been successfully authenticated' } }
        } catch (error) {
            console.error(error)
        }
    },
    // Log in to an admin account
    async logIn (email, password) {
        try {
            const admin = await Admin.findOne({ email })
            if (!admin) return errors.error404
            if (!admin.isEmailAuthenticated) return { status: 400, details: { code: 'email_not_authenticated', message: 'The email is not yet authenticated' } }
            if (!checkPassword(password, admin.password)) return { status: 400, details: { code: 'incorrect_password', message: 'The password is incorrect' } }
            const accessToken = jwtTokenGenerator({ id: admin._id, role: admin.role, accessKey: admin.accessKey, expiryTime: Date.now() + accessTokenValidityPeriod})
            return { status: 200, details: { id: admin._id, accessToken: accessToken} }
        } 
        catch (error) {
            console.error(error)    
        }
    },
    // Log out from an admin account
    async logOut (id) {
        try {
            let admin = await Admin.findById(id)
            if (!admin) return errors.error404
            admin.accessKey = keyGenerator()
            await admin.save()
            return { status: 200, details: { code: 'logged_out', message: 'The admin has been successfully logged out' } }
        } 
        catch (error) {
            console.error(error)    
        }
    },
    // Get the superadmin
    async getSuperAdmin () {
        try {
            const admin = await Admin.findOne({ role: 'superadmin' })
            if (!admin) return errors.error404
            return { status: 200, details: getAdmin(admin) }
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Get an admin by id
    async getAdminById (id) {
        try {
            const admin = await Admin.findById(id)
            if (!admin) return errors.error404
            return { status: 200, details: getAdmin(admin) }
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Get admin by email
    async getAdminByEmail (email) {
        try {
            const admin = await Admin.findOne({ email })
            if (!admin) return { status: 404 , details: { code: 'no_admin_with_this_email', message: 'There is no admin with this email' } }
            return { status: 200, details: getAdmin(admin) }
        } 
        catch (error) {
            console.error(error)  
        }
    },
    // Get admin access key
    async getAdminAccessKey (id) {
        try {
            const admin = await Admin.findById(id)
            if (!admin) return errors.error404
            if (!admin.accessKey) return { status: 200, details: { code: 'no_access_key', message: 'There is no access key', accessKey: null }}
            return { status: 200, details: { id: admin._id, accessKey: admin.accessKey } }

        } 
        catch (error) {
            console.error(error)    
        }
    },
    // Get all admins
    async getAdmins (page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit
            const admins = await Admin.find().limit(limit).skip(offset)
            const count = admins.length
            const total = await Admin.countDocuments()
            const pages = Math.ceil(total/limit)
            const data = admins.map(admin => getAdmin(admin))
            const prevPage = page > 1 ? page - 1 : null
            const nextPage = page < pages ? page + 1 : null
            return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data }}
        } 
        catch (error) {
            console.error(error)  
        }
    },
    // Update admin infos
    async updateAdminInfos (id, firstname, lastname, phone) {
        try {
            let admin = await Admin.findById(id)
            if (!admin) return errors.error404
            if (isInputNotEmpty(firstname)) admin.firstname = firstname
            if (isInputNotEmpty(firstname)) admin.lastname = lastname
            if (isInputNotEmpty(phone)) admin.phone = phone
            await admin.save()
            return { status: 200, details: getAdmin(admin) }
        } 
        catch (error) {
            console.error(error)    
        }
    },
    // Update admin password
    async updateAdminPassword (id, password) {
        try {
            let admin = await Admin.findById(id)
            if (!admin) return errors.error404
            admin.password = password
            admin.accessKey = keyGenerator()
            await admin.save()
            return { status: 200, details: { code: 'password_updated', message: 'The password has been successfully updated' } }
        } 
        catch (error) {
            console.error(error)     
        }
    },
    // Get token to reset password
    async getResetPasswordToken (email) {
        try {
            const admin = await Admin.findOne({ email })
            if (!admin) return errors.error404
            const resetToken = jwtTokenGenerator({ id: admin._id, expiryTime: Date.now() + resetTokenValidityPeriod })
            return { status: 200, details: { id: admin._id, resetToken: resetToken } }
        } 
        catch (error) {
            console.error(error)    
        }
    },
    // Reset password
    async resetPassword (token, password) {
        try {
            const tokenData = jwtTokenDecoder(token)
            const admin = await Admin.findById(tokenData.id)
            if (!admin) return errors.error404
            if (tokenData.expiryTime < Date.now()) return { status: 400, details: { code: 'token_not_longer_valid', message: 'The reset password token is not longer valid' } }
            admin.password = password
            admin.accessKey = keyGenerator()
            await admin.save()
            return { status: 200, details: { code: 'password_reseted', message: 'The password has been successfully reseted' } }
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Delete employee account
    async deleteAdmin (id) {
        try {
            if ((await this.getAdminById(id)).status != 200) return errors.error404
            if ((await this.getSuperAdmin()).details.id == id) return errors.error403
            await Admin.findByIdAndDelete(id)
            const admin = await Admin.findById(id)
            if (!admin) return errors.error500
            return { status: 200, details: { code: 'admin_account_deleted', message: 'The admin account has been successfully deleted' }}
        } 
        catch (error) {
            console.error(error)    
        }
    }
}