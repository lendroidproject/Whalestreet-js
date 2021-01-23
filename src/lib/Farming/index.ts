// tslint:disable no-if-statement
// tslint:disable no-object-mutation
// tslint:disable no-expression-statement
import Web3 from 'web3';
import * as EvmChains from 'evm-chains';

import $HRIMP from './ABIs/$HRIMP.json';
import ERC20 from './ABIs/ERC20.json';
import LSTETHPool from './ABIs/LSTETHPool.json';
import LSTWETHUNIV2 from './ABIs/LSTWETHUNIV2.json';

const DEFAULT_REFRESH = 5 * 1000;

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

interface Wallet {
  address?: string;
  network?: number;
}

class Farming {
  private wallet: Wallet = {};
  public web3: Web3;
  public contracts: any;
  public methods: any;
  private options: any;
  private subscriptions: any[] = [];
  private timers: NodeJS.Timeout[] = [];

  constructor(provider: any, options: Options) {
    this.web3 = new Web3(provider);
    this.options = options;
    this.init(provider);
  }

  get addresses() {
    return this.options.addresses;
  }

  get onEvent() {
    return this.options.onEvent;
  }

  public setProvider(provider: any, addresses?: any) {
    if (addresses) this.options.addresses = addresses;
    this.init(provider);
  }

  public onDisconnect() {
    this.web3.givenProvider.disconnect && this.web3.givenProvider.disconnect();
    this.reset();
  }

  private reset() {
    this.subscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      } else if (subscription.deleteProperty) {
        subscription.deleteProperty();
      }
    });
    this.timers.forEach(timer => clearInterval(timer));
  }

  private async initWallet(refresh: boolean = false) {
    let status = 0; // No updatse
    const chainId = await this.web3.eth.getChainId();
    const { networkId: network } = await EvmChains.getChain(chainId);
    const [address] = await this.web3.eth.getAccounts();
    if (this.wallet.network && this.wallet.network !== network) {
      status = 1;
    } else if (this.wallet.address !== address) {
      status = 2;
    }
    this.wallet.network = network;
    this.wallet.address = address;

    if (refresh || status > 0) {
      this.onEvent({
        event: 'WALLET',
        status,
        data: this.wallet
      });
    }
  }

  private connect() {
    this.initWallet(true);
  }

  private disconnect() {
    this.reset();
    this.onEvent({
      event: 'WALLET',
      status: 3,
      data: this.wallet
    });
  }

  private async init(provider: any) {
    const { addresses, onEvent } = this.options;
    if (provider) {
      this.web3 = new Web3(provider);
      this.reset();
    }

    this.contracts = {
      $HRIMP: new this.web3.eth.Contract($HRIMP as any, addresses.$HRIMP),
      LST: new this.web3.eth.Contract(ERC20 as any, addresses.LST),
      LSTETHPool: new this.web3.eth.Contract(
        LSTETHPool as any,
        addresses.LSTETHPool
      ),
      LSTWETHUNIV2: new this.web3.eth.Contract(
        LSTWETHUNIV2 as any,
        addresses.LST_WETH_UNI_V2
      )
    };

    this.subscriptions = [
      this.contracts.$HRIMP.events
        .allEvents({
          // ...
        })
        .on('data', onEvent),
      this.contracts.LSTWETHUNIV2.events
        .allEvents({
          // ...
        })
        .on('data', onEvent),
      this.contracts.LSTETHPool.events
        .allEvents({
          // ...
        })
        .on('data', onEvent),
      provider.on && provider.on('accountsChanged', () => this.initWallet()),
      provider.on && provider.on('chainChanged', () => this.initWallet()),
      provider.on && provider.on('connect', () => this.connect()),
      provider.on && provider.on('disconnect', () => this.disconnect())
    ].filter(item => !!item);

    if (!provider.on) {
      this.timers = [
        setInterval(
          () => this.initWallet(),
          this.options.interval || DEFAULT_REFRESH
        )
      ];
    }

    this.methods = {
      $HRIMP: {
        approve: send(this.contracts.$HRIMP.methods.approve),
        getAllowance: (addr: string) =>
          call(this.contracts.$HRIMP.methods.allowance)(
            addr,
            addresses.LSTETHPool
          ),
        getBalance: call(this.contracts.$HRIMP.methods.balanceOf),
        totalSupply: call(this.contracts.$HRIMP.methods.totalSupply)
      },
      LST: {
        getBalance: call(this.contracts.LST.methods.balanceOf),
        totalSupply: call(this.contracts.LST.methods.totalSupply)
      },
      LSTETHPool: {
        EPOCH_PERIOD: call(this.contracts.LSTETHPool.methods.EPOCH_PERIOD),
        HEART_BEAT_START_TIME: call(
          this.contracts.LSTETHPool.methods.HEART_BEAT_START_TIME
        ),
        claim: send(this.contracts.LSTETHPool.methods.claim),
        currentEpoch: call(this.contracts.LSTETHPool.methods.currentEpoch),
        epochEndTimeFromTimestamp: call(
          this.contracts.LSTETHPool.methods.epochEndTimeFromTimestamp
        ),
        getBalance: call(this.contracts.LSTETHPool.methods.balanceOf),
        getEarned: call(this.contracts.LSTETHPool.methods.earned),
        lastEpochStaked: call(
          this.contracts.LSTETHPool.methods.lastEpochStaked
        ),
        rewardRate: call(this.contracts.LSTETHPool.methods.rewardRate),
        stake: send(this.contracts.LSTETHPool.methods.stake),
        totalSupply: call(this.contracts.LSTETHPool.methods.totalSupply),
        unstake: send(this.contracts.LSTETHPool.methods.unstake)
      },
      LSTWETHUNIV2: {
        approve: send(this.contracts.LSTWETHUNIV2.methods.approve),
        getAllowance: (addr: string) =>
          call(this.contracts.LSTWETHUNIV2.methods.allowance)(
            addr,
            addresses.LSTETHPool
          ),
        getBalance: call(this.contracts.LSTWETHUNIV2.methods.balanceOf)
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
            this.web3.eth
              .getBlock('latest')
              .then((block: any) => {
                if (field) {
                  resolve(block[field]);
                } else {
                  resolve(block);
                }
              })
              .catch(reject)
          )
      }
    };

    await this.initWallet(!!provider);
  }
}

export default Farming;
