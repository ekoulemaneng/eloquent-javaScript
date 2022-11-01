const mongoose = require('mongoose')

const logSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
        type: { type: String, required: true },
        entity: { type: String, required: true },
        date: { type: Date, default: Date.now() },
        object_created: Object,
        update_data: {
            orig: Object,
            new: Object,
            diff: Object
        },
        object_deleted: Object
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Log', logSchema)
