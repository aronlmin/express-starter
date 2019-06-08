'use strict'

const app = require('../../src/index')
const chai = require('chai')
const { expect } = require('chai')
const chaiHttp = require('chai-http')
const mockUser = require('../mocks/mockUser')
const mongoose = require('mongoose')
const User = mongoose.model('User')

chai.use(chaiHttp)
chai.should()

after(async () => {
  app.stop()
})

describe('Authentication Route', () => {
  it('creates a user', done => {
    chai.request(app)
      .post('/register')
      .set('content-type', 'application/json')
      .send(mockUser)
      .end((err, res) => {
        if (err) {}
        res.should.have.status(200)
        done()
      })
  })

  it('rejects invalid email format', done => {
    chai.request(app)
      .post('/auth')
      .set('content-type', 'application/json')
      .send({
        email: mockUser.email.replace('@', ''),
        password: mockUser.password
      })
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        expect(res.body.errors).to.be.an.instanceof(Array)
        let msg = res.body.errors[0]
        expect(msg.location).to.equal('body')
        expect(msg.value).to.equal(mockUser.email.replace('@', ''))
        expect(msg.msg).to.equal('invalid email format')
        done()
      })
  })
  it('rejects invalid password', done => {
    chai.request(app)
      .post('/auth')
      .set('content-type', 'application/json')
      .send({
        email: mockUser.email,
        password: 'madeUpPassWord'
      })
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        expect(res.body.errors).to.be.an.instanceof(Array)
        let msg = res.body.errors[0]
        expect(msg.location).to.equal('body')
        expect(msg.param).to.equal('email/password')
        expect(msg.msg).to.equal('invalid')
        done()
      })
  })

  it('authenticates a user', done => {
    chai.request(app)
      .post('/auth')
      .set('content-type', 'application/json')
      .send({
        email: mockUser.email,
        password: mockUser.password
      })
      .end((err, res) => {
        if (err) {}
        res.should.have.status(200)
        expect(res.body.status).to.equal('OK')
        expect(res.body.recordCount).to.equal(1)
        expect(res.body.startTimestamp).to.not.equal(undefined)
        expect(res.body.endTimestamp).to.not.equal(undefined)
        expect(res.body.timeTaken).to.be.above(0)
        expect(res.body.data).to.be.an.instanceof(Array)
        User.findOne({ email: mockUser.email })
          .then(user => {
            user.remove()
            done()
          })
      })
  })
})
