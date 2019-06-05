'use strict'

const logger = require('./logger')
const moment = require('moment')
// ---------------------------------------------------------------------------------------
// follow the RESTED NARWHL API pattern
// https://www.narwhl.com/resource-specific-responses
// ---------------------------------------------------------------------------------------
module.exports = (req, res, payload) => {
  try {
    let data = []
    if (payload.token) data.push({ token: payload.token })
    data.push({ [payload.resource]: payload.data })
    logger.log('info', `[presentLib] ** successfully delivered response`)
    res.send({
      status: 'OK',
      recordCount: payload.data.length,
      startTimestamp: req.start.toDate(),
      endTimestamp: moment().toDate(),
      timeTaken: moment().toDate().getTime() - req.start.toDate().getTime(),
      data: data
    })
  } catch (error) {
    logger.log('fatal', `[presentLib] ** present method error`)
    logger.log('fatal', `[presentLib] ** error ${JSON.stringify(error)}`)
    logger.log('fatal', `[presentLib] ** rejected request with 500`)
    return res.status(500).json({
      errors: [{
        location: 'n/a',
        param: 'n/a',
        msg: 'something happened when generating the response'
      }]
    })
  }
}
