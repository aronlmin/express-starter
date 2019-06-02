'use strict'

const moment = require('moment')
// ---------------------------------------------------------------------------------------
// follow the RESTED NARWHL API pattern
// https://www.narwhl.com/resource-specific-responses
// ---------------------------------------------------------------------------------------
module.exports = (payload, req) => {
  let data = []
  if (payload.token) data.push({ token: payload.token })
  data.push({ [payload.resource]: payload.data })
  return {
    status: 'OK',
    recordCount: payload.data.length,
    startTimestamp: req.start.toDate(),
    endTimestamp: moment().toDate(),
    timeTaken: moment().toDate().getTime() - req.start.toDate().getTime(),
    data: data
  }
}
