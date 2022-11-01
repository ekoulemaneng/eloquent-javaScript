const mongoose = require("mongoose")
const { isInputNotEmpty } = require('../utils/inputUtils')
const _ = require('lodash')

const employeeSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    infos: {
      firstname: { type: String, required: true },
      lastname: { type: String},
      role: [String],
      email: String,
      phones: [String],
      legal_identification_number: String,
      branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }]
    },
    app_use_settings: {
      is_app_user: { type: Boolean, default: false, required: true },
      credentials: {
        email: String,
        password: String, 
        access_key: String,
        reset_password: {
          token: String,
          expiry: Date
        }
      },
      send_email_reports: { type: Boolean, default: false, required: true }
    }
  },
  {
    timestamps: true
  }
)

employeeSchema.pre('save', { document: true, query: false }, async function (next) {
  this.infos.phones = _.uniq(this.infos.phones)
  this.infos.branches = _.uniqWith(this.infos.branches, _.isEqual)
  const oldBranches = await (this.model('Branch')).find()
  this.infos.branches = _.filter(this.infos.branches, function (branch) { return _.includes(oldBranches.map(oldBranch => oldBranch._id.toString()), branch._id.toString()) })
  next()
})

employeeSchema.pre('updateOne', async function (next) {
  const data = this.getUpdate()
  // Filter phones
  let phones = data.$set['infos.phones']
  phones = _.uniq(phones)
  data.$set['infos.phones'] = phones
  // Filter branches
  let branches = data.$set['infos.branches']
  const oldBranches = await ((await this.model.findOne(this.getQuery())).model('Branch')).find()
  branches = _.filter(branches, function (branch) { return _.includes(oldBranches.map(oldBranch => oldBranch._id.toString()), branch._id.toString()) })
  data.$set['infos.branches'] = branches
  // Update 
  this.update({}, data).exec()
  next()
})

module.exports = mongoose.model('Employee', employeeSchema)
