const axios = require('axios')

let axiosGetRequest = async (ip) => {
    try {
        const res =  await axios({
            url: "https://tools.keycdn.com/geo.json",
            method: "get",
            params: {"host": ip},
            headers: {"User-Agent": "keycdn-tools:https://www.sempos.com"}
        })
        return res.data
    }
    catch (error) {
        console.error(error)
    }
}

module.exports = axiosGetRequest