const Branch = require('../models/branch')
const logControllers = require('../controllers/tenants_logs')
const diff = require('../utils/objectsDiffEvaluator')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty } = require('../utils/inputUtils')
const { emailVerification } = require('../utils/emailUtils')

const getBranch = (branch) => {
    return { 
        id: branch._id.toString(), 
        business_name: branch['business_name'], 
        business_type: branch['business_type'],
        email: branch['email'], 
        phone: branch['phone'], 
        address: branch['address'], 
        town: branch['town'], 
        NIU: branch['NIU'], 
        RCCM: branch['RCCM'], 
        isCoreBranch: branch['isCoreBranch'], 
        branches: branch['branches'],
        modules: branch['modules']
    }
}

module.exports = {
    // Create a new branch
    async addBranch (tenant, user, business_name, business_type, email, phone, address, town, NIU, RCCM, isCoreBranch) {
        try {
            if (isCoreBranch === true && await Branch.findOne({ tenant, isCoreBranch })) return { status: 400, details: { code: 'only_one_corebranch', message: 'It can be only one core branch' } }
            if (await Branch.findOne({ tenant, business_name })) return { status: 400, details: { code: 'business_name_already_used', message: 'This business name is already for another branch' } }
            let branch = await Branch.create({ tenant, business_name, business_type, email, phone, address, town, NIU, RCCM})
            if (!branch) return errors.error500
            if (isCoreBranch == true) {
                branch.isCoreBranch = true
                await branch.save()
            }
            else {
                const coreBranch = await this.getCoreBranch(tenant)
                coreBranch.branches.push(branch._id)
                await coreBranch.save()
            }
            await logControllers.addLog(tenant, user, 'create', 'branch', getBranch(branch))
            return { status: 201, details: getBranch(branch) }
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Get core branch
    async getCoreBranch (tenant) {
        try {
            const branch = await Branch.findOne({ tenant,  isCoreBranch: true }).populate('branches')
            if (!branch) return { status: 404, details: { code: 'no_core_branch', message: 'There is no core branch' } }
            return { status: 200, details: getBranch(branch) }
        } 
        catch (error) {
            console.error(error)
        }
    }, 
    // Get branch by id
    async getBranchById (tenant, id) {
        try {
            const branch = await Branch.findOne({ tenant, id }).populate('branches')
            if (!branch) return errors.error404
            return { status: 200, details: getBranch(branch)}
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Get branch by name
    async getBranchByName (tenant, name) {
        try {
            const branch = await Branch.findOne({ tenant, business_name: name }).populate('branches')
            if (!branch) return errors.error404
            return { status: 200, details: getBranch(branch) }
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Get branch by email
    async getBranchByEmail (tenant, email) {
        try {
            const branch = await Branch.findOne({ tenant, email }).populate('branches')
            if (!branch) return errors.error404
            return { status: 200, details: getBranch(branch) }
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Get branches
    async getBranches (tenant, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit
            const branches = await Branch.find({ tenant }).populate('branches').limit(limit).skip(offset)
            const count = branches.length
            const total = await Branch.countDocuments()
            const pages = Math.ceil(total/limit)
            const data = branches.map(branch => getBranch(branch))
            const prevPage = page > 1 ? page - 1 : null
            const nextPage = page < pages ? page + 1 : null
            return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: data } }
        } 
        catch (error) {
            console.error(error)   
        }
    },
    // Update a branch
    async updateBranch (tenant, user, id, business_name, business_type, email, phone, address, town, NIU, RCCM, modules) {
        try {
            if (isInputNotEmpty(business_name) && (await this.getBranchByName(tenant, business_name)).status == 200) return { status: 400, details: { code: 'business_name_already_used', message: 'This business name is already for another branch' } }
            if (isInputNotEmpty(email) && (await this.getBranchByEmail(tenant, email)).status != 200 && !(await emailVerification(email))) return { status: 400, details: { code: 'email_not_exists', message: 'This email doesn\'t exist' }}
            let branch = await Branch.findOne({ tenant, _id: id })
            const origObj = JSON.parse(JSON.stringify(await Branch.findOne({ tenant, _id: id }).populate('branches')))
            if (!branch) return errors.error404
            if (isInputNotEmpty(business_name)) branch.business_name = business_name
            if (isInputNotEmpty(business_type)) branch.business_type = business_type
            if (isInputNotEmpty(email)) branch.email = email
            if (isInputNotEmpty(phone)) branch.phone = phone
            if (isInputNotEmpty(address)) branch.address = address
            if (isInputNotEmpty(town)) branch.town = town
            if (isInputNotEmpty(NIU)) branch.NIU = NIU
            if (isInputNotEmpty(RCCM)) branch.RCCM = RCCM
            if (modules.length !== 0) {
                let arr = []
                arr.forEach(module => {
                    if (['treasury', 'products', 'marketing', 'services', 'payroll', 'orders', 'reservations', 'billing'].includes(module) && !branch.modules.includes(module) && !arr.includes(module)) arr.push(module)
                })
                branch.modules = arr
            }
            await branch.save()
            branch = await Branch.findOne({ tenant, _id: id }).populate('branches')
            const newObj = JSON.parse(JSON.stringify(branch))
            await logControllers.addLog(tenant, user, 'update', 'branch', undefined, { orig: origObj, new: newObj, diff: diff(origObj, newObj) })
            return { status: 200, details: getBranch(branch) }
        } 
        catch (error) {
            console.error(error)
        }
    },
    // Delete a branch
    async deleteBranch (tenant, id) {
        try {
            const branch = await Branch.findOne({ tenant, _id: id })
            if (!branch) return errors.error404
            if (branch.isCoreBranch)  return { status: 400, details: { code: 'impossible_to_delete', message: 'Impossible to delete the core branch' } }
            let coreBranch = await Branch.findOne({ tenant, isCoreBranch: true })
            const index = coreBranch.branches.indexOf(id)
            if (index > -1) coreBranch.branches.splice(index, 1)
            await coreBranch.save()
            await branch.deleteOne()
            await logControllers.addLog(tenant, user, 'delete', 'branch', undefined, undefined, branch)
            return { status: 200, details: { code: 'branch_deleted', message: 'The branch has been successfully deleted' } }
        } 
        catch (error) {
            console.error(error)
        }
    }
}
