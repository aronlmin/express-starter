'use strict'

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const logger = require('../lib/logger')
const moment = require('moment')
const present = require('../lib/present')

const error422 = (res) => {
  logger.log('fatal', `[authController] ** rejected request with 422`)
  return res.status(422).json({
    errors: [{
      location: 'body',
      param: 'email/password',
      msg: 'invalid'
    }]
  })
}

const error401 = (res, user) => {
  logger.log('fatal', `[authController] ** rejected request with 401`)
  return res.status(401).json({
    errors: [{
      location: 'body',
      param: 'email/password',
      msg: `${moment(user.lockoutUntil).fromNow().replace('in ', '')} remaining on lockout`
    }]
  })
}

const error500 = (res) => {
  logger.log('fatal', `[authController] ** rejected request with 500`)
  return res.status(500).json({
    errors: [{
      location: 'body',
      param: 'email/password',
      msg: 'your login attempt was successfull, but there was a fatal error on the server'
    }]
  })
}

module.exports = {
  authenticate: (req, res) => {
    let { email, password, rememberMe } = req.body
    let { zoom } = req.query

    User.findOne({ email: { $regex: new RegExp(email.trim(), 'i') } })
      .then(user => {
        // return error if the user is not active
        if (user.active === false) {
          logger.log('fatal', `[authController] ** ${email} login attempt on inactive user`)
          error422(res)
        }

        // ** IF THE USER IS LOCKED OUT **
        if (user.lockout) {
          logger.log('fatal', `[authController] ** ${email} login attempt on a locked out user`)
          error422(res)
        }

        // ** IF THE USER LOCKOUT UNTIL IS SET **
        if (user.lockoutUntil && user.lockoutUntil > moment().toDate()) {
          logger.log('fatal', `[authController] ** ${email} login attempt ${moment(user.lockoutUntil).fromNow().replace('in ', '')} remaining on lockout`)
          error401(res, user)
        }

        // check if the password is correct
        bcrypt.compare(password.trim(), user.passwordHash)
          .then(passed => {
            if (passed) {
              // ** SUCCESSFULL LOGIN **
              logger.log('debug', `[authController] ** password was correct for ${email}`)
              user.lockout = false
              user.failedLogins = 0
              user.lockoutUntil = null
              user.lastActivity = moment().toDate()
              user.lastLogin = moment().toDate()
              user.save()
                .then(() => {
                  logger.log('debug', `[authController] ** updated the last activity / login timestamps for ${email}`)
                  let payload = { email: email }
                  let secret = process.env.JWT_SECRET

                  let signOptions = {
                    subject: email
                  }

                  // determine token expiration
                  if (rememberMe) rememberMe = JSON.parse(rememberMe)
                  if (rememberMe === 1) rememberMe = true
                  if (!rememberMe) signOptions.expiresIn = '12h'

                  let token = jwt.sign(payload, secret, signOptions)
                  logger.log('debug', `[authController] ** ${email} is successfully authenticated`)
                  logger.log('debug', `[authController] ** rememberMe boolean provided was set to ${rememberMe}`)
                  logger.log('debug', `[authController] ** successfully generated token`)
                  present({
                    resource: 'users',
                    data: [user.entity(user, zoom)],
                    token: token
                  }, req, res)
                })
                .catch(err => {
                  logger.log('fatal', `[authController] ** ${email} failed to update user activity`)
                  logger.log('fatal', `[authController] ** error ${JSON.stringify(err)}`)
                  error500(res)
                })
            } else {
              // ** FAILED LOGIN ATTEMPT **
              user.failedLogins += 1
              if (user.failedLogins >= 5) {
                user.lockoutUntil = moment().add(user.failedLogins * (5 * user.failedLogins), 'minutes').toDate()
              }

              if (user.failedLogins === 10) {
                user.lockoutUntil = null
                user.lockout = true
              }

              user.save()
                .then(() => {
                  // tell the client how long he is locked out for
                  if (user.lockout === false && user.failedLogins >= 5) {
                    logger.log('fatal', `[authController] ** ${email} login attempt ${moment(user.lockoutUntil).fromNow().replace('in ', '')} remaining on lockout`)
                    error401(res, user)
                  }

                  // give the client an anonymous invalid username/password error
                  if (user.lockout === false && user.failedLogins < 5) {
                    logger.log('fatal', `[authController] ** ${email} failed login attempt ${user.failedLogins}`)
                    error422(res)
                  }

                  // give the user an anonymous invalid username/password because
                  // the user is officially locked out permanently
                  if (user.lockout) {
                    logger.log('fatal', `[authController] ** ${email} failed login attempt, locked`)
                    error422(res)
                  }
                })
                .catch(err => {
                  logger.log('fatal', `[authController] ** ${email} failed to update user failed logins`)
                  logger.log('fatal', `[authController] ** error ${JSON.stringify(err)}`)
                  error422(res)
                })
              // ** RETURN FAILED LOGIN ATTEMPT ERROR **
              logger.log('fatal', `[authController] ** ${email} failed login attempt`)
              error422(res)
            }
          })
          // if there was an error checking the password
          .catch(err => {
            logger.log('fatal', `[authController] ** error checking the password`)
            logger.log('fatal', `[authController] ** error ${err}`)
            error422(res)
          })
      })
      // if there was an error looking up the user, or if the email doesnt exist
      .catch(err => {
        logger.log('fatal', `[authController] ** error looking up ${email}`)
        logger.log('fatal', `[authController] ** error ${err}`)
        error422(res)
      })
  }
}
