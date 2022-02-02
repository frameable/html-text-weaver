# html-text-weaver
Encode html to its component plain-text and meta style parts

```javascript
{ encode, decode } = require('html-text-weaver');

const html = '<h1>Hey, you! <b><i>Get out of there!</i></b></h1>';

encode(html);

// {
//  text: 'Hey, you! Get out of there!',
//  meta: [ [ 'h1', 0, 27 ], [ 'b', 10, 27 ], [ 'i', 10, 27 ] ] }
// }

decode(encode(html))

// '<h1>Hey, you! <b><i>Get out of there!</i></b></h1>'
```

## Functions

### { text, meta } = encode(html)

Encode html into its component plain-text and meta style parts.  Meta is an array of arrays of tag names, start, and end offests.


### html = decode({ text, meta })

Decode text and meta parts back into html.

