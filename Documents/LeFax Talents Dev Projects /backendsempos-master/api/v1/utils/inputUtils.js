const isInputNotEmpty = (value) => {
    if ([null, undefined].includes(value)) return false
    else if (['number', 'bigint', 'boolean', 'symbol', 'function'].includes(typeof value)) return true
    else if (typeof value == 'string' && value.replace(/\s/g, '') !== '') return true 
    else if (typeof value == 'object') {
        if (Array.isArray(value)) {
            if (value.length > 0) return true
            return false
        }
        else {
            if (Object.entries(value).length !== 0) return true
            return false
        }
    }
    return false
}

const updateValue = (value) => {
    if (isInputNotEmpty(value)) return value
    return undefined
}

const stringToBool = (value) => {
    if (typeof value === 'boolean') return value
    else if (typeof value === 'string' ) {
        if (value === 'true') return true
        if (value === 'false' ) return false
        return undefined
    }
    else return undefined
}

const stringToInt = (value) => {
    if (typeof value === 'number') return value
    else if (typeof value === 'string') return parseInt(value, 10)
    else return undefined
}

const stringToFloat = (value) => {
    if (typeof value === 'number') return value
    else if (typeof value === 'string') return parseFloat(value, 10)
    else return undefined
}

const objectToParse = (value) => {
    if (typeof value === 'object') return value
    else if (typeof value === 'string') {
        let parsedValue
        try {
            parsedValue = JSON.parse(value)
        }
        catch (e) {
            return undefined
        } 
        return parsedValue
    } 
    else return undefined
}

const isObjectIDValid = (value) => (new RegExp('^[0-9a-fA-F]{24}$')).test(value)

const preventToCrushDataObject = (objectOne, objectTwo) => {
    if (typeof objectOne !== 'object') return
    else Object.keys(objectOne).forEach(key => { 
        if (objectOne[key] === undefined) objectOne[key] = objectTwo[key]
        preventToCrushDataObject(objectOne[key], objectTwo[key]) 
    })
}

const resetAllProperties = (obj) => {
    if (typeof obj !== 'object') return
    else Object.keys(obj).forEach(key => { 
        if (typeof obj[key] === 'boolean' || typeof stringToBool(obj[key]) === 'boolean') obj[key] = false
        else if (typeof obj[key] === 'number' || typeof stringToInt(obj[key]) === 'number' ||  typeof stringToFloat(obj[key]) === 'number') obj[key] = 0.0
        resetAllProperties(obj[key])
    })
}

const objectParser = (obj) => {
    if (typeof obj === 'string') return JSON.parse(obj)
    return obj
}

const stringToDate = (time_point, dateString) => {
    if (!isInputNotEmpty(dateString)) return undefined
    const pressetedDates = ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year']
    if (!pressetedDates.includes(dateString)) {
        if (!isNaN(Date.parse(dateString))) return new Date(dateString)
        else return undefined
    }
    switch (dateString) {
        case 'today':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getHours() >= 0 && date.getHours() <= 5) date.setDate(date.getDate() - 1)
                date.setHours(6, 0, 0, 0)
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getHours() >= 6 && date.getHours() <= 23) date.setDate(date.getDate() + 1)
                date.setHours(5, 59, 59, 999)
                return date
            }
            break
        case 'yesterday':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getHours() >= 0 && date.getHours() <= 5) date.setDate(date.getDate() - 2)
                else date.setDate(date.getDate() - 1)
                date.setHours(6, 0, 0, 0)
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getHours() >= 0 && date.getHours() <= 5) date.setDate(date.getDate() - 1)
                date.setHours(5, 59, 59, 999)
                return date
            }
            break
        case 'this_week':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getDay() > 0 || date.getHours() >= 6) date.setDate(date.getDate() - date.getDay())
                else date.setDate(date.getDate() - 7)
                date.setHours(6, 0, 0, 0)                                
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getDay() > 0 || date.getHours() >= 6) date.setDate(date.getDate() + (7 - date.getDay()))
                date.setHours(5, 59, 59, 999)
                return date
            }
            break
        case 'last_week':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getDay() > 0 || date.getHours() >= 6) {
                    date.setDate(date.getDate() - date.getDay())
                    date.setDate(date.getDate() - 7)
                }
                else {
                    date.setDate(date.getDate() - date.getDay())
                    date.setDate(date.getDate() - 14)
                }
                date.setHours(6, 0, 0, 0)
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getDay() > 0 || date.getHours() >= 6) {
                    date.setDate(date.getDate() - date.getDay())
                    date.setDate(date.getDate())
                }
                else {
                    date.setDate(date.getDate() - date.getDay())
                    date.setDate(date.getDate() - 7)
                }
                date.setHours(5, 59, 59, 999)
                return date
            }
            break
        case 'this_month':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getDate() > 1 || date.getHours() >= 6) date.setDate(1)
                else date.setMonth(date.getMonth() - 1)
                date.setHours(6, 0, 0, 0)
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getDate() > 1 || date.getHours() >= 6) {
                    date.setMonth(date.getMonth() + 1)
                    date.setDate(1)
                }
                date.setHours(5, 59, 59, 999)
                return date
            }
            break
        case 'last_month':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getDate() > 1 || date.getHours() >= 6) {
                    date.setMonth(date.getMonth() - 1)
                    date.setDate(1)
                }
                else date.setMonth(date.getMonth() - 2)
                date.setHours(6, 0, 0, 0)
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getDate() > 1 || date.getHours() >= 6) {
                    date.setDate(1)
                    date.setDate(date.getDate())
                }
                else date.setMonth(date.getMonth() - 1)
                date.setHours(6, 59, 59, 999)
                return date
            }
            break
        case 'this_year':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getMonth() > 0 || date.getDate() > 1 || date.getHours() >= 6) {
                    date.setMonth(0)
                    date.setDate(1)
                }
                else date.setFullYear(date.getFullYear() - 1)
                date.setHours(6, 0, 0, 0)
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getMonth() > 0 || date.getDate() > 1 || date.getHours() >= 6) {
                    date.setMonth(11)
                    date.setDate(32)
                }
                date.setHours(5, 59, 59, 999)
                return date
            }
            break
        case 'last_year':
            if (time_point === 'start') {
                let date = new Date()
                if (date.getMonth() > 0 || date.getDate() > 1 || date.getHours() >= 6) {
                    date.setFullYear(date.getFullYear() - 1)
                    date.setMonth(0)
                    date.setDate(1)
                }
                else date.setFullYear(date.getFullYear() - 2) 
                date.setHours(6, 0, 0, 0)
                return date
            }
            if (time_point === 'end') {
                let date = new Date()
                if (date.getMonth() > 0 || date.getDate() > 1 || date.getHours() >= 6) {
                    date.setFullYear(date.getFullYear() - 1)
                    date.setMonth(11)
                    date.setDate(32)
                }
                else date.setFullYear(date.getFullYear() - 1) 
                date.setHours(5, 59, 59, 999)
                return date
            }
            break
        default:
            break
    }
}

module.exports = { isInputNotEmpty, updateValue, stringToBool, stringToInt, stringToFloat, objectToParse, isObjectIDValid, preventToCrushDataObject, resetAllProperties, objectParser, stringToDate }
