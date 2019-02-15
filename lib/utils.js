const querystring = require('querystring')

// We generate a base64-encoded query string
exports.generateCursorStr = (cursorData) => {
   const cursorPlainText = Object.keys(cursorData).map((cursorKey) => {
      const escapedCursorKey = querystring.escape(cursorKey)

      // This could be made more modular in the future if there
      // is a need to serialize other types.
      if (cursorData[cursorKey] instanceof Date) {
         cursorData[cursorKey] = cursorData[cursorKey].getTime()
      }

      return `${escapedCursorKey}=${querystring.escape(cursorData[cursorKey])}`
   }).join('&')

   return Buffer.from(cursorPlainText).toString('base64')
}

exports.parseCursorStr = (cursor, schema) => {
   const cursorPlainText = Buffer.from(cursor, 'base64').toString()
   const cursorObj = querystring.parse(cursorPlainText)

   Object.keys(cursorObj).forEach((cursorKey) => {
      // This could be made more modular in the future if there
      // is a need to hydrate other types.
      const schemaPath = schema.path(cursorKey)
      if (typeof schemaPath === 'object' && schemaPath.instance === 'Date') {
         cursorObj[cursorKey] = new Date(parseInt(cursorObj[cursorKey], 10))
      }
   })

   return cursorObj
}

exports.transformCursorIntoConditions = ({ cursorObj = {}, sortObj = {} }) => {
   const cursorKeys = Object.keys(cursorObj)
   const sortKeys = Object.keys(sortObj)
   if (cursorKeys.join(',') !== sortKeys.join(',')) {
      throw new Error('Sort keys and cursor keys must match')
   }

   // Create a new array that will contain our query conditions
   // for cursor offsets, then initialize the array
   // with empty objects.
   const cursorConditions = new Array(cursorKeys.length)
   for (let i = 0; i < cursorKeys.length; i += 1) {
      cursorConditions[i] = {}
   }

   for (let i = 0; i < cursorKeys.length; i += 1) {
      const comparisonOperator = sortObj[cursorKeys[i]] === -1
         ? '$lt'
         : '$gt'

      cursorConditions[i][cursorKeys[i]] = {
         [comparisonOperator]: cursorObj[cursorKeys[i]]
      }

      for (let j = i + 1; j < cursorKeys.length; j += 1) {
         cursorConditions[j][cursorKeys[i]] = cursorObj[cursorKeys[i]]
      }
   }

   return cursorConditions
}

exports.applyConditionsToQuery = (cursorConditions = [], query) => {
   if (cursorConditions.length === 1) {
      query.where(cursorConditions[0])
   } else if (cursorConditions.length > 1) {
      const queryConditions = query.getQuery()
      if (Array.isArray(queryConditions.$or)) {
         if (Array.isArray(queryConditions.$and)) {
            query.where({
               $or: [],
               $and: [
                  ...queryConditions.$and,
                  { $or: queryConditions.$or },
                  { $or: cursorConditions }
               ]
            })
         } else {
            query.where({
               $or: [],
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

   return query
}
