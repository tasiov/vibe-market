import _ from "lodash"
import React, { ReactNode, useContext } from "react"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import * as Models from "../models"
import { VibeMarket } from "../solana/vibeMarket"

export interface AnchorAccountCacheProviderProps {
  vibeMarketProgram: Program<VibeMarket>
  children: ReactNode
}

type AccountMap<T> = { [key: string]: T }

export interface AnchorAccountCacheProviderState {
  [Models.GlobalState.AccountType]: AccountMap<Models.GlobalState.GlobalState>
  [Models.Market.AccountType]: AccountMap<Models.Market.Market>
  [Models.Collection.AccountType]: AccountMap<Models.Collection.Collection>
  [Models.NftBucket.AccountType]: AccountMap<Models.NftBucket.NftBucket>
  [Models.PriceModel.AccountType]: AccountMap<Models.PriceModel.PriceModel>
  [Models.HToken.AccountType]: AccountMap<Models.HToken.HToken>
  [Models.HMint.AccountType]: AccountMap<Models.HMint.HMint>
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
    publicKey: PublicKey,
    useCache?: boolean
  ): Promise<SpecificAccountType<T> | undefined>
  fetchMulti<T extends Models.AccountTypes>(
    accountType: T,
    publicKeys: PublicKey[]
  ): Promise<SpecificAccountTypeMap<T>>
  fetchAndSub<T extends Models.AccountTypes>(
    accountType: T,
    publicKey: PublicKey
  ): Promise<SpecificAccountType<T> | undefined>
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

export type IAnchorAccountCacheContext =
  | ({ isEnabled: true } & AnchorAccountCacheProviderState &
      AnchorAccountCacheFns & { vibeMarketProgram: Program<VibeMarket> })
  | { isEnabled: false }

export const AnchorAccountCacheContext =
  React.createContext<IAnchorAccountCacheContext>({ isEnabled: false })

class AnchorAccountCacheProvider extends React.Component<
  AnchorAccountCacheProviderProps,
  AnchorAccountCacheProviderState
> {
  accountManagers: {
    [Models.GlobalState.AccountType]: Models.GlobalState.GlobalStateManager
    [Models.Market.AccountType]: Models.Market.MarketManager
    [Models.Collection.AccountType]: Models.Collection.CollectionManager
    [Models.NftBucket.AccountType]: Models.NftBucket.NftBucketManager
    [Models.PriceModel.AccountType]: Models.PriceModel.PriceModelManager
    [Models.HToken.AccountType]: Models.HToken.HTokenManager
    [Models.HMint.AccountType]: Models.HMint.HMintManager
  }

  constructor(props: Readonly<AnchorAccountCacheProviderProps>) {
    super(props)

    this.accountManagers = {
      [Models.GlobalState.AccountType]:
        new Models.GlobalState.GlobalStateManager(this.props.vibeMarketProgram),
      [Models.Market.AccountType]: new Models.Market.MarketManager(
        this.props.vibeMarketProgram
      ),
      [Models.Collection.AccountType]: new Models.Collection.CollectionManager(
        this.props.vibeMarketProgram
      ),
      [Models.NftBucket.AccountType]: new Models.NftBucket.NftBucketManager(
        this.props.vibeMarketProgram
      ),
      [Models.PriceModel.AccountType]: new Models.PriceModel.PriceModelManager(
        this.props.vibeMarketProgram
      ),
      [Models.HToken.AccountType]: new Models.HToken.HTokenManager(
        this.props.vibeMarketProgram.provider.connection
      ),
      [Models.HMint.AccountType]: new Models.HMint.HMintManager(
        this.props.vibeMarketProgram.provider.connection
      ),
    }

    this.state = {
      [Models.GlobalState.AccountType]: {},
      [Models.Market.AccountType]: {},
      [Models.Collection.AccountType]: {},
      [Models.NftBucket.AccountType]: {},
      [Models.PriceModel.AccountType]: {},
      [Models.HToken.AccountType]: {},
      [Models.HMint.AccountType]: {},
    }
  }

  private _setAccounts<T extends Models.AccountTypes>(
    accountType: T,
    newAccountsMap: { [key: string]: ManagerReturnType }
  ) {
    const accountsMap = { ...this.state[accountType] }
    _.forEach(newAccountsMap, (account, publicKeyStr) => {
      if (account) {
        accountsMap[publicKeyStr] = account
      } else {
        delete accountsMap[publicKeyStr]
      }
    })
    this.setState({
      ...this.state,
      [accountType]: accountsMap,
    })
  }

  async fetch<T extends Models.AccountTypes>(
    accountType: T,
    publicKey: PublicKey,
    useCache = false
  ) {
    const cacheAccount = this.state[accountType][publicKey.toString()]
    if (useCache && cacheAccount) {
      return cacheAccount as SpecificAccountType<T> | undefined
    }
    const accountManager = this.accountManagers[accountType]
    const account = await accountManager.fetch(publicKey)
    this._setAccounts(accountType, { [publicKey.toBase58()]: account })
    return account as SpecificAccountType<T> | undefined
  }

  async fetchMulti<T extends Models.AccountTypes>(
    accountType: T,
    publicKeys: PublicKey[]
  ) {
    const accountManager = this.accountManagers[accountType]
    const accounts = await accountManager.fetchMulti(publicKeys)
    this._setAccounts(accountType, accounts)
    return accounts as SpecificAccountTypeMap<T>
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
    return retval as SpecificAccountType<T> | undefined
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
    _.forEach(publicKeys, this.unsubscribe.bind(this, accountType))
  }

  render() {
    return (
      <AnchorAccountCacheContext.Provider
        value={{
          ...this.state,
          isEnabled: true,
          vibeMarketProgram: this.props.vibeMarketProgram,
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

export const useAnchorAccountCache = () => useContext(AnchorAccountCacheContext)
