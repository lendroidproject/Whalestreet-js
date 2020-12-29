// tslint:disable no-if-statement
// tslint:disable no-object-mutation
// tslint:disable no-expression-statement
import * as EvmChains from 'evm-chains';
import Web3 from 'web3';

import ShardGenerationEvent from './ABIs/ShardGenerationEvent.json';
import ShardToken from './ABIs/ShardToken.json';
import Vault from './ABIs/Vault.json';

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

// tslint:disable: no-this
// tslint:disable: typedef
// tslint:disable: readonly-keyword
// tslint:disable: no-class
// tslint:disable: readonly-array
// tslint:disable: no-let

class B20 {
  public web3: Web3;
  public contracts: any;
  public methods: any;
  private wallet: any = {};
  private options: any;
  private subscriptions: any = [];
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
    if (this.web3.givenProvider.disconnect) {
      this.web3.givenProvider.disconnect();
    }
    this.reset();
  }

  private reset() {
    this.subscriptions.forEach((subscription: any) => {
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
      ShardGenerationEvent: new this.web3.eth.Contract(
        ShardGenerationEvent as any,
        addresses.ShardGenerationEvent
      ),
      ShardToken: new this.web3.eth.Contract(
        ShardToken as any,
        addresses.ShardToken
      ),
      Vault: new this.web3.eth.Contract(Vault as any, addresses.Vault)
    };

    this.subscriptions = [
      this.contracts.ShardToken.events
        .allEvents(
          {
            // ...
          },
          // tslint:disable-next-line: no-console
          console.info
        )
        .on('data', onEvent),
      this.contracts.ShardGenerationEvent.events
        .allEvents(
          {
            // ...
          },
          // tslint:disable-next-line: no-console
          console.info
        )
        .on('data', onEvent),
      this.contracts.Vault.events
        .allEvents(
          {
            // ...
          },
          // tslint:disable-next-line: no-console
          console.info
        )
        .on('data', onEvent),
      provider.on && provider.on('accountsChanged', () => this.initWallet()),
      provider.on && provider.on('networkChanged', () => this.initWallet()),
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
      ShardGenerationEvent: {
        claimShards: send(
          this.contracts.ShardGenerationEvent.methods.claimShards
        ),
        contributeWei: send(
          this.contracts.ShardGenerationEvent.methods.contributeWei
        ),
        contributors: (offset = 0, limit = 14) =>
          new Promise((resolve, reject) => {
            Promise.all(
              new Array(limit).fill(0).map(
                (_: any, idx: number) =>
                  new Promise((res: (value: string) => void) => {
                    call(
                      this.contracts.ShardGenerationEvent.methods.contributors
                    )(idx + offset)
                      .then((address: string) => res(address))
                      .catch(() => res(''));
                  })
              )
            )
              .then((contributors: string[]) =>
                Promise.all(
                  contributors
                    .filter(item => !!item)
                    .map(
                      (address: string) =>
                        new Promise((res, rej) => {
                          call(
                            this.contracts.ShardGenerationEvent.methods
                              .contributions
                          )(address)
                            .then(contributorInfo =>
                              res({
                                address,
                                hasWithdrawn: contributorInfo.hasWithdrawn,
                                weiContributed: contributorInfo.weiContributed
                              })
                            )
                            .catch(rej);
                        })
                    )
                )
                  .then(resolve)
                  .catch(reject)
              )
              .catch(reject);
          }),
        endTimestamp: call(
          this.contracts.ShardGenerationEvent.methods.endTimestamp
        ),
        shardPerWeiContributed: call(
          this.contracts.ShardGenerationEvent.methods.shardPerWeiContributed
        ),
        totalCapWeiAmount: call(
          this.contracts.ShardGenerationEvent.methods.totalCapInWei
        ),
        totalWeiContributed: call(
          this.contracts.ShardGenerationEvent.methods.totalWeiContributed
        )
      },
      ShardToken: {
        balanceOf: () =>
          call(this.contracts.ShardToken.methods.balanceOf)(
            this.addresses.ShardGenerationEvent
          ),
        name: call(this.contracts.ShardToken.methods.name)
      },
      Vault: {
        assets: (offset = 0, limit = 20) =>
          new Promise((resolve, reject) => {
            call(this.contracts.Vault.methods.totalAssets)()
              .then(totalAssets =>
                Promise.all(
                  new Array(Number(Math.min(totalAssets - offset, limit)))
                    .fill(0)
                    .map(
                      (_: any, idx: number) =>
                        new Promise((res, rej) => {
                          call(this.contracts.Vault.methods.assets)(idx)
                            .then(asset =>
                              res({
                                category: asset.category,
                                tokenAddress: asset.tokenAddress,
                                tokenId: asset.tokenId
                              })
                            )
                            .catch(rej);
                        })
                    )
                )
                  .then(resolve)
                  .catch(reject)
              )
              .catch(reject);
          })
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

export default B20;
