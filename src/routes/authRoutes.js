'use strict'

const express = require('express')
const router = express.Router()
const { body, query, validationResult } = require('express-validator/check')
const logger = require('../lib/logger')
const { authenticate } = require('../controllers/authController')

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
  authenticate(req, res)
})

module.exports = router
