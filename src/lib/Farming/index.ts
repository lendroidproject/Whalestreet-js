// tslint:disable no-if-statement
// tslint:disable no-object-mutation
// tslint:disable no-expression-statement
// tslint:disable no-this
// tslint:disable typedef
// tslint:disable readonly-keyword
// tslint:disable readonly-array
// tslint:disable no-class
// tslint:disable no-let
// tslint:disable no-delete

import * as EvmChains from 'evm-chains';
import Web3 from 'web3';
import ERC20 from './ABIs/ERC20.json';
import POOL from './ABIs/POOL.json';
import UNIV2 from './ABIs/UNIV2.json';

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
  public web3: Web3;
  public contracts: any;
  public methods: any;
  private wallet: Wallet = {};
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
    if (addresses) {
      this.options.addresses = addresses;
    }
    this.init(provider);
  }

  public onDisconnect() {
    this.disconnect();
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
    let status = 0; // No updates
    const chainId = await this.web3.eth.getChainId();
    const { networkId: network } = await EvmChains.getChain(chainId);
    const [address] = await this.web3.eth.getAccounts();
    if (this.wallet.address && !address) {
      return this.disconnect();
    } else if (this.wallet.network && this.wallet.network !== network) {
      status = 1;
    } else if (this.wallet.address !== address) {
      status = 2;
    }
    this.wallet.network = network;
    this.wallet.address = address;

    if (refresh || status > 0) {
      this.onEvent({
        data: this.wallet,
        event: 'WALLET',
        status
      });
    }
  }

  private connect() {
    this.initWallet(true);
  }

  private disconnect() {
    if (this.web3.givenProvider.disconnect) {
      this.web3.givenProvider.disconnect();
    }
    delete this.wallet.address;
    this.reset();
    this.onEvent({
      data: this.wallet,
      event: 'WALLET',
      status: 3
    });
  }

  private async init(provider: any) {
    const { addresses, onEvent } = this.options;
    if (provider) {
      this.web3 = new Web3(provider);
      this.reset();
    }

    this.contracts = {
      $HRIMP: new this.web3.eth.Contract(ERC20 as any, addresses.$HRIMP),
      $HRIMP_WETH_UNIV2: new this.web3.eth.Contract(
        UNIV2 as any,
        addresses.$HRIMP_WETH_UNIV2
      ),
      $HRIMP_WETH_UNIV2_B20_Pool: new this.web3.eth.Contract(
        POOL as any,
        addresses.$HRIMP_WETH_UNIV2_B20_Pool
      ),
      B20: new this.web3.eth.Contract(ERC20 as any, addresses.B20),
      B20_WETH_UNIV2: new this.web3.eth.Contract(
        UNIV2 as any,
        addresses.B20_WETH_UNIV2
      ),
      B20_WETH_UNIV2_B20_Pool: new this.web3.eth.Contract(
        POOL as any,
        addresses.B20_WETH_UNIV2_B20_Pool
      ),
      B20_WETH_UNIV2_LST_Pool: new this.web3.eth.Contract(
        POOL as any,
        addresses.B20_WETH_UNIV2_LST_Pool
      ),
      LST: new this.web3.eth.Contract(ERC20 as any, addresses.LST),
      LST_WETH_UNIV2: new this.web3.eth.Contract(
        UNIV2 as any,
        addresses.LST_WETH_UNIV2
      ),
      LST_WETH_UNIV2_$HRIMP_Pool: new this.web3.eth.Contract(
        POOL as any,
        addresses.LST_WETH_UNIV2_$HRIMP_Pool
      ),
      LST_WETH_UNIV2_B20_Pool: new this.web3.eth.Contract(
        POOL as any,
        addresses.LST_WETH_UNIV2_B20_Pool
      )
    };

    this.subscriptions = [
      // this.contracts.B20.events.allEvents({}).on('data', onEvent),
      this.contracts.B20_WETH_UNIV2.events.allEvents({}).on('data', onEvent),
      this.contracts.B20_WETH_UNIV2_B20_Pool.events
        .allEvents({})
        .on('data', onEvent),
      this.contracts.B20_WETH_UNIV2_LST_Pool.events
        .allEvents({})
        .on('data', onEvent),
      // this.contracts.$HRIMP.events.allEvents({}).on('data', onEvent),
      this.contracts.$HRIMP_WETH_UNIV2.events.allEvents({}).on('data', onEvent),
      this.contracts.$HRIMP_WETH_UNIV2_B20_Pool.events
        .allEvents({})
        .on('data', onEvent),
      // this.contracts.LST.events.allEvents({}).on('data', onEvent),
      this.contracts.LST_WETH_UNIV2.events.allEvents({}).on('data', onEvent),
      this.contracts.LST_WETH_UNIV2_$HRIMP_Pool.events
        .allEvents({})
        .on('data', onEvent),
      this.contracts.LST_WETH_UNIV2_B20_Pool.events
        .allEvents({})
        .on('data', onEvent),
      provider.on && provider.on('accountsChanged', () => this.initWallet()),
      provider.on && provider.on('chainChanged', () => this.initWallet()),
      provider.on && provider.on('connect', () => this.connect()),
      provider.on && provider.on('disconnect', () => this.disconnect())
    ].filter(item => !!item);

    this.timers = [
      setInterval(
        () => this.initWallet(),
        this.options.interval || DEFAULT_REFRESH
      )
    ];

    const getERC20Methods = (contract: any) => ({
      approve: send(contract.methods.approve),
      getAllowance: call(contract.methods.allowance),
      getBalance: call(contract.methods.balanceOf),
      totalSupply: call(contract.methods.totalSupply)
    });

    const getPoolMethods = (contract: any) => ({
      EPOCH_PERIOD: call(contract.methods.EPOCH_PERIOD),
      HEART_BEAT_START_TIME: call(contract.methods.HEART_BEAT_START_TIME),
      claim: send(contract.methods.claim),
      currentEpoch: call(contract.methods.currentEpoch),
      epochEndTimeFromTimestamp: call(
        contract.methods.epochEndTimeFromTimestamp
      ),
      getBalance: call(contract.methods.balanceOf),
      getEarned: call(contract.methods.earned),
      lastEpochStaked: call(contract.methods.lastEpochStaked),
      rewardRate: call(contract.methods.rewardRate),
      stake: send(contract.methods.stake),
      totalSupply: call(contract.methods.totalSupply),
      unstake: send(contract.methods.unstake)
    });

    const getUniV2Methods = (contract: any) => ({
      approve: send(contract.methods.approve),
      getAllowance: call(contract.methods.allowance),
      getBalance: call(contract.methods.balanceOf),
      totalSupply: call(contract.methods.totalSupply)
    });

    this.methods = {
      $HRIMP: getERC20Methods(this.contracts.$HRIMP),
      $HRIMP_WETH_UNIV2: getUniV2Methods(this.contracts.$HRIMP_WETH_UNIV2),
      $HRIMP_WETH_UNIV2_B20_Pool: getPoolMethods(
        this.contracts.$HRIMP_WETH_UNIV2_B20_Pool
      ),
      B20: getERC20Methods(this.contracts.B20),
      B20_WETH_UNIV2: getUniV2Methods(this.contracts.B20_WETH_UNIV2),
      B20_WETH_UNIV2_B20_Pool: getPoolMethods(
        this.contracts.B20_WETH_UNIV2_B20_Pool
      ),
      B20_WETH_UNIV2_LST_Pool: getPoolMethods(
        this.contracts.B20_WETH_UNIV2_LST_Pool
      ),
      LST: getERC20Methods(this.contracts.LST),
      LST_WETH_UNIV2: getUniV2Methods(this.contracts.LST_WETH_UNIV2),
      LST_WETH_UNIV2_$HRIMP_Pool: getPoolMethods(
        this.contracts.LST_WETH_UNIV2_$HRIMP_Pool
      ),
      LST_WETH_UNIV2_B20_Pool: getPoolMethods(
        this.contracts.LST_WETH_UNIV2_B20_Pool
      ),
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
