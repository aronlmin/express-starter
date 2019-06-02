'use strict'

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

const myFormat = printf(({ level, message, label, timestamp }) => {
  let padding = ''
  if (['info', 'warn'].includes(level)) padding += ' '
  return `[${timestamp}] ${level.toUpperCase()}${padding} - ${label} - ${JSON.stringify(message)}`
})

const logger = createLogger({
  format: combine(
    label({ label: process.env.DBNAME }),
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.Console({ level: 'debug' }),
    new transports.File({ level: 'debug', filename: './src/log/debug.log' })
  ]
})

module.exports = logger
