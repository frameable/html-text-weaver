const assert = require('assert');
const { Document } = require('basichtml');
global.document = new Document();
const { Weaver, escapeHTML, unescapeHTML } = require('./index');

const weaver = new Weaver();

suite('encode', () => {

  test('bold char', () => {
    const encodedText = weaver.encode('<b>a</b>');
    assert.deepEqual(encodedText, {
      text: 'a',
      meta: [ ['b', 0, 1, null] ]
    });
  });

  test('alert', () => {
    const encodedText = weaver.encode(escapeHTML('<script>alert(1)</script>'));
    assert.deepEqual(encodedText, {
      text: '<script>alert(1)</script>',
      meta: []
    });
  });

  test('basic tags', () => {
    const encodedText = weaver.encode('my <b>bold</b> text');
    assert.deepEqual(encodedText, {
      text: 'my bold text',
      meta: [
        ['b', 3, 7, null]
      ]
    });
  });

  test('trim the input', () => {
    const encodedText = weaver.encode('   my padded text   \n');
    assert.deepEqual(encodedText,{
      text: 'my padded text',
      meta: [],
    });
  });

  test('links', () => {
    const encodedText = weaver.encode('<a href="yahoo.com" class="linkified">YAHOO</a>');
    assert.deepEqual(encodedText, {
      text: 'YAHOO',
      meta: [
        ['a', 0, 5, [ ['href', 'yahoo.com'], ['class', 'linkified'] ] ]
      ]
    });
  });

  test('newlines', () => {
    const encodedText = weaver.encode('<a href="yahoo.com" class="linkified">YAHOO\nYAHOO</a>\nhey!');
    assert.deepEqual(encodedText, {
      text: 'YAHOO\nYAHOO\nhey!',
      meta: [
        ['a', 0, 11, [ ['href', 'yahoo.com'], ['class', 'linkified'] ] ]
      ]
    });
  });

  test('stacked tags', () => {
    const encodedText = weaver.encode('she <i>told</i> him that he was the <b><i>worst!</i></b>');
    assert.deepEqual(encodedText, {
      text: 'she told him that he was the worst!',
      meta: [
        ['i', 4, 8, null],
        ['b', 29, 35, null],
        ['i', 29, 35, null],
      ]
    });
  });
});

suite('decode', () => {

  test('errors with bad inputs', () => {
    const noMeta = () => weaver.decode({ text: 'test' });
    assert.throws(noMeta, Error);
    const noText = () => weaver.decode({ meta: [] });
    assert.throws(noText, Error);
  });

  test('alert', () => {
    const decodedText = weaver.decode({
      text: '<script>alert(1)</script>',
      meta: []
    });
    assert.equal(decodedText, escapeHTML('<script>alert(1)</script>'));
  });

  test('basic tags', () => {
    const decodedText = weaver.decode({
      text: 'my bold text',
      meta: [
        ['b', 3, 7]
      ]
    });
    assert.equal(decodedText, 'my <b>bold</b> text');
  });

  test('newlines', () => {
    const decodedText = weaver.decode({
      text: 'she told him that\n he\n was the worst!',
      meta: [
        ['i', 4, 8],
        ['b', 31, 37],
        ['i', 31, 37],
      ]
    });
    assert.equal(decodedText, 'she <i>told</i> him that<br/> he<br/> was the <b><i>worst!</i></b>');
    });

  test('stacked tags', () => {
    const decodedText = weaver.decode({
      text: 'she told him that he was the worst!',
      meta: [
        ['i', 4, 8],
        ['b', 29, 35],
        ['i', 29, 35],
      ]
    });
    assert.equal(decodedText, 'she <i>told</i> him that he was the <b><i>worst!</i></b>');
  });
});

suite('linkify', () => {

  test('basic link', () => {
    const html = weaver.decode({
      text: 'yahoo.com',
      meta: []
    });
    assert.equal(html, '<a href="http://yahoo.com" class="linkified">yahoo.com</a>');
  });

  test('link on top of style', () => {
    const html = weaver.decode({
      text: 'visit yahoo.com and gmx.net today!',
      meta: [ ['b', 0, 5], ['i', 6, 15] ]
    });

    assert.equal(html, '<b>visit</b> <a href="http://yahoo.com" class="linkified"><i>yahoo.com</i></a> and <a href="http://gmx.net" class="linkified">gmx.net</a> today!');
  });

  test('ignore links with partially overlapping tags', () => {
    const overlappingAfter = weaver.decode(weaver.encode('ya<i>hoooo.com is great</i>'));
    assert.equal(overlappingAfter, 'ya<i>hoooo.com is great</i>');
    const overlappingBefore = weaver.decode(weaver.encode('<i>ya</i>hoooo.com is great'));
    assert.equal(overlappingBefore, '<i>ya</i>hoooo.com is great');
    const notOverlapping = weaver.decode(weaver.encode('<b><i>yahoooo.com</i></b> is great'));
    assert.equal(notOverlapping, '<a href="http://yahoooo.com" class="linkified"><b><i>yahoooo.com</i></b></a> is great');
  });

  test('round trip without adding extra links', () => {
    const html = weaver.decode(weaver.encode(weaver.decode({
      text: 'yahoo.com',
      meta: []
    })));
    assert.equal(html, '<a href="http://yahoo.com" class="linkified">yahoo.com</a>');
  });

  test('double round trip without adding extra links', () => {
    const html = weaver.decode(weaver.encode(weaver.decode(weaver.encode(weaver.decode({
      text: 'yahoo.com',
      meta: []
    })))));
    assert.equal(html, '<a href="http://yahoo.com" class="linkified">yahoo.com</a>');
  });


});

suite('encode-decode', () => {

  test('round trip', () => {

    const inputs = [
      `<h1>Rich Text Format</h1><b>Richard Brodie</b>, <b>Charles Simonyi</b>, and <b>David Luebbert</b>, members of the <i>Microsoft Word</i> development team, developed the original RTF in the middle to late 1980s. Its syntax was influenced by the TeX typesetting language.`,
      `<h1>Hey, you! <b><i>Get out of there!</i></b></h1>`
    ];
    for (const input of inputs) {
      assert.equal(input, weaver.decode(weaver.encode(input)));
    }
  });

  test('links', () => {

    const inputs = [
      `<a href="http://google.com" class="linkified">link to google</a>`
    ];
    for (const input of inputs) {
      assert.equal(input, weaver.decode(weaver.encode(input)));
    }
  });

  test('works with empty string', () => {
    const html = weaver.decode(weaver.encode(''));
    assert.equal(html, '');
  });

  test('newlines', () => {
    const inputs = [
      `<a href="http://google.com" class="linkified">link to google<br/>another</a>`
    ];
    for (const input of inputs) {
      assert.equal(input, weaver.decode(weaver.encode(input)));
    }

  });
});

