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
   // console.log('generateCursorStr', cursorPlainText)
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
   // console.log('parseCursorStr', cursorObj)
   return cursorObj
}

// TODO: PROTECT AGAINST EVIL INJECTIONS
exports.transformCursorIntoConditions = ({ cursorObj = {}, sortObj = {} }) => {
   const cursorKeys = Object.keys(cursorObj)
   const cursorConditions = new Array(cursorKeys.length)

   // Initialize the array with empty objects
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
