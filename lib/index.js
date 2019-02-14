const { generateCursorStr, parseCursorStr, transformCursorIntoConditions } = require('./utils')

// TODO: DETECT ANOMOLY BETWEEN SORT AND CURSOR

module.exports = (schema) => {
   // Custom query .exec that wraps the results in an object,
   // determines the pagination data, and returns the wrapped
   // object.
   const newExec = async function (_origExec, ...args) {
      const query = this
      const results = await _origExec.call(this, ...args)

      // Currently this plugin doesn't handle full-text search pagination
      if (query.__paginationPlugin.isFullTextSearchQuery) {
         return {
            results,
            pageInfo: { hasNext: null, nextCursor: null }
         }
      }

      const { limit, sort } = query.options
      const origLimit = limit - 1
      const hasNext = results.length > origLimit

      let nextCursor = null
      if (hasNext) {
         results.pop()
         const lastResult = results[results.length - 1]
         const nextCursorObj = Object.keys(sort).reduce((result, sortKey) => {
            result[sortKey] = lastResult.get(sortKey) // TODO: Won't work if using .lean
            return result
         }, {})

         nextCursor = generateCursorStr(nextCursorObj)
      }

      return {
         results,
         pageInfo: { hasNext, nextCursor }
      }
   }

   // Query Helper
   schema.query.paginate = function (start) {
      const query = this
      if (query.op !== 'find') {
         throw new Error('Cannot paginate on any operations other than find')
      }

      query.__paginationPlugin = { start }

      // Replace the .exec fn with our custom exec
      const origExec = query.exec
      query.exec = newExec.bind(query, origExec)
      return query
   }

   // TODO: Ensure correct operation
   // TODO: Needs to know limit
   schema.pre('find', function () {
      const query = this
      if (typeof query.__paginationPlugin === 'object') {
         const { limit, sort = {} } = query.options

         // Check if one of our cursor fields corresponds to a text-search score
         // This plugin doesn't current handle search
         if (Object.prototype.hasOwnProperty.call(query.getQuery(), '$text')) {
            query.__paginationPlugin.isFullTextSearchQuery = true
            return
         }

         // Increase limit by 1
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
            const cursorObj = parseCursorStr(start, schema)
            const cursorConditions = transformCursorIntoConditions({ cursorObj, sortObj: sort })

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

            // console.log('QUERY', require('util').inspect(query.getQuery(), null, null))
         }
      }
   })
}
