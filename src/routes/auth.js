const express = require('express')
const router = express.Router()
const present = require('../lib/present')
const { body, query, validationResult } = require('express-validator/check')
const jwt = require('jsonwebtoken')

router.post('/', [
  body('email')
    .exists()
    .isString()
    .isEmail(),
  body('password')
    .exists()
    .isString()
    .isLength({ min: 8 }),
  query('zoom')
    .optional()
    .isString()
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.error(errors)
    return res.status(422).json({ errors: errors.array() })
  }

  const token = jwt.sign({ email: req.body.email }, 'shhhhh')

  res.send(
    present({
      resource: 'users',
      data: [{
        email: req.body.email,
        // password: req.body.password,
        zoom: req.query.zoom,
        token: token
      }]
    }, req)
  )
})

module.exports = router
