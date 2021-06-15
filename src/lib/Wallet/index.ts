// tslint:disable: no-expression-statement
// tslint:disable: no-object-mutation

import BigNumber from 'bignumber.js';
import * as EvmChains from 'evm-chains';
// tslint:disable-next-line: no-implicit-dependencies

import Web3 from 'web3';
import Auctions from '../Auctions';
import B20 from '../B20';
import Farming from '../Farming';
import {
  Account,
  Library,
  LibraryMap,
  ObjectMapN,
  TimeConstants,
  Timer,
  WalletEvent,
  WalletEvents,
  WalletOptions
} from '../types';

class Wallet {
  public connected: boolean;

  private network: number;
  private instance: Web3;
  private account?: Account;
  private timer: Timer;
  private lastTimer: Timer;
  private handleEvent: WalletEvent;

  // tslint:disable-next-line: readonly-array
  private registers: string[];
  private libraries: LibraryMap;
  private addresses: ObjectMapN;

  constructor(options: WalletOptions) {
    this.connected = false;
    this.network = options.network;
    this.addresses = options.addresses;
    this.instance = new Web3(options.INFURA_ID);
    this.timer = this.lastTimer = null;
    this.handleEvent = options.OnEvent;
    this.registers = [];
    this.libraries = {};
    if (options.registers) {
      options.registers.forEach(lib => this.register(lib));
    }
  }

  get currentNetwork(): number {
    return this.account ? this.account.network : this.network;
  }

  get web3(): Web3 {
    return this.instance;
  }

  public toWei(value: string | number, decimals: number = 18): string {
    return decimals === 18
      ? this.web3.utils.toWei(value.toString())
      : new BigNumber(value).times(10 ** decimals).toString(10);
  }

  public fromWei(value: string | number, decimals: number = 18): string {
    return decimals === 18
      ? this.web3.utils.fromWei(value.toString())
      : new BigNumber(value).div(10 ** decimals).toString(10);
  }

  public connect(prov: any): void {
    if (!prov) return;
    this.connected = true;
    this.setProvider(prov);
    this.timer = this.lastTimer = setInterval(() => {
      this.fetchAccount();
    }, TimeConstants.ACCOUNT_FETCH_TIME);
    this.fetchAccount();
  }

  public updateProvider(prov: any): void {
    if (!prov) return;
    if (this.timer) clearInterval(this.timer);
    this.setProvider(prov);
    this.timer = setInterval(() => {
      this.fetchAccount();
    }, TimeConstants.ACCOUNT_FETCH_TIME);
    this.fetchAccount();
  }

  public disconnect(): void {
    if (this.web3.givenProvider.disconnect) {
      this.web3.givenProvider.disconnect();
    }
    this.connected = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public register(key: string): void {
    let lib: Library | null = null;
    if (this.libraries[key]) return;
    switch (key) {
      case 'farming':
        lib = new Farming(
          this.currentNetwork,
          this.instance,
          this.addresses
        ) as Library;
        break;
      case 'auctions':
        lib = new Auctions(
          this.currentNetwork,
          this.instance,
          this.addresses
        ) as Library;
        break;
      case 'b20':
        lib = new B20(
          this.currentNetwork,
          this.instance,
          this.addresses
        ) as Library;
        break;
      default:
        lib = null;
        break;
    }
    if (!lib) return;
    this.libraries[key] = lib;
    this.registers.push(key);
    this.handleEvent(WalletEvents.LIBRARY, [key, lib]);
  }

  public deRegister(key: string): void {
    this.registers = this.registers.filter((k: string) => k !== key);
    delete this.libraries[key];
  }

  public async fetchAccount(refresh: boolean = false): Promise<boolean> {
    if (!this.connected) return false;
    if (this.timer !== this.lastTimer) {
      this.lastTimer = this.timer;
      return false;
    }
    const chainId = await this.web3.eth.getChainId();
    const { networkId: network } = await EvmChains.getChain(chainId);
    const [address] = await this.web3.eth.getAccounts();
    const balance = address
      ? this.web3.utils.fromWei(await this.web3.eth.getBalance(address))
      : '0';
    const account: Account = {
      address,
      balance,
      network
    };
    const isNew = this.checkAccount(account);
    if (isNew || refresh) {
      this.account = account;
      this.handleEvent(WalletEvents.ACCOUNT, this.account);
    }
    return isNew;
  }

  public getBlock(field: string = 'timestamp'): Promise<any> {
    return new Promise((resolve, reject) =>
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
    );
  }

  private setProvider(prov: any): void {
    // if (this.instance.givenProvider.disconnect) {
    //   this.instance.givenProvider.disconnect();
    // }
    if (this.instance.givenProvider.removeAllListeners) {
      this.instance.givenProvider.removeAllListeners('accountsChanged');
      this.instance.givenProvider.removeAllListeners('chainChanged');
      this.instance.givenProvider.removeAllListeners('disconnect');
    }
    this.instance.setProvider(prov);
    if (prov.on) {
      prov.on('accountsChanged', () => this.fetchAccount());
      prov.on('chainChanged', () => this.fetchAccount());
      prov.on('disconnect', () => this.disconnect());
    }

    this.registers.map((key: string) => this.libraries[key].reset());
  }

  private checkAccount(newAccount: Account): boolean {
    return !this.account
      ? true
      : this.account.address === newAccount.address &&
        this.account.network === newAccount.network &&
        this.account.balance === newAccount.balance
      ? false
      : true;
  }
}

export default Wallet;
