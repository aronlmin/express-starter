'use strict'

const logger = require('../logger')
const presentObject = require('./present')

// ---------------------------------------------------------------------------------------
// follow the RESTED NARWHL API pattern
// https://www.narwhl.com/resource-specific-responses
// ---------------------------------------------------------------------------------------
module.exports = (req, res, payload) => {
  try {
    payload.startTimestamp = req.start.toDate()
    res.send(presentObject(payload))
  } catch (error) {
    logger.log('fatal', `[authController] ** present method error`)
    logger.log('fatal', `[authController] ** error ${JSON.stringify(error)}`)
    logger.log('fatal', `[authController] ** rejected request with 500`)
    return res.status(500).json({
      errors: [{
        location: 'n/a',
        param: 'n/a',
        msg: 'something happened when generating the response'
      }]
    })
  }
}
