// tslint:disable no-if-statement
// tslint:disable no-object-mutation
// tslint:disable no-expression-statement
import Web3 from 'web3';

import $HRIMP from './ABIs/$HRIMP.json';
import AuctionRegistry from './ABIs/AuctionRegistry.json';
import AuctionCurve from './ABIs/AuctionCurve.json';
import WhaleSwap from './ABIs/WhaleSwap.json';

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
    AuctionRegistry: new instance.eth.Contract(
      AuctionRegistry as any,
      addresses.AuctionRegistry
    ),
    WhaleSwap: new instance.eth.Contract(WhaleSwap as any, addresses.WhaleSwap)
  };

  const methods = {
    $HRIMP: {
      approve: send(contracts.$HRIMP.methods.approve),
      getAllowance: (addr: string) =>
        call(contracts.$HRIMP.methods.allowance)(
          addr,
          addresses.AuctionRegistry
        ),
      getBalance: call(contracts.$HRIMP.methods.balanceOf),
      totalSupply: call(contracts.$HRIMP.methods.totalSupply)
    },
    AuctionRegistry: {
      currentEpoch: () => {
        return new Promise((resolve, reject) => {
          contracts.AuctionRegistry.methods
            .auctionCurve()
            .call()
            .then((auctionCurve: string) => {
              const curve = new instance.eth.Contract(
                AuctionCurve as any,
                auctionCurve
              );
              curve.methods
                .currentEpoch()
                .call()
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
        });
      },
      currentPrice: call(contracts.AuctionRegistry.methods.currentPrice),
      epochEndTimeFromTimestamp: (timestamp: any) => {
        return new Promise((resolve, reject) => {
          contracts.AuctionRegistry.methods
            .auctionCurve()
            .call()
            .then((auctionCurve: string) => {
              const curve = new instance.eth.Contract(
                AuctionCurve as any,
                auctionCurve
              );
              curve.methods
                .epochEndTimeFromTimestamp(timestamp)
                .call()
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
        });
      },
      purchase: send(contracts.AuctionRegistry.methods.purchase),
      purchases: call(contracts.AuctionRegistry.methods.defiKeys),
      totalPurchases: call(contracts.AuctionRegistry.methods.totalDefiKeys)
    },
    WhaleSwap: {
      approve: send(contracts.WhaleSwap.methods.approve),
      getBalance: call(contracts.WhaleSwap.methods.balanceOf)
    },
    addresses: {
      getName: (addr: string) =>
        Object.keys(addresses).find(
          k => addresses[k].toLowerCase() === addr.toLowerCase()
        )
    },
    web3: {
      getBlock: (field: string = 'timestamp') =>
        new Promise((resolve, reject) =>
          instance.eth
            .getBlock('latest')
            .then((block: any) => {
              if (field) {
                resolve(block[field]);
              } else {
                resolve(block);
              }
            })
            .catch(reject)
        ),
      setProvider: (prov: any) => {
        instance.setProvider(prov);
        contracts.AuctionRegistry = new instance.eth.Contract(
          AuctionRegistry as any,
          addresses.AuctionRegistry
        );
        contracts.WhaleSwap = new instance.eth.Contract(
          WhaleSwap as any,
          addresses.WhaleSwap
        );
      }
    }
  };

  contracts.$HRIMP.events
    .allEvents({
      // ...
    })
    .on('data', onEvent);
  contracts.AuctionRegistry.events
    .allEvents({
      // ...
    })
    .on('data', onEvent);
  contracts.WhaleSwap.events
    .allEvents({
      // ...
    })
    .on('data', onEvent);

  return {
    addresses,
    contracts,
    methods,
    web3: instance
  };
};
