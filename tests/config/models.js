const mongoose = require('mongoose')
const paginationPlugin = require('../../lib')

const commentSchema = new mongoose.Schema({
   date: { type: Date, default: Date.now, required: true },
   body: { type: String, required: true },
   author: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true }
   }
})

// Text index for full-text searching
commentSchema.index({
   body: 'text',
   'author.firstName': 'text',
   'author.lastName': 'text'
})

// Our very own pagination plugin
commentSchema.plugin(paginationPlugin)

mongoose.model('comment', commentSchema)
