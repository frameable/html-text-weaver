const assert = require('assert');
const { Document } = require('basichtml');
global.document = new Document();
const { encode, decode, escapeHTML, unescapeHTML } = require('./index');


suite('encode', () => {

  test('alert', () => {
    const encodedText = encode(escapeHTML('<script>alert(1)</script>'))
    assert.deepEqual(encodedText, {
      text: '<script>alert(1)</script>',
      meta: []
    });
  });

  test('basic tags', () => {
    const encodedText = encode('my <b>bold</b> text');
    assert.deepEqual(encodedText, {
      text: 'my bold text',
      meta: [
        ['b', 3, 7]
      ]
    });
  });

  test('stacked tags', () => {
    const encodedText = encode('she <i>told</i> him that he was the <b><i>worst!</i></b>')
    assert.deepEqual(encodedText, {
      text: 'she told him that he was the worst!',
      meta: [
        ['i', 4, 8],
        ['b', 29, 35],
        ['i', 29, 35],
      ]
    });
  });
});

suite('decode', () => {

  test('alert', () => {
    const decodedText = decode({
      text: '<script>alert(1)</script>',
      meta: []
    });
    assert.equal(decodedText, escapeHTML('<script>alert(1)</script>'));
  });

  test('basic tags', () => {
    const decodedText = decode({
      text: 'my bold text',
      meta: [
        ['b', 3, 7]
      ]
    });
    assert.equal(decodedText, 'my <b>bold</b> text');
  });

  test('stacked tags', () => {
    const decodedText = decode({
      text: 'she told him that he was the worst!',
      meta: [
        ['i', 4, 8],
        ['b', 29, 35],
        ['i', 29, 35],
      ]
    });
    assert.equal(decodedText, 'she <i>told</i> him that he was the <b><i>worst!</i></b>')
  });
});

suite('encode-decode', () => {

  test('round trip', () => {

    const inputs = [
      `<h1>Rich Text Format</h1><b>Richard Brodie</b>, <b>Charles Simonyi</b>, and <b>David Luebbert</b>, members of the <i>Microsoft Word</i> development team, developed the original RTF in the middle to late 1980s. Its syntax was influenced by the TeX typesetting language.`,
      `<h1>Hey, you! <b><i>Get out of there!</i></b></h1>`
    ];
    for (const input of inputs) {
      assert.equal(input, decode(encode(input)));
    }
  });
});

