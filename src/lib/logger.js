'use strict'

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

const myFormat = printf(({ level, message, label, timestamp }) => {
  let padding = ''
  if (['info', 'warn'].includes(level)) padding += ' '
  return `[${timestamp}] ${level.toUpperCase()}${padding} - ${label} - ${JSON.stringify(message)}`
})

let level = 'debug'
let silent = false
switch (process.env.NODE_ENV) {
  case 'production':
    level = 'warn'
    silent = false
    break
  case 'test':
    level = 'error'
    silent = true
    break
  default:
    level = 'debug'
    silent = false
    break
}

const logger = createLogger({
  format: combine(
    label({ label: process.env.DBNAME }),
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.Console({ silent: silent, level: level }),
    new transports.File({ silent: silent, level: level, filename: './src/log/debug.log' })
  ]
})

module.exports = logger
