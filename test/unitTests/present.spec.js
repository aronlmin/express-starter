const moment = require('moment')
const present = require('../../src/lib/present')

describe('unit test the present lib method', () => {
  it('should return the expected shape', (done) => {
    const shape = present({
      resource: 'empty_array',
      startTimestamp: moment().toDate(),
      data: []
    })
    shape.should.have.own.property('status')
    shape.should.have.own.property('recordCount')
    shape.should.have.own.property('startTimestamp')
    shape.should.have.own.property('endTimestamp')
    shape.should.have.own.property('timeTaken')
    shape.should.have.own.property('data')
    done()
  })
})
