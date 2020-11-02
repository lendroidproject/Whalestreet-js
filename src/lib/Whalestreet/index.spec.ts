// tslint:disable:no-expression-statement
import test from 'ava';
import Library from './index';

test('contructor', async t => {
  const library = Library(null, {
    addresses: {
      $HRIMP: '0x7186013ABe25De7dd79e191f3251bE73B72Db037',
      LSTETHPool: '0xdF011A6c60Ca415a24D2db7Feb862E8Dc2664f7D',
      LST_WETH_UNI_V2: '0xFB5b443ae22080b456C4b5ff2c06a4aD987B89A7'
    }
  });
  t.deepEqual(library.addresses, {
    $HRIMP: '0x7186013ABe25De7dd79e191f3251bE73B72Db037',
    LSTETHPool: '0xdF011A6c60Ca415a24D2db7Feb862E8Dc2664f7D',
    LST_WETH_UNI_V2: '0xFB5b443ae22080b456C4b5ff2c06a4aD987B89A7'
  });
});
