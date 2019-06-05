'use strict'

const express = require('express')
const router = express.Router()
const { body, query, validationResult } = require('express-validator/check')
const { authenticate } = require('../controllers/authController')
const raiseParamErrors = require('../lib/raiseParamErrors')

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
  if (!errors.isEmpty()) raiseParamErrors(res, errors)
  authenticate(req, res)
})

module.exports = router
