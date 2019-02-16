0.0.2
- Changed cursor string format to use JSON
- Cursor string generation can handle `null` and `undefined`
- Cursor keys must be a subset of sort keys
- Use base64 url encoding for cursor strings (instead of normal base64)
