'use strict'

const router = require('express').Router()

router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

router.get('/', (req, res) => {
  res.send(
    JSON.stringify({
      root: {
        api_name: 'backend'
      }
    })
  )
})

router.use('/register', require('./registerRoutes'))
router.use('/auth', require('./authRoutes'))

router.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce((errors, key) => {
        errors[key] = err.errors[key].message
        return errors
      }, {})
    })
  }
  return next(err)
})

module.exports = router
