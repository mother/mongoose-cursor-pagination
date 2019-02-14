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
      expect(pageInfo.hasNext).toBe(true)

      const { results: results2, pageInfo: pageInfo2 } = await Comment
         .find({})
         .limit(1)
         .sort('-date')
         .paginate(pageInfo.nextCursor)
         .exec()

      expect(results2).toHaveLength(1)
      expect(results2[0].body).toBe('1')
      expect(pageInfo2.hasNext).toEqual(false)
   })

   // it('Works with search', async () => {
   //    await Comment.create([
   //       {
   //          body: 'one',
   //          'author.firstName': 'Bane',
   //          'author.lastName': 'Doe'
   //       },
   //       {
   //          body: 'two',
   //          'author.firstName': 'Jane',
   //          'author.lastName': 'Doe'
   //       }
   //    ])
   //
   //    const { results, pageInfo } = await Comment
   //       .find({ $text: { $search: 'Doe one' } })
   //       .select({ chore: { $meta: 'textScore' } })
   //       .sort({ chore: { $meta: 'textScore' } })
   //       // .sort('-date')
   //       .limit(1)
   //       .paginate()
   //       .exec()
   //
   //    console.log('search tests', results, pageInfo)
   //    expect(results).toHaveLength(1)
   //    expect(results[0].body).toBe('one')
   //    expect(pageInfo.hasNext).toEqual(true)
   // })
})
