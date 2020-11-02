// tslint:disable:no-expression-statement
import test from 'ava';
import Library from './index';

test('contructor', async t => {
  const library = Library(null, {
    addresses: {
      FRight: '0xFc248D053E8E5F71542c0F4956f0292453393A87',
      IRight: '0xdb210A5da035d160c7528BeCc349d58156818E7C',
      RightsDao: '0xa43F7069C723587dedaC7c3c82C2f913a1806ff2'
    },
  });
  t.deepEqual(library.addresses, {
    FRight: '0xFc248D053E8E5F71542c0F4956f0292453393A87',
    IRight: '0xdb210A5da035d160c7528BeCc349d58156818E7C',
    RightsDao: '0xa43F7069C723587dedaC7c3c82C2f913a1806ff2'
  });
});
