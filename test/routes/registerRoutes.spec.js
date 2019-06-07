'use strict'

const app = require('../../src/index')
const chai = require('chai')
const { expect } = require('chai')
const chaiHttp = require('chai-http')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const mockUser = require('../mocks/mockUser')

chai.use(chaiHttp)
chai.should()

after(async () => {
  app.stop()
})

describe('/register', () => {
  let params = mockUser

  it('should create a new user', done => {
    chai.request(app)
      .post('/register')
      .set('content-type', 'application/json')
      .send(params)
      .end((err, res) => {
        if (err) {}
        res.should.have.status(200)
        expect(res.body.status).to.equal('OK')
        expect(res.body.recordCount).to.equal(1)
        done()
      })
  })
  it('POST /register should prevent duplicate emails', done => {
    chai.request(app)
      .post('/register')
      .set(params)
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        done()
      })
  })
  it('should delete the created user', done => {
    User.findOne({ email: params.email })
      .then(user => {
        user.remove()
        done()
      })
  })
})
