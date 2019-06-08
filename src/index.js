'use strict'

const isProduction = require('./lib/isProduction')
require('dotenv').config({ path: isProduction ? './.env.production' : './.env.development' })
const express = require('express')
const app = express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const moment = require('moment')
const rfs = require('rotating-file-stream')
const path = require('path')
const device = require('express-device')
const logger = require('./lib/logger')
const compression = require('compression')

// gzip all responses
app.use(compression())
// obtain the type of device making the request
app.use(device.capture())
// log the route / device information
app.use((req, res, next) => {
  req.start = moment()
  logger.log('info', `[appEntry] ${req.originalUrl}`)
  logger.log('debug', `[appEntry] ** Device Type ${req.device.type}`)
  logger.log('debug', `[appEntry] ** Device Name ${req.device.name ? req.device.name : 'n/a'}`)
  logger.log('debug', `[appEntry] ** IP Address ${req.ip} / ${req.ips}`)
  next()
})
// log http traffic
let accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
})
app.use(morgan('combined', { stream: accessLogStream }))
if (!isProduction) app.use(morgan('dev'))
// enable requests from all places
app.use(cors())
// parse requests as json
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// load models
require('./models')

// load routes
app.use('/', require('./routes'))

const port = process.env.PORT
server.listen(port, () => {
  logger.log('debug', `[appEntry] ** Successfully Started Express Server`)
  logger.log('debug', `[appEntry] ** Environment: ${process.env.NODE_ENV}`)
  logger.log('debug', `[appEntry] ** Node Version: ${process.version}`)
  logger.log('debug', `[appEntry] ** Listening on: tcp://localhost:${port}`)
})

// allow chai tests to open connections
module.exports = app
// allow chai tests to close connections
module.exports.stop = () => server.close()
