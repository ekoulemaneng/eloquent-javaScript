const mongoose = require('mongoose')
const { mongodbCluster, mongodbClusterUser, mongodbClusterPassword } = require('../../../config')

const connectDB =  async (dbname) => {
    try {
        const db = await mongoose.connect(`mongodb+srv://${mongodbClusterUser}:${mongodbClusterPassword}@${mongodbCluster}/${dbname}?retryWrites=true&w=majority`)
        console.log(`Successfully got the ${mongoose.connection.db.databaseName} database to delete.`)
        return db
    } 
    catch (error) {
        console.log(error) 
    }
}

module.exports = async (dbname) => {
    try {
        await connectDB(dbname)
        await mongoose.connection.db.dropDatabase()
        console.log(`The ${mongoose.connection.db.databaseName} database has been successfully deleted`)
    } 
    catch (error) {
        console.log(error)
        return error
    }
}