const querystring = require('querystring')

// TODO: HANDLE SEARCH
// TODO: DETECT ANOMOLY BETWEEN SORT AND CURSOR

// TODO: Test Scenarios
// Sort Keys { name: 1, _id: 1 }
// Cursor Obj { name: 'Blackbook', _id: '5b06b90b42a0b29ba10f20c2' }
//
// [
//    { name: { $gte: cursorObj.name } },
//    {
//       name: cursorObj.name,
//       _id: { $gte: cursorObj._id }
//    }
// ]
//
//
// Sort Keys { name: 1, date: 1, _id: 1 }
// Cursor Obj { name: 'Blackbook', date: 12, _id: '5b06b90b42a0b29ba10f20c2' }
//
// [
//    {
//       name: { $gte: cursorObj.name }
//    },
//    {
//       name: cursorObj.name,
//       date: { $gte: cursorObj.date }
//    },
//    {
//       name: cursorObj.name,
//       date: cursorObj.date,
//       _id: { $gte: cursorObj._id }
//    }
// ]

module.exports = (schema, fieldMeta = {}) => {
   // We generate a base64-encoded query string
   const generateCursor = (cursorData) => {
      const cursorPlainText = Object.keys(cursorData).map((cursorKey) => {
         const escapedCursorKey = querystring.escape(cursorKey)
         const transformedCursorValue = typeof fieldMeta[cursorKey] === 'object'
            ? fieldMeta[cursorKey].toCursor(cursorData[cursorKey])
            : cursorData[cursorKey]

         return `${escapedCursorKey}=${querystring.escape(transformedCursorValue)}`
      }).join('&')

      return Buffer.from(cursorPlainText).toString('base64')
   }

   const parseCursor = (cursor) => {
      const cursorPlainText = Buffer.from(cursor, 'base64').toString()
      const cursorObj = querystring.parse(cursorPlainText)

      Object.keys(cursorObj).forEach((cursorKey) => {
         if (typeof fieldMeta[cursorKey] === 'object') {
            cursorObj[cursorKey] = fieldMeta[cursorKey].fromCursor(cursorObj[cursorKey])
         }
      })

      return cursorObj
   }

   // Query Helper
   schema.query.paginate = function (start) {
      this.__paginationPlugin = { start }

      const _exec = this.exec
      this.exec = async function (...args) {
         const query = this
         const results = await _exec.call(this, ...args)

         const { limit, sort } = query.options
         const origLimit = limit - 1
         const hasNext = results.length > origLimit

         let nextCursor = null
         if (hasNext) {
            const nextResult = results.pop()
            const nextCursorObj = Object.keys(sort).reduce((result, sortKey) => {
               result[sortKey] = nextResult.get(sortKey) // TODO: Won't work if using .lean
               return result
            }, {})

            nextCursor = generateCursor(nextCursorObj)
         }

         // console.log('==== RESULT CURSOR =====\n', { hasNext, nextCursor })
         return {
            results,
            pageInfo: { hasNext, nextCursor }
         }
      }

      return this
   }

   // TODO: Ensure correct operation
   // TODO: Needs to know limit
   schema.pre('find', function () {
      const query = this
      if (typeof query.__paginationPlugin === 'object') {
         // Increase limit by 1
         const { limit, sort = {} } = query.options
         if (limit) {
            query.setOptions({ limit: limit + 1 })
         }

         // Ensure there is a sort key - default is _id
         if (Object.keys(sort).length === 0) {
            query.sort('_id')
         }

         // If _id is not already part of the sort key, add it
         // to ensure unique cursors
         if (!Object.keys(sort).includes('_id')) {
            sort._id = 1
         }

         // Start Cursor
         const { start } = query.__paginationPlugin
         if (typeof start !== 'undefined') {
            const cursorObj = parseCursor(start)
            const cursorKeys = Object.keys(cursorObj)
            const cursorConditions = new Array(cursorKeys.length)

            // TODO: MODULARIZE AND TEST
            for (let i = 0; i < cursorKeys.length; i += 1) {
               const comparisonOperator = sort[cursorKeys[i]] === -1
                  ? '$lte'
                  : '$gte'

               cursorConditions[i] = {}
               cursorConditions[i][cursorKeys[i]] = {
                  [comparisonOperator]: cursorObj[cursorKeys[i]]
               }
            }

            for (let j = 1; j < cursorKeys.length; j += 1) {
               cursorConditions[j][cursorKeys[j - 1]] = cursorObj[cursorKeys[j - 1]]
            }

            // Apply the cursor conditions
            // This gets tricky if the sort key has more than one field,
            // and more so if there's already $or/$and conditions
            // in the query.
            // TODO: TEST MODULARILY
            if (cursorConditions.length === 1) {
               query.where(cursorConditions[0])
            } else if (cursorConditions.length > 1) {
               const queryConditions = query.getQuery()
               if (Array.isArray(queryConditions.$or)) {
                  if (Array.isArray(queryConditions.$and)) {
                     queryConditions.$and.push({ $or: queryConditions.$or })
                     queryConditions.$and.push({ $or: cursorConditions })
                  } else {
                     query.where({
                        $and: [
                           { $or: queryConditions.$or },
                           { $or: cursorConditions }
                        ]
                     })
                  }
               } else {
                  query.where({ $or: cursorConditions })
               }
            }

            // console.log('FIND QUERY', require('util').inspect(query.getQuery(), null, null))
         }
      }
   })
}
