'use strict'

const logger = require('../logger')
const moment = require('moment')

// ---------------------------------------------------------------------------------------
// follow the RESTED NARWHL API pattern
// https://www.narwhl.com/resource-specific-responses
// ---------------------------------------------------------------------------------------
module.exports = (payload) => {
  let data = []
  if (payload.token) data.push({ token: payload.token })
  data.push({ [payload.resource]: payload.data })
  logger.log('info', `[presentLib] ** successfully delivered response`)
  return {
    status: 'OK',
    recordCount: payload.data.length,
    startTimestamp: payload.startTimestamp,
    endTimestamp: moment().toDate(),
    timeTaken: moment().toDate().getTime() - payload.startTimestamp.getTime(),
    data: data
  }
}
