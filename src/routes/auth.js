const express = require('express')
const router = express.Router()

router.post('/', [], (req, res) => {
  res.send({
    email: req.body.email,
    password: req.body.password,
    zoom: req.body.zoom
  })
})

module.exports = router
