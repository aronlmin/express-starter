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
      // check the password
      // ---------------------------------------------------------------------------------
      bcrypt.compare(password.trim(), user.passwordHash)
        .then((passed) => {
          if (passed) {
            // ---------------------------------------------------------------------------
            // ** SUCCESSFULL LOGIN **
            // ---------------------------------------------------------------------------
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
          } else {
            // ---------------------------------------------------------------------------
            // ** FAILED LOGIN ATTEMPT **
            // ---------------------------------------------------------------------------
            logger.log('fatal', `** failed login attempt ${email}`)
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
