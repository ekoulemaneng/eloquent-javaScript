const mongoose = require("mongoose")
const { hashPassword } = require('../utils/passwordUtils')
const { keyGenerator } = require("../utils/tokenAndGeneratorsUtils")

module.exports = new mongoose.Schema(
    {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true, unique: true},
        phone: String,
        role: { type: String, default: 'admin', enum: ['admin', 'superadmin'], required: true },
        password: { type: String, set: str => hashPassword(str), required: true },
        accessKey: { type: String, default: keyGenerator(), required: true},
        isEmailAuthenticated: { type: Boolean, default: false, required: true }
    },
    { timestamps: true }
)
