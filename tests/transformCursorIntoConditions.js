const { transformCursorIntoConditions } = require('../lib/utils')

describe('utils#transformCursorIntoConditions', () => {
   it('Works with 1 key', () => {
      const sortObj = { _id: -1 }
      const cursorObj = { _id: '5b06b90b42a0b29ba10f20c2' }
      const conditions = transformCursorIntoConditions({ cursorObj, sortObj })

      expect(conditions).toEqual([
         { _id: { $lt: '5b06b90b42a0b29ba10f20c2' } }
      ])
   })

   it('Works with 2 keys', () => {
      const sortObj = { name: 1, _id: -1 }
      const cursorObj = { name: 'Jane Doe', _id: '5b06b90b42a0b29ba10f20c2' }
      const conditions = transformCursorIntoConditions({ cursorObj, sortObj })

      expect(conditions).toEqual([
         { name: { $gt: 'Jane Doe' } },
         {
            name: 'Jane Doe',
            _id: { $lt: '5b06b90b42a0b29ba10f20c2' }
         }
      ])
   })

   it('Works with 3 keys', () => {
      const sortObj = { timestamp: -1, name: 1, _id: -1 }
      const cursorObj = {
         timestamp: 1550169401498,
         name: 'Jane Doe',
         _id: '5b06b90b42a0b29ba10f20c2'
      }

      const conditions = transformCursorIntoConditions({ cursorObj, sortObj })
      expect(conditions).toEqual([
         { timestamp: { $lt: 1550169401498 } },
         {
            timestamp: 1550169401498,
            name: { $gt: 'Jane Doe' }
         },
         {
            timestamp: 1550169401498,
            name: 'Jane Doe',
            _id: { $lt: '5b06b90b42a0b29ba10f20c2' }
         }
      ])
   })

   // TODO: HANDLE EVILNESS
   // it('Protects against injection', () => {
   //    const sortObj = { timestamp: -1, name: 1, _id: -1 }
   //    const cursorObj = {
   //       $where: { evil: true },
   //       name: 'Jane Doe',
   //       _id: '5b06b90b42a0b29ba10f20c2'
   //    }
   //
   //    const conditions = transformCursorIntoConditions({ cursorObj, sortObj })
   //    console.log(conditions)
   // })
})
