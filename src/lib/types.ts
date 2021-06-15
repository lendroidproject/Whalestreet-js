export type Any = any;
export type AnanParams = any[];
export type WalletEvent = (event: string, data: Any) => void;
export type LibraryEvent = (type: string, payload: any, error: any) => void;
export type Timer = NodeJS.Timeout | null;

export interface StringMap {
  [key: string]: any;
}
export interface StringMapN {
  [key: number]: any;
}
export interface ObjectMap {
  [key: string]: any;
}
export interface ObjectMapN {
  [key: number]: any;
}

export interface Account {
  network: number;
  address: string;
  balance: string;
}

export interface WalletOptions {
  network: number;
  addresses: ObjectMapN;
  INFURA_ID: string;
  OnEvent: WalletEvent;
  registers?: string[];
}

export interface Addresses {
  [key: string]: string;
}

export interface LibraryOptions {
  readonly onEvent?: LibraryEvent;
  readonly addresses: Addresses;
}

export interface State {
  account?: Account;
  wallet?: any;
  [key: string]: any;
}

export interface Action {
  type: string;
  payload: Any;
}

export enum TimeConstants {
  ACCOUNT_FETCH_TIME = 5 * 1000,
  LIBRARY_FETCH_TIME = 15 * 1000
}

export enum WalletEvents {
  ACCOUNT = 'ACCOUNT',
  WALLET = 'WALLET',
  LIBRARY = 'LIBRARY',
  DISCONNECTED = 'DISCONNECTED'
}

export enum LibraryEvents {
  INIT = 'INIT',
  DATA = 'DATA'
}

export interface Library {
  reset: () => void;
}

export interface LibraryMap {
  [key: string]: Library;
}

export interface PageProps {
  state: State;
  // tslint:disable-next-line: ban-types
  dispatch: Function;
  [key: string]: any;
}

export interface SendOption {
  from: string;
  value?: string | number;
}

export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  balance: string;
  allowance: string;
}

export interface SwapToken {
  symbol: string;
  address: string;
  decimals: number;
  amount: string;
}

export interface AirdropToken {
  address: string;
  symbol: string;
  decimals: number;
  claimable: string;
}
