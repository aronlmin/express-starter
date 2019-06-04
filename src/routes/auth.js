'use strict'

const express = require('express')
const router = express.Router()
const present = require('../lib/present')
const { body, query, validationResult } = require('express-validator/check')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const logger = require('../lib/logger')
const moment = require('moment')

router.post('/', [
  body('email')
    .exists().withMessage('field is required')
    .isString().withMessage('must be a String')
    .isEmail().withMessage('invalid email format'),
  body('password')
    .exists().withMessage('field is required')
    .isString().withMessage('must be a String'),
  body('rememberMe')
    .optional()
    .isBoolean().withMessage('must be a Boolean'),
  query('zoom')
    .optional()
    .isString()
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.log('warn', `** failed login with validation errors`)
    logger.log('warn', `** error ${errors}`)
    logger.log('warn', `** rejected request with 422`)
    return res.status(422).json({ errors: errors.array({ onlyFirstError: true }) })
  }
  let { email, password, rememberMe } = req.body
  let { zoom } = req.query

  User.findOne({ email: { $regex: new RegExp(email.trim(), 'i') } })
    .then(user => {
      // ---------------------------------------------------------------------------------
      // return error if the user is not active
      // ---------------------------------------------------------------------------------
      if (user.active === false) {
        logger.log('fatal', `** ${email} login attempt on inactive user`)
        logger.log('fatal', `** rejected request with 422`)
        return res.status(422).json({
          errors: [{
            location: 'body',
            param: 'email/password',
            msg: 'invalid'
          }]
        })
      }
      // ---------------------------------------------------------------------------------
      // ** IF THE USER IS LOCKED OUT **
      // ---------------------------------------------------------------------------------
      if (user.lockout) {
        logger.log('fatal', `** ${email} login attempt on a locked out user`)
        logger.log('fatal', `** rejected request with 422`)
        return res.status(422).json({
          errors: [{
            location: 'body',
            param: 'email/password',
            msg: 'invalid'
          }]
        })
      }
      // ---------------------------------------------------------------------------------
      // ** IF THE USER LOCKOUT UNTIL IS SET **
      // ---------------------------------------------------------------------------------
      if (user.lockoutUntil && user.lockoutUntil > moment().toDate()) {
        logger.log('fatal', `** ${email} login attempt ${moment(user.lockoutUntil).fromNow()} remaining on lockout`)
        logger.log('fatal', `** rejected request with 401`)
        return res.status(401).json({
          errors: [{
            location: 'body',
            param: 'email/password',
            msg: `${moment(user.lockoutUntil).fromNow()} remaining on lockout`
          }]
        })
      }
      // ---------------------------------------------------------------------------------
      // check the password
      // ---------------------------------------------------------------------------------
      bcrypt.compare(password.trim(), user.passwordHash)
        .then((passed) => {
          if (passed) {
            // ---------------------------------------------------------------------------
            // ** SUCCESSFULL LOGIN **
            // ---------------------------------------------------------------------------
            user.lockout = false
            user.failedLogins = 0
            user.lockoutUntil = null
            user.lastActivity = moment().toDate()
            user.lastLogin = moment().toDate()
            user.save()
              .then(() => {
                logger.log('debug', `** ${email} updated last activity / login`)
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
                logger.log('debug', `** ${email} is successfully authenticated`)
                logger.log('debug', `** rememberMe set to ${rememberMe}`)
                logger.log('debug', `** successfully generated token`)
                logger.log('debug', `** successfully delivered response`)
                res.send(
                  present({
                    resource: 'users',
                    data: [user.entity(user, zoom)],
                    token: token
                  }, req)
                )
              })
              .catch(error => {
                logger.log('fatal', `** ${email} failed to update user activity`)
                logger.log('fatal', `** error ${JSON.stringify(error)}`)
                logger.log('fatal', `** rejected request with 500`)
                return res.status(500).json({
                  errors: [{
                    location: 'body',
                    param: 'email/password',
                    msg: 'your login attempt was successfull, but there was a fatal error on the server'
                  }]
                })
              })
          } else {
            // ---------------------------------------------------------------------------
            // ** FAILED LOGIN ATTEMPT **
            // ---------------------------------------------------------------------------
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
                if (user.lockout === false && user.failedLogins >= 5) {
                  logger.log('fatal', `** ${email} login attempt ${moment(user.lockoutUntil).fromNow()} remaining on lockout`)
                  logger.log('fatal', `** rejected request with 401`)
                  return res.status(401).json({
                    errors: [{
                      location: 'body',
                      param: 'email/password',
                      msg: `${moment(user.lockoutUntil).fromNow()} remaining on lockout`
                    }]
                  })
                } else if (user.lockout === false && user.failedLogins < 5) {
                  logger.log('fatal', `** ${email} failed login attempt ${user.failedLogins}`)
                  logger.log('fatal', `** rejected request with 422`)
                  return res.status(422).json({
                    errors: [{
                      location: 'body',
                      param: 'email/password',
                      msg: 'invalid'
                    }]
                  })
                }
                if (user.lockout) {
                  logger.log('fatal', `** ${email} failed login attempt, locked`)
                  logger.log('fatal', `** rejected request with 422`)
                  return res.status(422).json({
                    errors: [{
                      location: 'body',
                      param: 'email/password',
                      msg: 'invalid'
                    }]
                  })
                }
              })
              .catch(error => {
                logger.log('fatal', `** ${email} failed to update user failed logins`)
                logger.log('fatal', `** error ${JSON.stringify(error)}`)
                logger.log('fatal', `** rejected request with 422`)
                return res.status(422).json({
                  errors: [{
                    location: 'body',
                    param: 'email/password',
                    msg: 'invalid'
                  }]
                })
              })
            // ---------------------------------------------------------------------------
            // ** RETURN FAILED LOGIN ATTEMPT ERROR **
            // ---------------------------------------------------------------------------
            logger.log('fatal', `** ${email} failed login attempt`)
            logger.log('fatal', `** rejected request with 422`)
            return res.status(422).json({
              errors: [{
                location: 'body',
                param: 'email/password',
                msg: 'invalid'
              }]
            })
          }
        })
        // -------------------------------------------------------------------------------
        // if there was an error checking the password
        // -------------------------------------------------------------------------------
        .catch(err => {
          logger.log('fatal', `** error checking the password`)
          logger.log('fatal', `** error ${err}`)
          logger.log('fatal', `** rejected request with 422`)
          return res.status(422).json({
            errors: [{
              location: 'body',
              param: 'email/password',
              msg: 'invalid'
            }]
          })
        })
    })
    // -----------------------------------------------------------------------------------
    // if there was an error looking up the user, or if the email doesnt exist
    // -----------------------------------------------------------------------------------
    .catch(err => {
      logger.log('fatal', `** error looking up ${email}`)
      logger.log('fatal', `** error ${err}`)
      logger.log('fatal', `** rejected request with 422`)
      return res.status(422).json({
        errors: [{
          location: 'body',
          param: 'email/password',
          msg: 'invalid'
        }]
      })
    })
})

module.exports = router
