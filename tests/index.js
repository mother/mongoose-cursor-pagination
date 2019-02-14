const mongoose = require('mongoose')
const Comment = mongoose.model('comment')

describe('mongooseCursorPagination', () => {
   it('Works as expected', async () => {
      await Comment.create([
         {
            body: '1',
            'author.firstName': 'Jane',
            'author.lastName': 'Doe'
         },
         {
            body: '2',
            'author.firstName': 'Jane',
            'author.lastName': 'Doe'
         }
      ])

      const { results, pageInfo } = await Comment
         .find({})
         .limit(1)
         .sort('-date')
         .paginate()
         .exec()

      expect(results).toHaveLength(1)
      expect(results[0].body).toBe('2')
      expect(pageInfo.hasNext).toEqual(true)
   })
})
