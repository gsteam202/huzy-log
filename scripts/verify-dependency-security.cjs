const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const store = path.join(__dirname, '../node_modules/.pnpm');
const entry = fs.readdirSync(store).find(name => name.startsWith('braces@3.0.3_patch_'));
assert.ok(entry, 'Expected the local braces security patch');
const braces = require(path.join(store, entry, 'node_modules/braces'));
assert.equal(braces.compile('src/{one,two}/*.ts'), 'src/(one|two)/*.ts');
assert.deepEqual(braces.expand('file{1..3}'), ['file1', 'file2', 'file3']);
for (const method of ['compile', 'expand', 'stringify']) {
  for (const pair of [['{', '}'], ['(', ')']]) {
    const pattern = pair[0].repeat(4000) + 'x' + pair[1].repeat(4000);
    assert.throws(() => braces[method](pattern), /Brace nesting exceeds safe depth/);
  }
}
console.log('Dependency security regression checks passed');
