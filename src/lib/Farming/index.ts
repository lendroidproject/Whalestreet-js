// tslint:disable: no-expression-statement
// tslint:disable: no-object-mutation

import Web3 from 'web3';
import { ObjectMap, Token } from '../types';
import { call, send } from '../utils';
import ERC20 from './ABIs/ERC20.json';
import POOL from './ABIs/POOL.json';
import UNIV2 from './ABIs/UNIV2.json';

class Farming {
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
        ERC20 as any,
        this.netAddresses.$HRIMP
      ),
      $HRIMP_WETH_UNIV2: new this.web3.eth.Contract(
        UNIV2 as any,
        this.netAddresses.$HRIMP_WETH_UNIV2
      ),
      $HRIMP_WETH_UNIV2_B20_Pool: new this.web3.eth.Contract(
        POOL as any,
        this.netAddresses.$HRIMP_WETH_UNIV2_B20_Pool
      ),
      B20: new this.web3.eth.Contract(ERC20 as any, this.netAddresses.B20),
      B20_WETH_UNIV2: new this.web3.eth.Contract(
        UNIV2 as any,
        this.netAddresses.B20_WETH_UNIV2
      ),
      B20_WETH_UNIV2_B20_Pool: new this.web3.eth.Contract(
        POOL as any,
        this.netAddresses.B20_WETH_UNIV2_B20_Pool
      ),
      B20_WETH_UNIV2_LST_Pool: new this.web3.eth.Contract(
        POOL as any,
        this.netAddresses.B20_WETH_UNIV2_LST_Pool
      ),
      LST: new this.web3.eth.Contract(ERC20 as any, this.netAddresses.LST),
      LST_WETH_UNIV2: new this.web3.eth.Contract(
        UNIV2 as any,
        this.netAddresses.LST_WETH_UNIV2
      ),
      LST_WETH_UNIV2_$HRIMP_Pool: new this.web3.eth.Contract(
        POOL as any,
        this.netAddresses.LST_WETH_UNIV2_$HRIMP_Pool
      ),
      LST_WETH_UNIV2_B20_Pool: new this.web3.eth.Contract(
        POOL as any,
        this.netAddresses.LST_WETH_UNIV2_B20_Pool
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
      unstakeAndClaim: send(contract.methods.unstakeAndClaim)
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
      )
    };
  }
}

export default Farming;
