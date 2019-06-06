'use strict'

const app = require('../../../src/index')
const chai = require('chai')
const chaiHttp = require('chai-http')

chai.use(chaiHttp)
chai.should()

after(async () => {
  app.stop()
})

describe('/register', () => {
  it('POST /register should return a 422 response', (done) => {
    chai.request(app)
      .post('/register', {
        email: 'random@email',
        password: null
      })
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        done()
      })
  })
})
