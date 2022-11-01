const CryptoJS = require('crypto-js')
const { secretPassKey } = require('../../../config')

const hashPassword = (password) => {
    try {
        return CryptoJS.AES.encrypt(password, secretPassKey).toString()
    } 
    catch (error) {
        console.error(error)    
    }
}

const checkPassword = (plainTextPassword, hashedPassword) => {
    try {
        const bytes = CryptoJS.AES.decrypt(hashedPassword, secretPassKey)
        const originalPassword = bytes.toString(CryptoJS.enc.Utf8)
        return plainTextPassword == originalPassword
    } 
    catch (error) {
        console.error(error)    
    }
}

module.exports = { hashPassword, checkPassword }