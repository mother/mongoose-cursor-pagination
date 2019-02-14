const querystring = require('querystring')

// We generate a base64-encoded query string
exports.generateCursor = (cursorData, fieldTransformers) => {
   const cursorPlainText = Object.keys(cursorData).map((cursorKey) => {
      const escapedCursorKey = querystring.escape(cursorKey)
      const transformedCursorValue = typeof fieldTransformers[cursorKey] === 'object'
         ? fieldTransformers[cursorKey].toCursor(cursorData[cursorKey])
         : cursorData[cursorKey]

      return `${escapedCursorKey}=${querystring.escape(transformedCursorValue)}`
   }).join('&')

   return Buffer.from(cursorPlainText).toString('base64')
}

exports.parseCursor = (cursor, fieldTransformers) => {
   const cursorPlainText = Buffer.from(cursor, 'base64').toString()
   const cursorObj = querystring.parse(cursorPlainText)

   Object.keys(cursorObj).forEach((cursorKey) => {
      if (typeof fieldTransformers[cursorKey] === 'object') {
         cursorObj[cursorKey] = fieldTransformers[cursorKey].fromCursor(cursorObj[cursorKey])
      }
   })

   return cursorObj
}

exports.transformCursorIntoConditions = ({ cursorObj = {}, sortObj = {} }) => {
   const cursorKeys = Object.keys(cursorObj)
   const cursorConditions = new Array(cursorKeys.length)

   // Initialize the array with empty objects
   for (let i = 0; i < cursorKeys.length; i += 1) {
      cursorConditions[i] = {}
   }

   for (let i = 0; i < cursorKeys.length; i += 1) {
      const comparisonOperator = sortObj[cursorKeys[i]] === -1
         ? '$lte'
         : '$gte'

      cursorConditions[i][cursorKeys[i]] = {
         [comparisonOperator]: cursorObj[cursorKeys[i]]
      }

      for (let j = i + 1; j < cursorKeys.length; j += 1) {
         cursorConditions[j][cursorKeys[i]] = cursorObj[cursorKeys[i]]
      }
   }

   return cursorConditions
}
