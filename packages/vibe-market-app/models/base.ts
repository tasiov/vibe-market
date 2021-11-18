import _ from 'lodash';
import { Commitment, PublicKey } from '@solana/web3.js';

export class BaseAccount<T> {
  constructor(public publicKey: PublicKey, public data: T) {}

  serialize = () => ({
    publicKey: this.publicKey.toBase58(),
    data: this.data,
  });
}

export type AccountMap<T> = { [key: string]: T | undefined };

export abstract class BaseAccountManager<S, T extends BaseAccount<S>> {
  _subscriptionsMap: Record<string, number> = {};

  constructor() {}

  abstract isValid(account: any): account is T;

  abstract toDomain(account: any, publicKey: PublicKey): any;

  transform = async (account: any, publicKey: PublicKey): Promise<T> => {
    let domainAccount: any;
    try {
      domainAccount = await this.toDomain(account, publicKey);
    } catch (err) {
      console.error(`Failed to transform account ${publicKey}`);
      throw err;
    }
    if (!this.isValid(domainAccount)) {
      throw new Error(`Account ${publicKey} is invalid`);
    }
    return domainAccount;
  };

  abstract fetch(publicKey: PublicKey): Promise<T>;

  abstract fetchMulti(publicKeys: PublicKey[]): Promise<AccountMap<T>>;

  abstract subscribe(
    publicKey: PublicKey,
    callback: (account: T) => any,
    commitment?: Commitment,
  ): void;

  abstract unsubscribe(publicKey: PublicKey, force?: boolean): void;

  async subscribeAndFetch(
    publicKey: PublicKey,
    callback: (account: T) => any,
    commitment?: Commitment,
  ): Promise<T> {
    this.subscribe(publicKey, callback, commitment);
    return await this.fetch(publicKey);
  }

  async fetchNewAccount(
    publicKey: PublicKey,
    timeout: number = 20000,
    commitment: Commitment = 'processed',
  ): Promise<T> {
    let account = await this.fetch(publicKey);
    if (account) {
      return account;
    }
    account = await new Promise((resolve, reject) => {
      this.subscribe(publicKey, resolve, commitment);
      setTimeout(() => {
        reject(new Error('Reached timeout before account change'));
      }, timeout);
    });
    this.unsubscribe(publicKey);
    return account;
  }
}
