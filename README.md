# mongoose-cursor-pagination

[![Build Status](https://travis-ci.org/mother/mongoose-cursor-pagination.svg?branch=master)](https://travis-ci.org/mother/mongoose-cursor-pagination)

This small plugin makes it easy to use cursor-based pagination in your app, without changing the way you use queries in mongoose.

## Installation

```npm install @mother/mongoose-cursor-pagination --save```

Node.js 8.x or higher is required.

## Usage

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
const { results, pageInfo } = await Comment
   .find({})                 // Whatever filter you want
   .limit(30)                // Use limit and other Query options as you normally would
   .sort('author.lastName')  // Use sort as you would normally do
   .paginate(startCursor)    // startCursor optional
   .exec()                   // Required
```

`results` will be the results that you would expect from a normal mongoose `find` query

`pageInfo` will have two properties: `hasNext` and `nextCursor`

Be sure to index correctly. Note that this plugin always add `_id` to the sort key to ensure cursors are unique, so include that in your index as well. For example, say you are using the `date` field for pagination, then you would want to setup the index:

```js
commentSchema.index({ date: -1, _id: -1 })
```

## Plugin Options

You can optionally pass an options object to this plugin:

```js
CommentSchema.plugin(paginationPlugin, {
   // If no limit is specified, and paginate() is being used,
   // what should the default limit be.
   defaultLimit: 100
})
```

## Tests

Numerous tests are included in the `tests` directory, and can be run using the command `npm test`.

## To Do
- Test against older versions of mongoose
- Support for search with pagination
- Support for aggregation with pagination
- Support for `hasPrev` and `prevCursor`
- Support `exec` calls that use callbacks instead of promises

## License

MIT
