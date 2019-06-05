'use strict'

const express = require('express')
const router = express.Router()
const { body, query, validationResult } = require('express-validator/check')
const logger = require('../lib/logger')

const { register } = require('../controllers/registerController')

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
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.log('warn', `** failed registration with validation errors`)
    logger.log('warn', `** error ${JSON.stringify(errors.array({ onlyFirstError: true }))}`)
    logger.log('warn', `** rejected request with 422`)
    return res.status(422).json({ errors: errors.array({ onlyFirstError: true }) })
  }

  register(req, res)
})

module.exports = router
