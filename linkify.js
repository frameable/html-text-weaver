const linkify = require('linkifyjs');

const _tokenLength = function(token) {

  let len = 0;

  function _walk(t) {
    if (typeof t.v == 'string') {
      len += t.v.length;
    } else if (Array.isArray(t.v)) {
      for (let c of t.v) {
        _walk(c);
      }
    }
  }

  _walk(token);

  return len;
};

const tokenize = function tokenize(str) {
  return linkify.parser.run(linkify.scanner.run(str));
};

// modified and lifted from linkify.find

const findLinkOffsets = (str) => {

  const tokens = tokenize(str);
  const filtered = [];
  let offset = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.isLink) {
      const obj = token.toObject();
      const valueLen = _tokenLength(token);
      obj.offsets = [ offset, offset + valueLen ];
      filtered.push(obj);
    }
    offset += _tokenLength(token);
  }

  return filtered;
};

module.exports = { findLinkOffsets };


