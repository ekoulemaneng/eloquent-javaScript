const http = require('http')
const app = require('./app')
const server = http.createServer(app)
const { port } = require('./config')

server.listen(process.env.PORT || 5000, () => { console.log('The web server is running.')})
