import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./dist/index.html', import.meta.url), 'utf8');
const pairs = [
  ['ampersand', 'amp-control', 'amp-entity'],
  ['numeric references', 'numeric-control', 'numeric-entity'],
  ['quotes', 'quote-control', 'quote-entity'],
  ['one level of decoding', 'literal-control', 'literal-entity'],
];

function paragraph(id) {
  const match = html.match(new RegExp(`<p id="${id}">([\\s\\S]*?)</p>`));
  assert.ok(match, `Missing paragraph: ${id}`);
  return match[1];
}

let failures = 0;
for (const [name, control, entity] of pairs) {
  const expected = paragraph(control);
  const actual = paragraph(entity);
  const equal = actual === expected;
  console.log(JSON.stringify({ name, equal, expected, actual }));
  if (!equal) failures++;
}

if (failures) {
  console.error(`Reproduced: ${failures} quoted-attribute values differ from their JavaScript string controls.`);
  process.exitCode = 1;
} else {
  console.log('All quoted-attribute values match their JavaScript string controls.');
}
