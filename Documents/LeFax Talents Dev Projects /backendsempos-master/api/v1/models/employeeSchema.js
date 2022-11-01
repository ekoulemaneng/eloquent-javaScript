const mongoose = require("mongoose")
const { hashPassword } = require('../utils/passwordUtils')
const _ = require('lodash')

const employeeSchema = new mongoose.Schema(
  {
    infos: {
      firstname: { type: String, required: true },
      lastname: { type: String, required: true },
      role: [String],
      email: String,
      phones: [String],
      legal_identification_number: String,
      birthDate: Date,
      employmentContractType: String,
      dateOfBeginning: Date,
      dateOfTermination: Date,
      employment: String,
      qualification: String,
      address: String,
      level: String,
      salary: Number,
      branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }]
    },
    app_use_settings: {
      is_app_user: { type: Boolean, default: false, required: true },
      credentials: {
        email: String,
        password: String, 
        access_key: String
      },
      send_email_reports: { type: Boolean, default: false, required: true }
    }
  },
  {
    timestamps: true
  }
)

employeeSchema.pre('save', { document: true, query: false }, async function (next) {
  if (this.app_use_settings.is_app_user) this.app_use_settings.credentials.password = hashPassword(this.app_use_settings.credentials.password)
  this.infos.phones = _.uniq(this.infos.phones)
  this.infos.branches = _.uniqWith(this.infos.branches, _.isEqual)
  const oldBranches = await (this.model('Branch')).find()
  this.infos.branches = _.filter(this.infos.branches, function (branch) { return _.includes(oldBranches.map(oldBranch => oldBranch._id.toString()), branch._id.toString()) })
  next()
})

module.exports = employeeSchema
