const mongoose = require('mongoose')
const paginationPlugin = require('../../')

const commentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  body: { type: String, required: true },
  author: {
     firstName: { type: String, required: true },
     lastName: { type: String, required: true }
  }
})

commentSchema.plugin(paginationPlugin)

mongoose.model('comment', commentSchema)
