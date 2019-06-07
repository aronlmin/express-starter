'use strict'

// const isProduction = require('../lib/isProduction')
const mongoose = require('mongoose')
const uri = `mongodb://localhost:27017/${process.env.DBNAME}`
const options = {
  useCreateIndex: true,
  useNewUrlParser: true
}
mongoose.connect(uri, options)
// if (!isProduction) mongoose.set('debug', true)
require('./userModel')
