const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const LINK_CLASS = 'linkified';

const TAG_NAME = 0;
const OPEN_OFFSET = 1;
const CLOSE_OFFSET = 2;
const ATTRIBUTES = 3;

const KEY = 0;
const VALUE = 1;

const linkify = require('./linkify');

class Weaver {

  constructor({ normalizedTagNames, tagAttributes }={}) {
    this.normalizedTagNames = normalizedTagNames || {
      b: 'b',
      strong: 'b',
      em: 'i',
      i: 'i',
      h1: 'h1',
      h2: 'h2',
      a: 'a',
    };
    this.tagAttributes = tagAttributes || {
      a: ['href', 'class']
    };
  }

  encode(html) {

    const el = document.createElement('div');
    el.innerHTML = html.trim();

    let text = '';
    const meta = [];

    const _walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === ELEMENT_NODE) {
          const tagName = child.tagName.toLowerCase();
          if (tagName === 'br') {
            text += '\n';
          } else if (tagName in this.normalizedTagNames) {
            let attributes = null;
            for (const attributeName of this.tagAttributes[tagName] || []) {
              attributes = attributes || [];
              const attrValue = child.getAttribute(attributeName);
              if (attrValue) {
                attributes.push([ attributeName, attrValue ]);
              }
            }
            const marker = [tagName, text.length, null, attributes];
            meta.push(marker);
            _walk(child);
            marker[2] = text.length;
          } else {
            _walk(child);
          }
        }
        if (child.nodeType === TEXT_NODE) {
          text += child.textContent;
        }
      }
    };

    _walk(el);

    return { text, meta };
  }

  decode({ text, meta }) {
    if (text === undefined) throw new Error('no text passed to decode');
    if (meta === undefined) throw new Error('no meta passed to decode');

    const links = linkify.findLinkOffsets(text);

    LINK: for (const link of links) {
      const anchorMeta = [
        'a',
        link.offsets[0],
        link.offsets[1],
        [['href', link.href], ['class', LINK_CLASS]]
      ];

      const _between = (a, b, c) => a < b && b < c;
      const _betweenOrEq = (a, b, c) => a <= b && b <= c;

      for (const m of meta) {
        const startInside = _between(link.offsets[0], m[OPEN_OFFSET], link.offsets[1]);
        const endInside = _between(link.offsets[0], m[CLOSE_OFFSET], link.offsets[1]);
        // if we find partial overlaps, bail on this link
        if (startInside ^ endInside) continue LINK;
      }

      let candidateIndex = null;
      for (const [i, m] of meta.entries()) {
        if (m[OPEN_OFFSET] <= link.offsets[0])
          candidateIndex = i + 1;
      }
      candidateIndex = candidateIndex || 0;

      const enclosingMetaATags = meta
        .filter(m => m[TAG_NAME].toLowerCase() === 'a')
        .filter(m => _betweenOrEq(m[OPEN_OFFSET], link.offsets[0], m[CLOSE_OFFSET]));

      if (enclosingMetaATags.length) continue LINK;

      meta.splice(candidateIndex, 0, anchorMeta);
    }

    let html = '';
    let mi = 0;

    const stack = [];

    for (let i=0; i < text.length; i++) {
      while (meta[mi] && i === meta[mi][OPEN_OFFSET]) {
        const attributes = (meta[mi][ATTRIBUTES] || [])
          .map(a => ` ${a[KEY]}=${JSON.stringify(a[VALUE])}`).join('') || '';
        html += `<${meta[mi][TAG_NAME]}${attributes}>`;
        stack.push(meta[mi]);
        mi++;
      }
      html += escapeHTML(text[i]);
      while (stack.length && (i + 1) === stack[stack.length - 1][CLOSE_OFFSET]) {
        html += `</${stack[stack.length - 1][TAG_NAME]}>`;
        stack.length = stack.length - 1;
      }
    }

    return html.replace(/\n/g, '<br/>');
  }

}

const escapeHTML = function (s) {
  var escaped = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\'': '&#39;',
    '"': '&quot;'
  };
  return s.replace(/[&<>'"]/g, function (m) {
    return escaped[m];
  });
};

const unescapeHTML= function (s) {
  var re = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;
  var unescaped = {
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&apos;': '\'',
    '&#39;': '\'',
    '&quot;': '"',
    '&#34;': '"'
  };
  return s.replace(re, function (m) {
    return unescaped[m];
  });
};


module.exports = {
  Weaver,
  escapeHTML,
  unescapeHTML
};
