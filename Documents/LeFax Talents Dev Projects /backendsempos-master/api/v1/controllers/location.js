const axiosGetRequest = require('../services/axiosGetRequest')
const countries = require('../utils/countriesInfos')

module.exports = {
    async getLocation (ip) {
        const code = (await axiosGetRequest(ip)).data.geo.country_code
        return { status: 200, details: countries[code] }
    }
}