'use strict'

const jwt = require('jsonwebtoken')
const moment = require('moment')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const logger = require('./logger')

module.exports = (req, res, next) => {
  if (req.header('Authorization')) {
    // -----------------------------------------------------------------------------------
    // validate the Authorization token
    // -----------------------------------------------------------------------------------
    let token = req.header('Authorization')
    logger.log('debug', `** token ${token}`)
    let secret = process.env.JWT_SECRET

    jwt.verify(token, secret, (err, decoded) => {
      // ---------------------------------------------------------------------------------
      // ** UNABLE TO DECODE **
      // ---------------------------------------------------------------------------------
      if (err) {
        logger.log('warn', '** unable to decode jwt')
        logger.log('warn', `** ${err}`)
        logger.log('warn', `** rejected request with 401`)
        return res.status(401).json({
          errors: [{
            location: 'header',
            param: 'Authorization',
            msg: 'missing or invalid'
          }]
        })
      }
      // ---------------------------------------------------------------------------------
      // ** DECODED **
      // ---------------------------------------------------------------------------------
      if (decoded.exp) {
        // -------------------------------------------------------------------------------
        // ** CHECK IF EXPIRED **
        // -------------------------------------------------------------------------------
        if (moment() > moment.unix(decoded.exp)) {
          logger.log('warn', `** ${decoded.email} token is expired`)
          logger.log('warn', `** ${decoded.email} rejected request with 401`)
          return res.status(401).json({
            errors: [{
              location: 'header',
              param: 'Authorization',
              msg: 'missing or invalid'
            }]
          })
        }
        // -------------------------------------------------------------------------------
        // ** SET USER TO REQ VAR **
        // -------------------------------------------------------------------------------
        if (decoded.email) {
          logger.log('debug', `** ${decoded.email} token is valid`)
          logger.log('debug', `** ${decoded.email} adding user to the local request object`)
          User.findOne({ email: { $regex: new RegExp(decoded.email.trim(), 'i') } })
            .then(user => {
              // -------------------------------------------------------------------------
              // ** CHECK FOR LOCKOUT **
              // -------------------------------------------------------------------------
              if (user.lockout) {
                logger.log('warn', `** ${decoded.email} account is locked out`)
                logger.log('warn', `** ${decoded.email} rejected request with 401`)
                return res.status(401).json({
                  errors: [{
                    location: 'header',
                    param: 'Authorization',
                    msg: 'missing or invalid'
                  }]
                })
              }
              // -------------------------------------------------------------------------
              // ** CHECK FOR INACTIVE **
              // -------------------------------------------------------------------------
              if (user.active === false) {
                logger.log('warn', `** ${decoded.email} account is no longer active`)
                logger.log('warn', `** ${decoded.email} rejected request with 401`)
                return res.status(401).json({
                  errors: [{
                    location: 'header',
                    param: 'Authorization',
                    msg: 'missing or invalid'
                  }]
                })
              }
              // -------------------------------------------------------------------------
              // ** SET USER AND GO NEXT **
              // -------------------------------------------------------------------------
              user.lastActivity = moment().toDate()
              user.save()
                .then(() => {
                  req.user = user
                  logger.log('debug', `** ${decoded.email} set user to local request object`)
                  logger.log('debug', `** ${decoded.email} moving on to route controller`)
                  next()
                })
                .catch(error => {
                  logger.log('fatal', `** failed to update lastActivity`)
                  logger.log('fatal', `** error ${JSON.stringify(error)}`)
                  logger.log('fatal', `** rejected request with 500`)
                  return res.status(500).json({
                    errors: [{
                      err: 'your token was valid, but there was a fatal error on the server'
                    }]
                  })
                })
            })
            .catch(err => {
              logger.log('fatal', `** ${decoded.email} failed to get user from the database`)
              logger.log('fatal', `** ${decoded.email} rejected request with 500`)
              return res.status(500).json({
                errors: [{
                  err: err
                }]
              })
            })
        } else {
          logger.log('fatal', `** suspicious token found`)
          logger.log('fatal', `** rejected request with 401`)
          return res.status(401).json({
            errors: [{
              location: 'header',
              param: 'Authorization',
              msg: 'missing or invalid'
            }]
          })
        }
      }
    })
  } else {
    // -----------------------------------------------------------------------------------
    // ** NO HEADER PRESENT **
    // -----------------------------------------------------------------------------------
    logger.log('warn', '** no Authorization header present')
    logger.log('warn', `** rejected request with 401`)
    return res.status(401).json({
      errors: [{
        location: 'header',
        param: 'Authorization',
        msg: 'missing or invalid'
      }]
    })
  }
}
