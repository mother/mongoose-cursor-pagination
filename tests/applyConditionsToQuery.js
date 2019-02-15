const mongoose = require('mongoose')
const { applyConditionsToQuery } = require('../lib/utils')

const Comment = mongoose.model('comment')

const singleKeyCursorCondition = [{
   _id: { $lt: '5b06b90b42a0b29ba10f20c2' }
}]

const multiKeyCursorConditions = [
   { 'author.lastName': { $gt: 'Doe' } },
   {
      'author.lastName': 'Doe',
      _id: { $lt: '5b06b90b42a0b29ba10f20c2' }
   }
]

describe('utils#applyConditionsToQuery', () => {
   it('Works with single cursor keys', () => {
      let query = Comment.find({ body: 'Test' })
      query = applyConditionsToQuery(singleKeyCursorCondition, query)
      expect(query.getQuery()).toMatchSnapshot()
   })

   it('Works with multiple cursor keys with no other $or query conditions', () => {
      let query = Comment.find({ body: 'Test' })
      query = applyConditionsToQuery(multiKeyCursorConditions, query)
      expect(query.getQuery()).toMatchSnapshot()
   })

   it('Works with multiple cursor keys when there is an $or condition in the query', async () => {
      let query = Comment.find({
         $or: [
            { body: 'Test' },
            { 'author.firstName': 'Oreo' }
         ]
      })

      query = applyConditionsToQuery(multiKeyCursorConditions, query)
      expect(query.getQuery()).toMatchSnapshot()
      await query.exec()
   })

   it('Works with multiple cursor keys when there is an $or and $and condition in the query', async () => {
      let query = Comment.find({
         $and: [
            { body: 'body is in an and' },
            { 'author.firstName': 'Andy' }
         ],
         $or: [
            { body: 'body is in an or' },
            { 'author.firstName': 'Oreo' }
         ]
      })

      query = applyConditionsToQuery(multiKeyCursorConditions, query)
      expect(query.getQuery()).toMatchSnapshot()
      await query.exec()
   })
})
