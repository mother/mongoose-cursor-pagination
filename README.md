[![Build Status](https://travis-ci.org/mother/mongoose-cursor-pagination.svg?branch=master)](https://travis-ci.org/mother/mongoose-cursor-pagination.svg?branch=master)

## Usage

This plugin makes it easy to use cursor-based pagination in your app, without
changing the way you use mongoose.

In your schema:

```javascript
import mongoose from 'mongoose'
import paginationPlugin from '@mother/mongoose-cursor-pagination'

const CommentSchema = new mongoose.Schema({
  date: { type: Date },
  body: { type: String },
  author: {
     firstName: { type: String },
     lastName: { type: String }
  }
})

CommentSchema.plugin(paginationPlugin)
```

In your application code:

```javascript
const { results, pageInfo } = await Comment.find({})
   .limit(30) // Use limit and other Query options as you normally would
   .sort('author.lastName') // Use sort as you would normally do
   .paginate(startCursor) // startCursor optional
   .exec() // Required
```

`pageInfo` will have two properties: `hasNext` and `nextCursor`

## To Do
- Support for aggregation