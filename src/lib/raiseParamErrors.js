'use strict'

const logger = require('./logger')

module.exports = (res, errors) => {
  logger.log('warn', `[raiseParamErrorsLib] ** failed with validation errors`)
  logger.log('warn', `[raiseParamErrorsLib] ** error ${JSON.stringify(errors.array({ onlyFirstError: true }))}`)
  logger.log('warn', `[raiseParamErrorsLib] ** rejected request with 422`)
  return res.status(422)
    .json({
      errors: errors.array({
        onlyFirstError: true
      })
    })
}
