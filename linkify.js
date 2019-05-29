const linkify = require('linkifyjs');

var _tokenLength = function(token) {

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
}

var tokenize = function tokenize(str) {
  return linkify.parser.run(linkify.scanner.run(str));
};

// modified and lifted from linkify.find

const findLinkOffsets = (str) => {

  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  var tokens = tokenize(str);
  var filtered = [];
  var offset = 0;

  console.log("TOKENS", JSON.stringify(tokens));

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token.isLink && (!type || token.type === type)) {
      var obj = token.toObject();
      var valueLen = _tokenLength(token);
      obj.offsets = [ offset, offset + valueLen ];
      filtered.push(obj);
    }
    offset += _tokenLength(token);
  }

  return filtered;
};

module.exports = { findLinkOffsets };


