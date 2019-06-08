'use strict'

const app = require('../../src/index')
const chai = require('chai')
const chaiHttp = require('chai-http')

// Configure chai
chai.use(chaiHttp)
chai.should()

after(async () => {
  app.stop()
})

describe('Root Route', () => {
  it('GET / should return a 200 response', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        if (err) {}
        res.should.have.status(200)
        done()
      })
  })
})
