const mongoose = require('mongoose')
const { parseCursorStr } = require('../lib/utils')

const Comment = mongoose.model('comment')
const commentSchema = Comment.schema

describe('utils#parseCursorStr', () => {
   it('Works with simple cursor string', () => {
      const cursorStr = Buffer.from('_id=1').toString('base64')
      const cursorObj = parseCursorStr(cursorStr, commentSchema)
      expect(cursorObj).toEqual({ _id: '1' })
   })

   it('Works with cursor string with multiple properties', () => {
      const plainStr = '_id=123&name=Jane%20D\'Souza%20%26%20Co.&timestamp=1550169401498'
      const cursorStr = Buffer.from(plainStr).toString('base64')
      const cursorObj = parseCursorStr(cursorStr, commentSchema)
      expect(cursorObj).toEqual({ _id: '123', name: 'Jane D\'Souza & Co.', timestamp: '1550169401498' })
   })

   it('Is able to hydate Dates automatically', () => {
      const cursorStr = Buffer.from('date=1352073600000').toString('base64')
      const cursorObj = parseCursorStr(cursorStr, commentSchema)
      expect(cursorObj).toEqual({ date: new Date(Date.UTC(2012, 10, 5)) })
   })
})
