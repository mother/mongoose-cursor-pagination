const { default: MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

require('./models')

let mongoServer

beforeAll(async () => {
   mongoServer = new MongoMemoryServer()
   const mongoUri = await mongoServer.getConnectionString()
   await mongoose.connect(mongoUri)
})

afterAll(() => {
   mongoose.disconnect()
   mongoServer.stop()
})

// Empty the database before each test
beforeEach(async () => {
   await Promise.all(
      Object.values(mongoose.connection.collections).map(collection => (
         new Promise((resolve, reject) => {
            collection.remove((err) => {
               if (err) return reject(err)
               resolve()
            })
         })
      ))
   )
})
