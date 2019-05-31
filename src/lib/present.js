module.exports = (payload, req) => {
  return {
    method: req.method,
    records: payload.data.length,
    [payload.resource]: payload.data
  }
}
