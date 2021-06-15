// tslint:disable: no-expression-statement
// tslint:disable: no-object-mutation

import Web3 from 'web3';
import { ObjectMap, Token } from '../types'
import { call, send } from '../utils'

import $HRIMP from './ABIs/$HRIMP.json';
import AuctionCurve from './ABIs/AuctionCurve.json';
import AuctionRegistry from './ABIs/AuctionRegistry.json';
import WhaleSwap from './ABIs/WhaleSwap.json';

class Auctions {
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

  private init(): void {
    this.contracts = {
      $HRIMP: new this.web3.eth.Contract(
        $HRIMP as any,
        this.netAddresses.$HRIMP
      ),
      AuctionRegistry: new this.web3.eth.Contract(
        AuctionRegistry as any,
        this.netAddresses.AuctionRegistry
      ),
      WhaleSwap: new this.web3.eth.Contract(
        WhaleSwap as any,
        this.netAddresses.WhaleSwap
      )
    };

    this.methods = {
      $HRIMP: {
        approve: send(this.contracts.$HRIMP.methods.approve),
        getAllowance: (addr: string) =>
          call(this.contracts.$HRIMP.methods.allowance)(
            addr,
            this.netAddresses.AuctionRegistry
          ),
        getBalance: call(this.contracts.$HRIMP.methods.balanceOf),
        totalSupply: call(this.contracts.$HRIMP.methods.totalSupply)
      },
      AuctionRegistry: {
        currentEpoch: () => {
          return new Promise((resolve, reject) => {
            this.contracts.AuctionRegistry.methods
              .auctionCurve()
              .call()
              .then((auctionCurve: string) => {
                const curve = new this.web3.eth.Contract(
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
        currentPrice: call(
          this.contracts.AuctionRegistry.methods.currentPrice
        ),
        epochEndTimeFromTimestamp: (timestamp: any) => {
          return new Promise((resolve, reject) => {
            this.contracts.AuctionRegistry.methods
              .auctionCurve()
              .call()
              .then((auctionCurve: string) => {
                const curve = new this.web3.eth.Contract(
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
        maxY: () => {
          return new Promise((resolve, reject) => {
            this.contracts.AuctionRegistry.methods
              .auctionCurve()
              .call()
              .then((auctionCurve: string) => {
                const curve = new this.web3.eth.Contract(
                  AuctionCurve as any,
                  auctionCurve
                );
                curve.methods
                  .maxY()
                  .call()
                  .then(resolve)
                  .catch(reject);
              })
              .catch(reject);
          });
        },
        minY: () => {
          return new Promise((resolve, reject) => {
            this.contracts.AuctionRegistry.methods
              .auctionCurve()
              .call()
              .then((auctionCurve: string) => {
                const curve = new this.web3.eth.Contract(
                  AuctionCurve as any,
                  auctionCurve
                );
                curve.methods
                  .minY()
                  .call()
                  .then(resolve)
                  .catch(reject);
              })
              .catch(reject);
          });
        },
        purchase: send(this.contracts.AuctionRegistry.methods.purchase),
        purchases: call(this.contracts.AuctionRegistry.methods.defiKeys),
        totalPurchases: call(
          this.contracts.AuctionRegistry.methods.totalDefiKeys
        )
      },
      WhaleSwap: {
        approve: send(this.contracts.WhaleSwap.methods.approve),
        getBalance: call(this.contracts.WhaleSwap.methods.balanceOf)
      },
      addresses: {
        getName: (addr: string) =>
          Object.keys(this.netAddresses).find(
            k => this.netAddresses[k].toLowerCase() === addr.toLowerCase()
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
          ),
        setProvider: (prov: any) => {
          this.web3.setProvider(prov);
          this.contracts.AuctionRegistry = new this.web3.eth.Contract(
            AuctionRegistry as any,
            this.netAddresses.AuctionRegistry
          );
          this.contracts.WhaleSwap = new this.web3.eth.Contract(
            WhaleSwap as any,
            this.netAddresses.WhaleSwap
          );
        }
      }
    };
  }
}

export default Auctions;
