const express = require("express")
const app = express()

const { connectMongoDB } = require('./config')
connectMongoDB()

const cors = require('cors')

app.use(cors());

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const helmet = require('helmet')
app.use(helmet())

const mongoSanitize = require('express-mongo-sanitize')
app.use(mongoSanitize())

const xss = require('xss-clean')
app.use(xss())

const swaggerUI = require('swagger-ui-express')
const YAML = require('yamljs')

const apiDoc_v1 = YAML.load('./api-doc/apidoc_v1.yaml')
app.use('/v1/docs', swaggerUI.serve, swaggerUI.setup(apiDoc_v1))

const path = require('path')
app.use('/logos', express.static(path.join(__dirname, 'files', 'images', 'logos')))

app.use('/v1', require('./api/v1/routes/index'))

app.use((err, req, res, next) => {
    if (typeof (err) === 'string') return res.status(400).send({ code: 'Failed', message: err })
    res.status(500).send({ code: 'Failed', message: err.message });
})

module.exports = app
