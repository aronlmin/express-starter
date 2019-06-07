'use strict'

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "firstName can't be blank"],
    minlength: [2, 'firstName must be at least 2 characters'],
    maxlength: [30, 'firstName must be less than 30 characters'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, "lastName can't be blank"],
    minlength: [2, 'lastName must be at least 2 characters'],
    maxlength: [30, 'lastName must be less than 30 characters'],
    trim: true
  },
  email: {
    type: String,
    index: true,
    required: [true, "email can't be blank"],
    unique: [true, 'email is already taken'],
    maxlength: [130, 'email must be less than 130 characters'],
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, "password can't be blank"]
  },
  active: { type: Boolean, default: true },
  lastActivity: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  lockout: { type: Boolean, default: false },
  failedLogins: { type: Number, default: 0 },
  lockoutUntil: { type: Date, default: null }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
})

UserSchema.methods.entity = function (self, zoom = '') {
  return {
    id: self._id,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    active: this.active,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: `${this.firstName} ${this.lastName}`.trim(),
    _embeds: this.zoom(this, zoom)
  }
}

UserSchema.methods.zoom = function (self, zoom = '') {
  let embeds = {}
  if (zoom) {
    zoom.split(',').forEach(function (embed) {
      switch (embed) {
        case 'lockoutData':
          embeds.lockoutData = {
            failedLogins: self.failedLogins,
            lockout: self.lockout,
            lockoutUntil: self.lockoutUntil
          }
          break
      }
    })
  }
  return embeds
}

UserSchema.plugin(mongoosePaginate)
mongoose.model('User', UserSchema)
