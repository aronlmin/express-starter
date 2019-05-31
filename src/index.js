const isProduction = require('./lib/isProduction')

if (isProduction) require('dotenv').config({ path: './.env.production' })
if (!isProduction) require('dotenv').config({ path: './.env.development' })

const express = require('express')
const app = express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const cors = require('cors')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// require routes
app.use('/', require('./routes'))

const port = process.env.PORT || '4000'
server.listen(port, () => {
  console.log(`Successfully Started Express Server`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Node Version: ${process.version}`)
  console.log(`Listening on: tcp://localhost:${port}`)
})
