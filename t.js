const { Document } = require('basichtml');
global.document = new Document();
const { Weaver, escapeHTML, unescapeHTML } = require('./index');
const weaver = new Weaver();

console.log('IN', weaver.encode('<b>\n</b>'));
console.log('RT', weaver.decode(weaver.encode('<b>\n</b>')));
