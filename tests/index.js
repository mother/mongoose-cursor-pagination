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

   it('Doesn\'t interfere with search (for now)', async () => {
      await Comment.create([
         {
            body: 'one',
            'author.firstName': 'Bane',
            'author.lastName': 'Doe'
         },
         {
            body: 'two',
            'author.firstName': 'Jane',
            'author.lastName': 'Doe'
         }
      ])

      const { results, pageInfo } = await Comment
         .find({ $text: { $search: 'Doe one' } })
         .select({ score: { $meta: 'textScore' } })
         .sort({ score: { $meta: 'textScore' } })
         .limit(1)
         .paginate('dont matter')
         .exec()

      expect(results).toHaveLength(1)
      expect(results[0].body).toBe('one')
      expect(pageInfo).toEqual({ hasNext: null, nextCursor: null })
   })

   it('Applies a default limit', async () => {
      const query = Comment
         .find({})
         .sort('-date')
         .paginate()

      const { exec } = query
      const mockExec = async function (...args) {
         await exec.call(this, ...args)
         return this.options.limit
      }

      query.exec = mockExec.bind(query)
      const limit = await query.exec()
      expect(limit).toBe(101)
   })

   it('Applies a default sort', async () => {
      const query = Comment
         .find({})
         .limit(5)
         .paginate()

      const { exec } = query
      const mockExec = async function (...args) {
         await exec.call(this, ...args)
         return this.options.sort
      }

      query.exec = mockExec.bind(query)
      const sort = await query.exec()
      expect(sort).toEqual({ _id: 1 })
   })

   it('Adds _id to sort options if not already specified ', async () => {
      const query = Comment
         .find({})
         .limit(5)
         .sort({ date: -1 })
         .paginate()

      const { exec } = query
      const mockExec = async function (...args) {
         await exec.call(this, ...args)
         return this.options.sort
      }

      query.exec = mockExec.bind(query)
      const sort = await query.exec()
      expect(sort).toEqual({ date: -1, _id: 1 })
   })
})
