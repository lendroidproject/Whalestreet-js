// tslint:disable: no-expression-statement
// tslint:disable: no-object-mutation

import Web3 from 'web3';
import { ObjectMap, Token } from '../types'
import { call, send } from '../utils'

import Buyout from './ABIs/Buyout.json';
import Market from './ABIs/Market.json';
import NFT from './ABIs/NFT.json';
import Token0 from './ABIs/Token0.json';
import Token1 from './ABIs/Token1.json';
import Token2 from './ABIs/Token2.json';
import Vault from './ABIs/Vault.json';

class B20 {
  public network: number;
  public methods: any;
  public tokens: Token[];

  private web3: Web3;
  private addresses: ObjectMap;
  private contracts: any;

  constructor(network: number, web3: Web3, addresses: ObjectMap) {
    this.network = network;
    this.web3 = web3;
    this.addresses = addresses;
    this.tokens = [];
    this.init();
  }

  get netAddresses(): ObjectMap {
    return this.addresses[this.network];
  }

  public reset(): void {
    this.init();
  }

  private async init(): Promise<void> {
    this.contracts = {
      Buyout: new this.web3.eth.Contract(
        Buyout as any,
        this.netAddresses.Buyout
      ),
      Market1: new this.web3.eth.Contract(
        Market as any,
        this.netAddresses.Market1
      ),
      Market2: new this.web3.eth.Contract(
        Market as any,
        this.netAddresses.Market2
      ),
      Token0: new this.web3.eth.Contract(
        Token0 as any,
        this.netAddresses.Token0
      ),
      Token1: new this.web3.eth.Contract(
        Token1 as any,
        this.netAddresses.Token1
      ),
      Token2: new this.web3.eth.Contract(
        Token2 as any,
        this.netAddresses.Token2
      ),
      Vault: new this.web3.eth.Contract(Vault as any, this.netAddresses.Vault),
      Vault2: new this.web3.eth.Contract(Vault as any, this.netAddresses.Vault2)
    };

    this.methods = {
      Buyout: {
        EPOCH_PERIOD: call(this.contracts.Buyout.methods.EPOCH_PERIOD),
        HEART_BEAT_START_TIME: call(
          this.contracts.Buyout.methods.HEART_BEAT_START_TIME
        ),
        currentBidId: call(this.contracts.Buyout.methods.currentBidId),
        currentBidToken0Staked: call(
          this.contracts.Buyout.methods.currentBidToken0Staked
        ),
        currentEpoch: call(this.contracts.Buyout.methods.currentEpoch),
        epochs: call(this.contracts.Buyout.methods.epochs),
        extendVeto: send(this.contracts.Buyout.methods.extendVeto),
        highestBidValues: call(
          this.contracts.Buyout.methods.highestBidValues
        ),
        highestBidder: call(this.contracts.Buyout.methods.highestBidder),
        lastVetoedBidId: call(
          this.contracts.Buyout.methods.lastVetoedBidId
        ),
        placeBid: send(this.contracts.Buyout.methods.placeBid),
        redeem: send(this.contracts.Buyout.methods.redeem),
        redeemToken2Amount: call(
          this.contracts.Buyout.methods.redeemToken2Amount
        ),
        requiredToken0ToBid: call(
          this.contracts.Buyout.methods.requiredToken0ToBid
        ),
        startThreshold: call(this.contracts.Buyout.methods.startThreshold),
        status: call(this.contracts.Buyout.methods.status),
        stopThresholdPercent: call(
          this.contracts.Buyout.methods.stopThresholdPercent
        ),
        token0Staked: call(this.contracts.Buyout.methods.token0Staked),
        token2AmountRedeemable: call(
          this.contracts.Buyout.methods.token2AmountRedeemable
        ),
        veto: send(this.contracts.Buyout.methods.veto),
        withdrawStakedToken0: send(
          this.contracts.Buyout.methods.withdrawStakedToken0
        )
      },
      Market1: {
        contributeWei: send(this.contracts.Market1.methods.pay),
        contributors: (offset = 0, limit = 14) =>
          new Promise((resolve, reject) => {
            Promise.all(
              new Array(limit).fill(0).map(
                (_: any, idx: number) =>
                  new Promise((res: (value: string) => void) => {
                    call(this.contracts.Market1.methods.buyers)(
                      idx + offset
                    )
                      .then((address: string) => res(address))
                      .catch(() => res(''));
                  })
              )
            )
              .then((contributors: readonly string[]) =>
                Promise.all(
                  contributors
                    .filter(item => !!item)
                    .map(
                      (address: string) =>
                        new Promise((res, rej) => {
                          call(this.contracts.Market1.methods.payments)(
                            address
                          )
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
        createMarket: send(this.contracts.Market1.methods.createMarket),
        marketClosed: call(this.contracts.Market1.methods.marketClosed),
        marketStart: call(this.contracts.Market1.methods.marketStart),
        marketStatus: call(this.contracts.Market1.methods.marketStatus),
        token1PerToken0: call(
          this.contracts.Market1.methods.token1PerToken0
        ),
        totalBuyers: call(this.contracts.Market1.methods.totalBuyers),
        totalCap: call(this.contracts.Market1.methods.totalCap),
        totaltoken1Paid: call(
          this.contracts.Market1.methods.totaltoken1Paid
        )
      },
      Market2: {
        contributeWei: send(this.contracts.Market2.methods.pay),
        contributors: (offset = 0, limit = 14) =>
          new Promise((resolve, reject) => {
            Promise.all(
              new Array(limit).fill(0).map(
                (_: any, idx: number) =>
                  new Promise((res: (value: string) => void) => {
                    call(this.contracts.Market2.methods.buyers)(
                      idx + offset
                    )
                      .then((address: string) => res(address))
                      .catch(() => res(''));
                  })
              )
            )
              .then((contributors: readonly string[]) =>
                Promise.all(
                  contributors
                    .filter(item => !!item)
                    .map(
                      (address: string) =>
                        new Promise((res, rej) => {
                          call(this.contracts.Market2.methods.payments)(
                            address
                          )
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
        createMarket: send(this.contracts.Market2.methods.createMarket),
        marketClosed: call(this.contracts.Market2.methods.marketClosed),
        marketStart: call(this.contracts.Market2.methods.marketStart),
        marketStatus: call(this.contracts.Market2.methods.marketStatus),
        token1PerToken0: call(
          this.contracts.Market2.methods.token1PerToken0
        ),
        totalBuyers: call(this.contracts.Market2.methods.totalBuyers),
        totalCap: call(this.contracts.Market2.methods.totalCap),
        totaltoken1Paid: call(
          this.contracts.Market2.methods.totaltoken1Paid
        )
      },
      NFT: (contract: any, init: boolean = false) =>
        init
          ? new this.web3.eth.Contract(NFT as any, contract)
          : {
              isApprovedForAll: call(contract.methods.isApprovedForAll), // owner, operator
              setApprovalForAll: send(contract.methods.setApprovalForAll) // operator, approved
            },
      Token0: {
        approve: send(this.contracts.Token0.methods.approve),
        balanceOf: call(this.contracts.Token0.methods.balanceOf),
        getAllowance: call(this.contracts.Token0.methods.allowance),
        name: call(this.contracts.Token0.methods.name),
        symbol: call(this.contracts.Token0.methods.symbol),
        totalSupply: call(this.contracts.Token0.methods.totalSupply)
      },
      Token1: {
        approve: send(this.contracts.Token1.methods.approve),
        balanceOf: call(this.contracts.Token1.methods.balanceOf),
        getAllowance: call(this.contracts.Token1.methods.allowance),
        name: call(this.contracts.Token1.methods.name),
        symbol: call(this.contracts.Token1.methods.symbol),
        totalSupply: call(this.contracts.Token1.methods.totalSupply)
      },
      Token2: {
        approve: send(this.contracts.Token2.methods.approve),
        balanceOf: call(this.contracts.Token2.methods.balanceOf),
        getAllowance: call(this.contracts.Token2.methods.allowance),
        name: call(this.contracts.Token2.methods.name),
        symbol: call(this.contracts.Token2.methods.symbol),
        totalSupply: call(this.contracts.Token2.methods.totalSupply)
      },
      Vault: {
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
                                category: asset.category,
                                id: offset + idx,
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
        lockVault: send(this.contracts.Vault.methods.lockVault),
        locked: call(this.contracts.Vault.methods.locked),
        owner: call(this.contracts.Vault.methods.owner),
        safeAddAsset: send(this.contracts.Vault.methods.safeAddAsset),
        safeTransferAsset: send(
          this.contracts.Vault.methods.safeTransferAsset
        ),
        totalAssets: call(this.contracts.Vault.methods.totalAssetSlots),
        transferOwnership: send(
          this.contracts.Vault.methods.transferOwnership
        ),
        unlockVault: send(this.contracts.Vault.methods.unlockVault)
      },
      Vault2: {
        assets: (offset = 0, limit = 20) =>
          new Promise((resolve, reject) => {
            call(this.contracts.Vault2.methods.totalAssetSlots)()
              .then(totalAssets =>
                Promise.all(
                  new Array(Number(Math.min(totalAssets - offset, limit)))
                    .fill(0)
                    .map(
                      (_: any, idx: number) =>
                        new Promise(res => {
                          call(this.contracts.Vault2.methods.assets)(
                            offset + idx
                          )
                            .then(asset =>
                              res({
                                category: asset.category,
                                id: offset + idx,
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
        lockVault: send(this.contracts.Vault2.methods.lockVault),
        locked: call(this.contracts.Vault2.methods.locked),
        owner: call(this.contracts.Vault2.methods.owner),
        safeAddAsset: send(this.contracts.Vault2.methods.safeAddAsset),
        safeTransferAsset: send(
          this.contracts.Vault2.methods.safeTransferAsset
        ),
        totalAssets: call(this.contracts.Vault2.methods.totalAssetSlots),
        transferOwnership: send(
          this.contracts.Vault2.methods.transferOwnership
        ),
        unlockVault: send(this.contracts.Vault2.methods.unlockVault)
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
  }
}

export default B20;
