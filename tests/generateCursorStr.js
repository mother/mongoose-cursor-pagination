const mongoose = require('mongoose')
const { generateCursorStr } = require('../lib/utils')

describe('utils#generateCursorStr', () => {
   it('Works with simple cursor data', () => {
      const cursorObj = { _id: 1 }
      const cursorStr = generateCursorStr(cursorObj, {})
      expect(cursorStr).toBe(Buffer.from('{"_id":1}').toString('base64'))
   })

   it('Works with cursor data with multiple properties', () => {
      const cursorObj = { _id: '123', name: 'Jane D\'Souza & Co.', timestamp: 1550169401498 }
      const cursorStr = generateCursorStr(cursorObj, {})
      const str = '{"_id":"123","name":"Jane D\'Souza & Co.","timestamp":1550169401498}'
      expect(cursorStr).toBe(Buffer.from(str).toString('base64'))
   })

   it('Is able to serialize Object Ids as strings', () => {
      const cursorObj = { _id: mongoose.Types.ObjectId('5b06b90b42a0b29ba10f20c2') }
      const cursorStr = generateCursorStr(cursorObj, {})
      expect(cursorStr).toBe(Buffer.from('{"_id":"5b06b90b42a0b29ba10f20c2"}').toString('base64'))
   })

   it('Is able to serialize Dates', () => {
      const cursorObj = { date: new Date(Date.UTC(2012, 10, 5)) }
      const cursorStr = generateCursorStr(cursorObj, {})
      expect(cursorStr).toBe(Buffer.from('{"date":1352073600000}').toString('base64'))
   })

   it('Does not fail with null or undefined values', () => {
      const cursorObj = { _id: '123', name: null, date: undefined }
      const cursorStr = generateCursorStr(cursorObj, {})
      expect(cursorStr).toBe(Buffer.from('{"_id":"123","name":null}').toString('base64'))
   })
})
