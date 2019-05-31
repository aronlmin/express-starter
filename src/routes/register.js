const express = require('express')
const router = express.Router()
const present = require('../lib/present')
const { check, validationResult } = require('express-validator/check')

router.post('/', [
  check('firstName').isLength({ min: 2 }),
  check('lastName').isLength({ min: 2 }),
  check('email').isEmail(),
  check('password').isLength({ min: 8 })
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  res.send(
    present({
      resource: 'users',
      data: [{
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        zoom: req.body.zoom
      }]
    }, req)
  )
})

module.exports = router
