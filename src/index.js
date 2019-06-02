'use strict'

const isProduction = require('./lib/isProduction')

if (isProduction) require('dotenv').config({ path: './.env.production' })
if (!isProduction) require('dotenv').config({ path: './.env.development' })

const express = require('express')
const app = express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const morgan = require('morgan')
const moment = require('moment')
const rfs = require('rotating-file-stream')
const path = require('path')
const device = require('express-device')
const logger = require('./lib/logger')

app.use(device.capture())
app.use((req, res, next) => {
  req.start = moment()
  logger.log('info', `${req.originalUrl}`)
  logger.log('debug', `** Device Type ${req.device.type}`)
  logger.log('debug', `** Device Name ${req.device.name ? req.device.name : 'n/a'}`)
  logger.log('debug', `** IP Address ${req.ip} / ${req.ips}`)
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
const uri = `mongodb://localhost:27017/${process.env.DBNAME}`
const options = {
  useCreateIndex: true,
  useNewUrlParser: true
}
mongoose.connect(uri, options)
if (!isProduction) mongoose.set('debug', true)
require('./models/User')

// require routes
app.use('/', require('./routes'))

const port = process.env.PORT || '4000'
server.listen(port, () => {
  logger.log('info', `Successfully Started Express Server`)
  logger.log('info', `Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.log('info', `Node Version: ${process.version}`)
  logger.log('info', `Listening on: tcp://localhost:${port}`)
})
