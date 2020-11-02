// tslint:disable no-if-statement
// tslint:disable no-object-mutation
// tslint:disable no-expression-statement
import Web3 from 'web3';

import $HRIMP from './ABIs/$HRIMP.json';
import LSTETHPool from './ABIs/LSTETHPool.json';
import LSTWETHUNIV2 from './ABIs/LSTWETHUNIV2.json';

const call = (method: (...args: any) => any) => (...args: any) =>
  method(...args).call() as Promise<any>;
const send = (method: (...args: any) => any) => (...args: any) => {
  const option = args.pop();
  const transaction = method(...args);
  return {
    estimate: (): Promise<any> =>
      transaction.estimateGas(option) as Promise<any>,
    send: (): Promise<any> => transaction.send(option) as Promise<any>,
    transaction
  };
};

interface Options {
  readonly onEvent?: (type: string, payload: any, error: any) => void;
  readonly addresses: any;
}

export default (provider: any, options: Options) => {
  const instance = new Web3(provider);
  const { addresses, onEvent } = options;
  const contracts = {
    $HRIMP: new instance.eth.Contract($HRIMP as any, addresses.$HRIMP),
    LSTETHPool: new instance.eth.Contract(
      LSTETHPool as any,
      addresses.LSTETHPool
    ),
    LSTWETHUNIV2: new instance.eth.Contract(
      LSTWETHUNIV2 as any,
      addresses.LST_WETH_UNI_V2
    )
  };

  const methods = {
    $HRIMP: {
      approve: send(contracts.$HRIMP.methods.approve),
      getAllowance: (addr: string) =>
        call(contracts.$HRIMP.methods.allowance)(addr, addresses.LSTETHPool),
      getBalance: call(contracts.$HRIMP.methods.balanceOf),
      totalSupply: call(contracts.$HRIMP.methods.totalSupply)
    },
    LSTETHPool: {
      claim: send(contracts.LSTETHPool.methods.claim),
      getBalance: call(contracts.LSTETHPool.methods.balanceOf),
      getEarned: call(contracts.LSTETHPool.methods.earned),
      stake: send(contracts.LSTETHPool.methods.stake),
      unstake: send(contracts.LSTETHPool.methods.unstake)
    },
    LSTWETHUNIV2: {
      approve: send(contracts.LSTWETHUNIV2.methods.approve),
      getAllowance: (addr: string) =>
        call(contracts.LSTWETHUNIV2.methods.allowance)(
          addr,
          addresses.LSTETHPool
        ),
      getBalance: call(contracts.LSTWETHUNIV2.methods.balanceOf)
    },
    addresses: {
      getName: (addr: string) =>
        Object.keys(addresses).find(
          k => addresses[k].toLowerCase() === addr.toLowerCase()
        )
    },
    web3: {
      setProvider: (prov: any) => {
        instance.setProvider(prov);
        contracts.$HRIMP = new instance.eth.Contract(
          $HRIMP as any,
          addresses.$HRIMP
        );
        contracts.LSTWETHUNIV2 = new instance.eth.Contract(
          LSTWETHUNIV2 as any,
          addresses.LSTWETHUNIV2
        );
        contracts.LSTETHPool = new instance.eth.Contract(
          LSTETHPool as any,
          addresses.LSTETHPool
        );
      }
    }
  };

  contracts.$HRIMP.events
    .allEvents(
      {
        // ...
      },
      // tslint:disable-next-line: no-console
      console.info
    )
    .on('data', onEvent);
  contracts.LSTWETHUNIV2.events
    .allEvents(
      {
        // ...
      },
      // tslint:disable-next-line: no-console
      console.info
    )
    .on('data', onEvent);
  contracts.LSTETHPool.events
    .allEvents(
      {
        // ...
      },
      // tslint:disable-next-line: no-console
      console.info
    )
    .on('data', onEvent);

  return {
    addresses,
    contracts,
    methods,
    web3: instance
  };
};
