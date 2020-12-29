// tslint:disable:no-expression-statement
import test from 'ava';

test('contructor', async t => {
  const addresses = {
    test: true
  };
  t.deepEqual(addresses, {
    test: true
  });
});
