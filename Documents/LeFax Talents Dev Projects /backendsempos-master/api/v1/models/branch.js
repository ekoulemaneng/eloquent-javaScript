const mongoose = require("mongoose")

const branchSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    business_name: { 
      type: String, 
      required: true 
    },
    business_type: String,
    email: String,
    phone: String,
    address: String,
    town: String,
    NIU: String,
    RCCM: String,
    isCoreBranch: { 
      type: Boolean, 
      default: false, 
      required: true 
    },
    branches:[{ type: mongoose.Schema.Types.ObjectId, ref:'Branch' }],
    registers: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Register' 
      }
    ],
    modules: [{ type: String, enum: ['treasury', 'products', 'marketing', 'services', 'payroll', 'orders', 'reservations', 'billing'] }]
  },
  { 
    timestamps: true 
  }
)

branchSchema.post('save', async function (branch) {
  console.log('branch: ' + branch)
  const Employee = branch.model('Employee')
  const owner = await Employee.findOne({ tenant: branch.tenant, 'infos.role': { $in: ['Account Owner'] }})
  console.log('owner1: ' + owner)
  owner.infos.branches.push(branch._id.toString())
  owner.infos.branches = [...new Set(owner.infos.branches)]
  await owner.save()
})

module.exports = mongoose.model('Branch', branchSchema)

