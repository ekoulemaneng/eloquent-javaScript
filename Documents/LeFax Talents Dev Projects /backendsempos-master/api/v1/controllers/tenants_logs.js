const Log = require('../models/tenant_log')
const User = require('../models/employee')
const errors = require('../utils/standardErrors')
const { isInputNotEmpty, stringToDate } = require('../utils/inputUtils')

const getLog = (log) => {
    try {
        return {
            id: log._id.toString(),
            tenant: log.tenant,
            user: {
                id: log.user._id.toString(),
                firstname: log.user.firstname,
                lastname: log.user.lastname
            },
            type: log.type,
            entity: log.entity,
            date: log.date,
            object_created: log.object_created,
            update_data: log.update_data,
            object_deleted: log.object_deleted
        }
    } 
    catch (error) {
        console.error(error)
    }
}

module.exports = {
    // Add a log
    async addLog (tenant_id, user_id, type, entity, object_created, update_data, object_deleted) {
        try {
            if (!(await User.findOne({ tenant: tenant_id, user: user_id }))) return errors.error404
            let log = await Log.create({ tenant: tenant_id, user: user_id, type, entity, object_created, update_data, object_deleted })
            log = await Log.findOne({ tenant: tenant_id, _id: log._id.toString() }).populate('user')
            return { status: 201, details: getLog(log) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get a log by id
    async getLog (tenant_id, id) {
        try {
            const log = await Log.findOne({ tenant: tenant_id, _id: id }).populate('user')
            if (!log) return errors.error404
            return { status: 200, details: getLog(log) }
        } 
        catch (error) {
            console.error(error)
            return error    
        }
    },
    // Get logs
    async getLogs (tenant_id, users_ids, types, entities, start_date, end_date, page, limit) {
        try {
            let filter = {}
            filter.tenant = { $eq: tenant_id }
            if (isInputNotEmpty(users_ids)) filter.user = { $all: users_ids }
            if (isInputNotEmpty(types)) filter.type = { $all: types }
            if (isInputNotEmpty(entities)) filter.entity = { $all: entities }
            if (stringToDate('start', start_date) && stringToDate('end', end_date)) filter.$and = [{ date: { $gte: stringToDate('start', start_date) } }, { date: { $lte: stringToDate('end', end_date) } }]
            else if (stringToDate('start', start_date) && !stringToDate('end', end_date)) filter.date = { $gte: stringToDate('start', start_date) }
            else if (!stringToDate('start', start_date) && stringToDate('end', end_date)) filter.date = { $lte: stringToDate('end', end_date) }
            if (page === undefined && limit === undefined) {
                const logs = await Log.find(filter).populate('user')
                const count = logs.length
                return { status: 200, details: { total: count, count: count, currentPage: 1, pages: 1, prevPage: null, nextPage: null, data: logs.map(log => getLog(log)) } }
            }
            else {
                if (!page) page = 1
                if (!limit) limit = 20
                const offset = (page - 1) * limit
                const logs = await Log.find(filter).populate('user')
                const count = logs.length
                const total = await Log.countDocuments()
                const pages = Math.ceil(total/limit)
                const prevPage = page > 1 ? page - 1 : null
                const nextPage = page < pages ? page + 1 : null
                return { status: 200, details: { total: total, count: count, currentPage: page, pages: pages, prevPage: prevPage, nextPage: nextPage, data: logs.map(log => getLog(log)) }}
            
            }
        } 
        catch (error) {
            console.error(error)
            return error
        }
    }
}
