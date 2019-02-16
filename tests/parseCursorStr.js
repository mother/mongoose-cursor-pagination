const base64url = require('base64-url')
const mongoose = require('mongoose')
const { parseCursorStr } = require('../lib/utils')

const Comment = mongoose.model('comment')
const commentSchema = Comment.schema

describe('utils#parseCursorStr', () => {
   it('Works with simple cursor string', () => {
      const cursorStr = base64url.encode('{"_id":1}')
      const cursorObj = parseCursorStr(cursorStr, commentSchema)
      expect(cursorObj).toEqual({ _id: 1 })
   })

   it('Works with cursor string with multiple properties', () => {
      const plainStr = '{"_id":"123","name":"Jane D\'Souza","timestamp":1550169401498,"a":null}'
      const cursorStr = base64url.encode(plainStr)
      const cursorObj = parseCursorStr(cursorStr, commentSchema)
      expect(cursorObj).toEqual({
         _id: '123',
         name: 'Jane D\'Souza',
         timestamp: 1550169401498,
         a: null
      })
   })

   it('Is able to hydate Dates automatically', () => {
      const cursorStr = base64url.encode('{"date":1352073600000}')
      const cursorObj = parseCursorStr(cursorStr, commentSchema)
      expect(cursorObj).toEqual({ date: new Date(Date.UTC(2012, 10, 5)) })
   })
})
