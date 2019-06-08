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

describe('Registration Route', () => {
  it('create a new user', done => {
    chai.request(app)
      .post('/register?zoom=lockoutData')
      .set('content-type', 'application/json')
      .send(mockUser)
      .end((err, res) => {
        if (err) {}
        res.should.have.status(200)
        expect(res.body.status).to.equal('OK')
        expect(res.body.recordCount).to.equal(1)
        expect(res.body.startTimestamp).to.not.equal(undefined)
        expect(res.body.endTimestamp).to.not.equal(undefined)
        expect(res.body.timeTaken).to.be.above(0)
        expect(res.body.data).to.be.an.instanceof(Array)
        expect(res.body.data[0].users).to.be.an.instanceof(Array)
        expect(res.body.data[0].users[0]).to.be.an.instanceof(Object)
        let user = res.body.data[0].users[0]
        expect(user.id.length).to.equal(24)
        expect(user.createdAt).to.be.a('string')
        expect(user.updatedAt).to.be.a('string')
        expect(user.active).to.equal(true)
        expect(user.email).to.equal(mockUser.email)
        expect(user.firstName).to.equal(mockUser.firstName)
        expect(user.lastName).to.equal(mockUser.lastName)
        expect(user._embeds).to.be.an.instanceof(Object)
        let lockoutData = user._embeds.lockoutData
        expect(lockoutData.failedLogins).to.equal(0)
        expect(lockoutData.lockout).to.equal(false)
        expect(lockoutData.lockoutUntil).to.equal(null)
        done()
      })
  })
  it('prevent duplicate emails', done => {
    chai.request(app)
      .post('/register')
      .set('content-type', 'application/json')
      .send(mockUser)
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        expect(res.body.errors).to.be.an.instanceof(Array)
        expect(res.body.errors[0]).to.be.instanceof(Object)
        expect(res.body.errors[0].location).to.equal('body')
        expect(res.body.errors[0].param).to.equal('email')
        expect(res.body.errors[0].msg).to.equal('email is already taken')
        done()
      })
  })
  it('rejects invalid password length', done => {
    chai.request(app)
      .post('/register')
      .set('content-type', 'application/json')
      .send({
        firstName: 'reject',
        lastName: 'me',
        email: 'reject@me.com',
        password: '1234567'
      })
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        expect(res.body.errors).to.be.an.instanceof(Array)
        expect(res.body.errors[0]).to.be.instanceof(Object)
        expect(res.body.errors[0].location).to.equal('body')
        expect(res.body.errors[0].param).to.equal('password')
        expect(res.body.errors[0].value).to.equal('1234567')
        expect(res.body.errors[0].msg).to.equal('must be a minimum of 8 characters')
        done()
      })
  })
  it('rejects invalid password complexity', done => {
    chai.request(app)
      .post('/register')
      .set('content-type', 'application/json')
      .send({
        firstName: 'reject',
        lastName: 'me',
        email: 'reject@me.com',
        password: '12345678'
      })
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        expect(res.body.errors).to.be.an.instanceof(Array)
        expect(res.body.errors[0]).to.be.an.instanceof(Object)
        expect(res.body.errors[0].location).to.equal('body')
        expect(res.body.errors[0].param).to.equal('password')
        expect(res.body.errors[0].msg).to.equal('must contain an upper case letter')
        done()
      })
  })
  it('delete the created user', done => {
    User.findOne({ email: mockUser.email })
      .then(user => {
        user.remove()
        done()
      })
  })
})
