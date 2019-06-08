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

app.use(compression())
app.use(device.capture())
app.use((req, res, next) => {
  req.start = moment()
  logger.log('info', `[appEntry] ${req.originalUrl}`)
  logger.log('debug', `[appEntry] ** Device Type ${req.device.type}`)
  logger.log('debug', `[appEntry] ** Device Name ${req.device.name ? req.device.name : 'n/a'}`)
  logger.log('debug', `[appEntry] ** IP Address ${req.ip} / ${req.ips}`)
  next()
})
let accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
})
app.use(morgan('combined', { stream: accessLogStream }))
if (!isProduction) app.use(morgan('dev'))
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// DATABASE
require('./models')

// require routes
app.use('/', require('./routes'))

const port = process.env.PORT
server.listen(port, () => {
  logger.log('debug', `[appEntry] ** Successfully Started Express Server`)
  logger.log('debug', `[appEntry] ** Environment: ${process.env.NODE_ENV}`)
  logger.log('debug', `[appEntry] ** Node Version: ${process.version}`)
  logger.log('debug', `[appEntry] ** Listening on: tcp://localhost:${port}`)
})

module.exports = app
module.exports.stop = () => server.close()
