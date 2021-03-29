// tslint:disable no-if-statement
// tslint:disable no-object-mutation
// tslint:disable no-expression-statement
// tslint:disable: no-this
// tslint:disable: typedef
// tslint:disable: readonly-keyword
// tslint:disable: no-class
// tslint:disable: readonly-array
// tslint:disable: no-let

import Web3 from 'web3';
import * as EvmChains from 'evm-chains';

import Market from './ABIs/Market.json';
import Token0 from './ABIs/Token0.json';
import Token1 from './ABIs/Token1.json';
import Token2 from './ABIs/Token2.json';
import Vault from './ABIs/Vault.json';
import Buyout from './ABIs/Buyout.json';
import NFT from './ABIs/NFT.json';

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
    this.disconnect();
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
    this.web3.givenProvider.disconnect && this.web3.givenProvider.disconnect();
    delete this.wallet.address;
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
      Market1: new this.web3.eth.Contract(Market as any, addresses.Market1),
      Market2: new this.web3.eth.Contract(Market as any, addresses.Market2),
      Token0: new this.web3.eth.Contract(Token0 as any, addresses.Token0),
      Token1: new this.web3.eth.Contract(Token1 as any, addresses.Token1),
      Token2: new this.web3.eth.Contract(Token2 as any, addresses.Token2),
      Vault: new this.web3.eth.Contract(Vault as any, addresses.Vault),
      Buyout: new this.web3.eth.Contract(Buyout as any, addresses.Buyout)
    };

    this.subscriptions = [
      this.contracts.Token0.events
        .allEvents({
          // ...
        })
        .on('data', onEvent),
      this.contracts.Token1.events
        .allEvents({
          // ...
        })
        .on('data', onEvent),
      this.contracts.Market1.events
        .allEvents({
          // ...
        })
        .on('data', onEvent),
      this.contracts.Market2.events
        .allEvents({
          // ...
        })
        .on('data', onEvent),
      this.contracts.Vault.events
        .allEvents({
          // ...
        })
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

    this.methods = {
      Market1: {
        createMarket: send(this.contracts.Market1.methods.createMarket),
        marketStart: call(this.contracts.Market1.methods.marketStart),
        marketStatus: call(this.contracts.Market1.methods.marketStatus),
        marketClosed: call(this.contracts.Market1.methods.marketClosed),
        contributeWei: send(this.contracts.Market1.methods.pay),
        contributors: (offset = 0, limit = 14) =>
          new Promise((resolve, reject) => {
            Promise.all(
              new Array(limit).fill(0).map(
                (_: any, idx: number) =>
                  new Promise((res: (value: string) => void) => {
                    call(this.contracts.Market1.methods.buyers)(idx + offset)
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
                          call(this.contracts.Market1.methods.payments)(address)
                            .then(token1Amount => {
                              res({
                                address,
                                hasWithdrawn: 0,
                                token1Amount
                              });
                            })
                            .catch(rej);
                        })
                    )
                )
                  .then(resolve)
                  .catch(reject)
              )
              .catch(reject);
          }),
        totaltoken1Paid: call(this.contracts.Market1.methods.totaltoken1Paid),
        totalCap: call(this.contracts.Market1.methods.totalCap),
        totalBuyers: call(this.contracts.Market1.methods.totalBuyers),
        token1PerToken0: call(this.contracts.Market1.methods.token1PerToken0)
      },
      Market2: {
        createMarket: send(this.contracts.Market2.methods.createMarket),
        marketStart: call(this.contracts.Market2.methods.marketStart),
        marketStatus: call(this.contracts.Market2.methods.marketStatus),
        marketClosed: call(this.contracts.Market2.methods.marketClosed),
        contributeWei: send(this.contracts.Market2.methods.pay),
        contributors: (offset = 0, limit = 14) =>
          new Promise((resolve, reject) => {
            Promise.all(
              new Array(limit).fill(0).map(
                (_: any, idx: number) =>
                  new Promise((res: (value: string) => void) => {
                    call(this.contracts.Market2.methods.buyers)(idx + offset)
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
                          call(this.contracts.Market2.methods.payments)(address)
                            .then(token1Amount => {
                              res({
                                address,
                                hasWithdrawn: 0,
                                token1Amount
                              });
                            })
                            .catch(rej);
                        })
                    )
                )
                  .then(resolve)
                  .catch(reject)
              )
              .catch(reject);
          }),
        totaltoken1Paid: call(this.contracts.Market2.methods.totaltoken1Paid),
        totalCap: call(this.contracts.Market2.methods.totalCap),
        totalBuyers: call(this.contracts.Market2.methods.totalBuyers),
        token1PerToken0: call(this.contracts.Market2.methods.token1PerToken0)
      },
      Token0: {
        approve: send(this.contracts.Token0.methods.approve),
        getAllowance: call(this.contracts.Token0.methods.allowance),
        balanceOf: call(this.contracts.Token0.methods.balanceOf),
        name: call(this.contracts.Token0.methods.name),
        symbol: call(this.contracts.Token0.methods.symbol),
        totalSupply: call(this.contracts.Token0.methods.totalSupply)
      },
      Token1: {
        approve: send(this.contracts.Token1.methods.approve),
        getAllowance: call(this.contracts.Token1.methods.allowance),
        balanceOf: call(this.contracts.Token1.methods.balanceOf),
        name: call(this.contracts.Token1.methods.name),
        symbol: call(this.contracts.Token1.methods.symbol),
        totalSupply: call(this.contracts.Token1.methods.totalSupply)
      },
      Token2: {
        approve: send(this.contracts.Token2.methods.approve),
        getAllowance: call(this.contracts.Token2.methods.allowance),
        balanceOf: call(this.contracts.Token2.methods.balanceOf),
        name: call(this.contracts.Token2.methods.name),
        symbol: call(this.contracts.Token2.methods.symbol),
        totalSupply: call(this.contracts.Token2.methods.totalSupply)
      },
      Vault: {
        owner: call(this.contracts.Vault.methods.owner),
        assets: (offset = 0, limit = 20) =>
          new Promise((resolve, reject) => {
            call(this.contracts.Vault.methods.totalAssetSlots)()
              .then(totalAssets =>
                Promise.all(
                  new Array(Number(Math.min(totalAssets - offset, limit)))
                    .fill(0)
                    .map(
                      (_: any, idx: number) =>
                        new Promise(res => {
                          call(this.contracts.Vault.methods.assets)(
                            offset + idx
                          )
                            .then(asset =>
                              res({
                                id: offset + idx,
                                category: asset.category,
                                tokenAddress: asset.tokenAddress,
                                tokenId: asset.tokenId
                              })
                            )
                            .catch(() => res(null));
                        })
                    )
                )
                  .then(assets => resolve(assets.filter(item => !!item)))
                  .catch(reject)
              )
              .catch(reject);
          }),
        totalAssets: call(this.contracts.Vault.methods.totalAssetSlots),
        safeAddAsset: send(this.contracts.Vault.methods.safeAddAsset),
        safeTransferAsset: send(this.contracts.Vault.methods.safeTransferAsset),
        locked: call(this.contracts.Vault.methods.locked),
        lockVault: send(this.contracts.Vault.methods.lockVault),
        unlockVault: send(this.contracts.Vault.methods.unlockVault),
        transferOwnership: send(this.contracts.Vault.methods.transferOwnership)
      },
      Buyout: {
        EPOCH_PERIOD: call(this.contracts.Buyout.methods.EPOCH_PERIOD),
        HEART_BEAT_START_TIME: call(
          this.contracts.Buyout.methods.HEART_BEAT_START_TIME
        ),
        epochs: call(this.contracts.Buyout.methods.epochs),
        status: call(this.contracts.Buyout.methods.status),
        startThreshold: call(this.contracts.Buyout.methods.startThreshold),
        highestBidder: call(this.contracts.Buyout.methods.highestBidder),
        highestBidValues: call(this.contracts.Buyout.methods.highestBidValues),
        requiredToken0ToBid: call(
          this.contracts.Buyout.methods.requiredToken0ToBid
        ),
        token0Staked: call(this.contracts.Buyout.methods.token0Staked),
        lastVetoedBidId: call(this.contracts.Buyout.methods.lastVetoedBidId),
        currentBidId: call(this.contracts.Buyout.methods.currentBidId),
        currentBidToken0Staked: call(
          this.contracts.Buyout.methods.currentBidToken0Staked
        ),
        currentEpoch: call(this.contracts.Buyout.methods.currentEpoch),
        token2AmountRedeemable: call(
          this.contracts.Buyout.methods.token2AmountRedeemable
        ),
        stopThresholdPercent: call(
          this.contracts.Buyout.methods.stopThresholdPercent
        ),
        redeemToken2Amount: call(
          this.contracts.Buyout.methods.redeemToken2Amount
        ),
        placeBid: send(this.contracts.Buyout.methods.placeBid),
        veto: send(this.contracts.Buyout.methods.veto),
        extendVeto: send(this.contracts.Buyout.methods.extendVeto),
        withdrawStakedToken0: send(
          this.contracts.Buyout.methods.withdrawStakedToken0
        ),
        redeem: send(this.contracts.Buyout.methods.redeem)
      },
      NFT: (contract: any, init: boolean = false) =>
        init
          ? new this.web3.eth.Contract(NFT as any, contract)
          : {
              isApprovedForAll: call(contract.methods.isApprovedForAll), // owner, operator
              setApprovalForAll: send(contract.methods.setApprovalForAll) // operator, approved
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
