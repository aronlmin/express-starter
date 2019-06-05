'use strict'

const present = require('../lib/present')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const moment = require('moment')
const _ = require('lodash')
const logger = require('../lib/logger')

module.exports = {
  register: (req, res) => {
    let { firstName, lastName, email, password } = req.body
    let { zoom } = req.query

    // further validation for values
    let preModelErrors = []

    // check firstName && lastName
    if (firstName && lastName) {
      _.map([
        { key: 'firstName', val: firstName },
        { key: 'lastName', val: lastName }
      ], (obj, i) => {
        let nameErr = null
        if (!/^[a-zA-Z- ]{0,30}$/.test(obj.val)) nameErr = `invalid, a-zA-Z- characters only`
        if (nameErr) preModelErrors.push({ location: 'body', param: obj.key, msg: nameErr })
      })
    }

    // check email
    if (email) {
      let emailErr = null
      if (!/[\p{ASCII}]+/u.test(email)) emailErr = 'use only ASCII valid characters with no accents'
      if (emailErr) preModelErrors.push({ location: 'body', param: 'email', msg: emailErr })
    }

    // check password
    if (password) {
      let passErr = null
      if (!/\d/.test(password)) passErr = 'must contain a number'
      if (!/[a-z]/.test(password)) passErr = 'must contain a lower case letter'
      if (!/[A-Z]/.test(password)) passErr = 'must contain an upper case letter'
      if (!/[\p{ASCII}]+/u.test(password)) passErr = 'use only ASCII valid characters with no accents'
      if (passErr) preModelErrors.push({ location: 'body', param: 'password', msg: passErr })
    }

    if (preModelErrors.length > 0) {
      logger.log('warn', `** failed registration with preModelErrors`)
      logger.log('warn', `** error ${JSON.stringify(preModelErrors)}`)
      logger.log('warn', `** rejected request with 422`)
      return res.status(422).json({ errors: preModelErrors })
    }

    // save the user the database
    let salt = bcrypt.genSaltSync(10)
    let user = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      passwordHash: bcrypt.hashSync(password, salt),
      lastActivity: moment().toDate()
    })

    user.save()
      .then(() => {
        // send registration confirmation email
        console.log('send registration confirmation email')

        // send the json response
        logger.log('debug', `** ${email} is successfully registered`)
        logger.log('debug', `** successfully delivered response`)
        res.send(
          present({
            resource: 'users',
            data: [user.entity(user, zoom)]
          }, req)
        )
      })
      .catch(error => {
        if (error.name === 'ValidationError') {
          logger.log('warn', `** failed registration with ValidationError`)
          logger.log('warn', `** error ${JSON.stringify(error)}`)
          logger.log('warn', `** rejected request with 422`)
          return res.status(422).json(error)
        } else if (error.name === 'MongoError' && error.code === 11000) {
          logger.log('warn', `** failed registration with MongoError`)
          logger.log('warn', `** error email is already taken`)
          logger.log('warn', `** rejected request with 422`)
          return res.status(422).json({
            errors: [{
              location: 'body',
              param: 'email',
              msg: 'email is already taken'
            }]
          })
        } else {
          logger.log('fatal', `** failed registration an anonymous error`)
          logger.log('fatal', `** error ${JSON.stringify(error)}`)
          logger.log('fatal', `** rejected request with 500`)
          return res.status(500).json(error)
        }
      })
  }
}