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

app.use(morgan('combined'))
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
  console.log(`Successfully Started Express Server`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Node Version: ${process.version}`)
  console.log(`Listening on: tcp://localhost:${port}`)
})
