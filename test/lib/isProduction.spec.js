'use strict'

const isProduction = require('../../src/lib/isProduction')

describe('unit test the isProduction lib method', () => {
  it('should correctly determine if we are in production or not', (done) => {
    isProduction.should.equal(process.env.NODE_ENV === 'production')
    done()
  })
})
