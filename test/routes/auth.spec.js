const app = require('../../src/index')
const chai = require('chai')
const chaiHttp = require('chai-http')

chai.use(chaiHttp)
chai.should()

after(async () => {
  app.stop()
})

describe('/auth', () => {
  it('POST /auth should return a 422 response', (done) => {
    chai.request(app)
      .post('/auth', {
        email: 'random@email',
        password: 'test'
      })
      .end((err, res) => {
        if (err) {}
        res.should.have.status(422)
        done()
      })
  })
})
