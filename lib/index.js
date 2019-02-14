const { generateCursor, parseCursor, transformCursorIntoConditions } = require('./utils')

// TODO: DETECT ANOMOLY BETWEEN SORT AND CURSOR

module.exports = (schema, fieldTransformers = {}) => {

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

            nextCursor = generateCursor(nextCursorObj, fieldTransformers)
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
            const cursorObj = parseCursor(start, fieldTransformers)
            const cursorConditions = transformCursorIntoConditions({ cursorObj, query })

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
