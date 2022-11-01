const jwt = require('jsonwebtoken')
const Str = require('@supercharge/strings')
const { customAlphabet } = require('nanoid')
const { numberOfDigitsForUniqueCode, secretJWTKey, jwtExpirationDelay } = require('../../../config')

const passwordGenerator = () => Str.random(12)

const keyGenerator = () => Str.random()

const jwtTokenGenerator = (payload) => {
    try {
        return jwt.sign(payload, secretJWTKey, { expiresIn: jwtExpirationDelay })
    }
    catch (error) {
        return { status: 400, details: { code: error.name, message: error.message }}
    }
}

const jwtTokenDecoder = (token) => {
    try {
        return jwt.verify(token, secretJWTKey)
    } 
    catch (error) {
        return { status: 400, details: { code: error.name, message: error.message }}
    }
}

const generateUniqueCode = (n = numberOfDigitsForUniqueCode) => customAlphabet('0123456789', n)()

module.exports = { passwordGenerator, keyGenerator, jwtTokenGenerator, jwtTokenDecoder, generateUniqueCode }