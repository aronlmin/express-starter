'use strict'

require('../../src/models')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const moment = require('moment')
const { expect, assert } = require('chai')
const bcrypt = require('bcryptjs')

describe('unit tests the User model', () => {
  it('creates a new user, confirms the shape, and deletes the user', done => {
    let salt = bcrypt.genSaltSync(10)
    let password = 'testPassword'
    let params = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@user.com',
      passwordHash: bcrypt.hashSync(password, salt),
      lastActivity: moment().toDate()
    }

    new User(params).save()
      .then((user) => {
        // validates user
        expect(user.firstName).to.equal(params.firstName)
        expect(user.lastName).to.equal(params.lastName)
        expect(user.email).to.equal(params.email)
        bcrypt.compare(password, user.passwordHash)
          .then(passed => {
            expect(passed).to.equal(true)
          })
        expect(user.active).to.equal(true)
        expect(user.lastActivity).to.not.equal(null)
        expect(user.lastLogin).to.equal(null)
        expect(user.lockout).to.equal(false)
        expect(user.failedLogins).to.equal(0)
        expect(user.lockoutUntil).to.equal(null)
        expect(user.createdAt).to.not.equal(null)
        expect(user.updatedAt).to.not.equal(null)

        // validate entity
        let entity = user.entity(user, 'lockoutData')
        expect(entity._embeds).to.not.equal(undefined)
        expect(entity._embeds).to.not.equal({})
        expect(entity._embeds.lockoutData.failedLogins).to.equal(0)
        expect(entity._embeds.lockoutData.lockout).to.equal(false)
        expect(entity._embeds.lockoutData.lockoutUntil).to.equal(null)// DEBUG

        done()
      })
  })
  it('validates zoom method', done => {
    User.findOne({ active: true })
      .then(user => {
        let zoom = user.zoom(user, 'lockoutData')
        expect(zoom.lockoutData).to.be.an.instanceof(Object)
        expect(zoom.lockoutData.failedLogins).to.be.gte(0)
        assert.isBoolean(zoom.lockoutData.lockout)
        expect(zoom.lockoutData).to.have.a.property('lockoutUntil')
        done()
      })
  })
  it('deletes the user', done => {
    User.findOne({ email: 'test@user.com' })
      .then(user => {
        user.remove()
          .then(() => {
            done()
          })
      })
  })
})
