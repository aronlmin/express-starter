const express = require('express')
const router = express.Router()
const present = require('../lib/present')
const { body, query, validationResult } = require('express-validator/check')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const moment = require('moment')
const _ = require('lodash')

router.post('/', [
  body('firstName')
    .exists().withMessage('field is required')
    .isString().withMessage('must be a String')
    .isLength({ min: 2 }).withMessage('must be a minimum of 2 characters')
    .isLength({ max: 30 }).withMessage('must be a maximum of 30 characters'),
  body('lastName')
    .exists().withMessage('field is required')
    .isString().withMessage('must be a String')
    .isLength({ min: 2 }).withMessage('must be a minimum of 2 characters')
    .isLength({ max: 30 }).withMessage('must be a maximum of 30 characters'),
  body('email')
    .exists().withMessage('field is required')
    .isString().withMessage('must be a String')
    .isLength({ max: 130 }).withMessage('must be a maximum of 130 characters')
    .isEmail().withMessage('invalid email format'),
  body('password')
    .exists().withMessage('field is required')
    .isString().withMessage('must be a String')
    .isLength({ min: 8 }).withMessage('must be a minimum of 8 characters')
    .isLength({ max: 130 }).withMessage('must be a maximum of 130 characters'),
  query('zoom')
    .optional()
    .isString()
], (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array({ onlyFirstError: true }) })
  }

  let { firstName, lastName, email, password } = req.body
  let { zoom } = req.query
  // -------------------------------------------------------------------------------------
  // further validation for values
  // -------------------------------------------------------------------------------------
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
    return res.status(422).json({ errors: preModelErrors })
  }

  // -------------------------------------------------------------------------------------
  // save the user the database
  // -------------------------------------------------------------------------------------
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
      // ---------------------------------------------------------------------------------
      // send registration confirmation email
      // ---------------------------------------------------------------------------------
      console.log('send registration confirmation email')
      // ---------------------------------------------------------------------------------
      // send the json response
      // ---------------------------------------------------------------------------------
      res.send(
        present({
          resource: 'users',
          data: [user.entity(user, zoom)]
        }, req)
      )
    })
    .catch(error => {
      if (error.name === 'ValidationError') {
        return res.status(422).json(error)
      } else if (error.name === 'MongoError' && error.code === 11000) {
        return res.status(422).json({
          errors: [{
            location: 'body',
            param: 'email',
            msg: 'email is already taken'
          }]
        })
      } else {
        return res.status(500).json(error)
      }
    })
})

module.exports = router
