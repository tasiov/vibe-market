import _ from "lodash"
import React, { ReactNode } from "react"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import * as Models from "../models"

export interface AnchorAccountCacheProviderProps {
  vibeMarketProgram: Program
  children: ReactNode
}

type AccountMap<T> = { [key: string]: T }

export interface AnchorAccountCacheProviderState {
  [Models.GlobalState.AccountType]: AccountMap<Models.GlobalState.GlobalState>
  [Models.Market.AccountType]: AccountMap<Models.Market.Market>
}

type Awaited<T> = T extends PromiseLike<infer U> ? U : T

type ManagerReturnType = Awaited<
  ReturnType<
    AnchorAccountCacheProvider["accountManagers"][keyof AnchorAccountCacheProvider["accountManagers"]]["fetch"]
  >
>

export type SpecificAccountType<T extends Models.AccountTypes> =
  AnchorAccountCacheProviderState[T][keyof AnchorAccountCacheProviderState[T]]

export type SpecificAccountTypeMap<T extends Models.AccountTypes> = {
  [key: string]: SpecificAccountType<T> | undefined
}

interface AnchorAccountCacheFns {
  fetch<T extends Models.AccountTypes>(
    accountType: T,
    publicKey: PublicKey
  ): Promise<SpecificAccountType<T>>
  fetchMulti<T extends Models.AccountTypes>(
    accountType: T,
    publicKeys: PublicKey[]
  ): Promise<SpecificAccountTypeMap<T>>
  fetchAndSub<T extends Models.AccountTypes>(
    accountType: T,
    publicKey: PublicKey
  ): Promise<SpecificAccountType<T>>
  fetchAndSubMulti<T extends Models.AccountTypes>(
    accountType: T,
    publicKeys: PublicKey[]
  ): Promise<SpecificAccountTypeMap<T>>
  unsubscribe: (accountType: Models.AccountTypes, publicKey: PublicKey) => void
  unsubscribeMulti: (
    accountType: Models.AccountTypes,
    publicKeys: PublicKey[]
  ) => void
}

export const AnchorAccountCacheContext = React.createContext<
  | ({ isEnabled: true } & AnchorAccountCacheProviderState &
      AnchorAccountCacheFns)
  | { isEnabled: false }
>({ isEnabled: false })

class AnchorAccountCacheProvider extends React.Component<
  AnchorAccountCacheProviderProps,
  AnchorAccountCacheProviderState
> {
  vibeMarketProgram: Program
  accountManagers: {
    [Models.GlobalState.AccountType]: Models.GlobalState.GlobalStateManager
    [Models.Market.AccountType]: Models.Market.MarketManager
  }

  constructor(props: Readonly<AnchorAccountCacheProviderProps>) {
    super(props)
    this.vibeMarketProgram = this.props.vibeMarketProgram

    this.accountManagers = {
      [Models.GlobalState.AccountType]:
        new Models.GlobalState.GlobalStateManager(this.vibeMarketProgram),
      [Models.Market.AccountType]: new Models.Market.MarketManager(
        this.vibeMarketProgram
      ),
    }

    this.state = {
      [Models.GlobalState.AccountType]: {},
      [Models.Market.AccountType]: {},
    }
  }

  private _setAccounts<K extends Models.AccountTypes>(
    accountType: K,
    newAccountsMap: { [key: string]: ManagerReturnType }
  ) {
    this.setState({
      ...this.state,
      [accountType]: {
        ...this.state[accountType],
        ...newAccountsMap,
      },
    })
  }

  async fetch<T extends Models.AccountTypes>(
    accountType: T,
    publicKey: PublicKey
  ) {
    const accountManager = this.accountManagers[accountType]
    const account = await accountManager.fetch(publicKey)
    this._setAccounts(accountType, { [publicKey.toBase58()]: account })
    return account as SpecificAccountType<T>
  }

  async fetchMulti<T extends Models.AccountTypes>(
    accountType: T,
    publicKeys: PublicKey[]
  ) {
    const accountManager = this.accountManagers[accountType]
    const accounts = (await accountManager.fetchMulti(
      publicKeys
    )) as SpecificAccountTypeMap<T>
    const filteredAccounts = _.pickBy(accounts, _.identity) as {
      [key: string]: SpecificAccountType<T>
    }
    this._setAccounts(accountType, filteredAccounts)
    return accounts
  }

  async fetchAndSub<T extends Models.AccountTypes>(
    accountType: T,
    publicKey: PublicKey
  ) {
    const accountManager = this.accountManagers[accountType]
    accountManager.subscribe(publicKey, (account) =>
      this._setAccounts(accountType, { [publicKey.toBase58()]: account })
    )
    const retval = await this.fetch(accountType, publicKey)
    return retval as SpecificAccountType<T>
  }

  async fetchAndSubMulti<T extends Models.AccountTypes>(
    accountType: T,
    publicKeys: PublicKey[]
  ) {
    const accountManager = this.accountManagers[accountType]
    _.forEach(publicKeys, (publicKey) =>
      accountManager.subscribe(publicKey, (account) =>
        this._setAccounts(accountType, { [publicKey.toBase58()]: account })
      )
    )
    const retval = await this.fetchMulti(accountType, publicKeys)
    return retval as SpecificAccountTypeMap<T>
  }

  unsubscribe = (accountType: Models.AccountTypes, publicKey: PublicKey) => {
    const accountManager = this.accountManagers[accountType]
    accountManager.unsubscribe(publicKey)
  }

  unsubscribeMulti = (
    accountType: Models.AccountTypes,
    publicKeys: PublicKey[]
  ) => {
    _.forEach(publicKeys, this.unsubscribe.bind(this.unsubscribe, accountType))
  }

  render() {
    return (
      <AnchorAccountCacheContext.Provider
        value={{
          ...this.state,
          isEnabled: true,
          fetch: this.fetch.bind(this),
          fetchMulti: this.fetchMulti.bind(this),
          fetchAndSub: this.fetchAndSub.bind(this),
          fetchAndSubMulti: this.fetchAndSubMulti.bind(this),
          unsubscribe: this.unsubscribe.bind(this),
          unsubscribeMulti: this.unsubscribeMulti.bind(this),
        }}
      >
        {this.props.children}
      </AnchorAccountCacheContext.Provider>
    )
  }
}

export default AnchorAccountCacheProvider
