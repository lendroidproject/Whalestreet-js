// tslint:disable: no-expression-statement
// tslint:disable: no-object-mutation
// tslint:disable: object-literal-sort-keys

import Web3 from 'web3';
import { ObjectMap } from '../types';
import { call, send } from '../utils';
import ERC20 from './ABIs/ERC20.json';
import JAXBlast from './ABIs/JAXBlast.json';
import LiveNFT from './ABIs/LiveNFT.json';

class JAX {
  public network: number;
  public methods: any;

  private web3: Web3;
  private addresses: ObjectMap;
  private contracts: any;

  constructor(network: number, web3: Web3, addresses: ObjectMap) {
    this.network = network;
    this.web3 = web3;
    this.addresses = addresses;
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
      JAX: new this.web3.eth.Contract(ERC20 as any, this.netAddresses.JAX),
      JAXBlasts: this.netAddresses.JAXBlasts.map(
        (addr: string) => new this.web3.eth.Contract(JAXBlast as any, addr)
      ),
      SilverLive: new this.web3.eth.Contract(
        LiveNFT as any,
        this.netAddresses.SilverLive
      ),
      GoldLive: new this.web3.eth.Contract(
        LiveNFT as any,
        this.netAddresses.GoldLive
      ),
      PlatinumLive: new this.web3.eth.Contract(
        LiveNFT as any,
        this.netAddresses.PlatinumLive
      ),
      PalladiumLive: new this.web3.eth.Contract(
        LiveNFT as any,
        this.netAddresses.PalladiumLive
      ),
      JaxiumLive: new this.web3.eth.Contract(
        LiveNFT as any,
        this.netAddresses.JaxiumLive
      )
    };

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
      unstake: send(contract.methods.unstake),
      totalLpTokens: call(contract.methods.totalLpTokens),
      lpTokens: call(contract.methods.lpTokens),
      combine: send(contract.methods.combine),
    });

    const getNFTMethods = (contract: any) => ({
      approve: send(contract.methods.approve),
      setApprovalForAll: send(contract.methods.setApprovalForAll),
      getApproved: call(contract.methods.getApproved),
      getBalance: call(contract.methods.balanceOf),
      totalSupply: call(contract.methods.totalSupply)
    });

    this.methods = {
      JAX: getERC20Methods(this.contracts.JAX),
      JAXBlasts: this.contracts.JAXBlast.map(getPoolMethods),
      SilverLive: getNFTMethods(this.contracts.SilverLive),
      GoldLive: getNFTMethods(this.contracts.GoldLive),
      PlatinumLive: getNFTMethods(this.contracts.PlatinumLive),
      PalladiumLive: getNFTMethods(this.contracts.PalladiumLive),
      JaxiumLive: getNFTMethods(this.contracts.JaxiumLive)
    };
  }
}

export default JAX;
