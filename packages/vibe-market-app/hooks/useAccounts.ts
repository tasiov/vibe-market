import _ from "lodash"
import { useContext, useEffect, useMemo } from "react"
import { PublicKey } from "@solana/web3.js"
import { AccountTypes } from "../models"
import {
  AnchorAccountCacheContext,
  SpecificAccountType,
} from "../contexts/AnchorAccountsCacheProvider"

export function useAccount<T extends AccountTypes>(
  accountType: T,
  publicKey: PublicKey | undefined,
  subscribe = true
): SpecificAccountType<T> | undefined {
  const anchorAccountCache = useContext(AnchorAccountCacheContext)
  const publicKey58 = publicKey?.toBase58()

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !publicKey) {
      return
    }

    if (subscribe) {
      anchorAccountCache.fetchAndSub(accountType, publicKey)
    } else {
      anchorAccountCache.fetch(accountType, publicKey)
    }

    return () => {
      if (subscribe) {
        anchorAccountCache.unsubscribe(accountType, publicKey)
      }
    }
  }, [anchorAccountCache.isEnabled, accountType, publicKey58, subscribe])

  const anchorAccountCacheType =
    anchorAccountCache.isEnabled && anchorAccountCache[accountType]

  return useMemo(() => {
    if (!anchorAccountCacheType || !publicKey) {
      return undefined
    }
    return anchorAccountCacheType[
      publicKey.toBase58()
    ] as SpecificAccountType<T>
  }, [anchorAccountCacheType, publicKey58])
}

export function useAccounts<T extends AccountTypes>(
  accountType: T,
  publicKeys: PublicKey[] | undefined,
  subscribe = true
): { [key: string]: SpecificAccountType<T> } | undefined {
  const anchorAccountCache = useContext(AnchorAccountCacheContext)
  const publicKeys58 = _.map(publicKeys, (publicKey) => publicKey.toBase58())
  const publicKey58Str = _.join(publicKeys58, "")

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !publicKeys || _.isEmpty(publicKeys)) {
      return
    }

    if (subscribe) {
      anchorAccountCache.fetchAndSubMulti(accountType, publicKeys)
    } else {
      anchorAccountCache.fetchMulti(accountType, publicKeys)
    }

    return () => {
      if (subscribe) {
        anchorAccountCache.unsubscribeMulti(accountType, publicKeys)
      }
    }
  }, [anchorAccountCache.isEnabled, accountType, publicKey58Str, subscribe])

  const anchorAccountCacheType =
    anchorAccountCache.isEnabled && anchorAccountCache[accountType]

  return useMemo(() => {
    if (!anchorAccountCacheType || !publicKeys || _.isEmpty(publicKeys)) {
      return undefined
    }
    return _.pick(anchorAccountCacheType, publicKeys58) as {
      [key: string]: SpecificAccountType<T>
    }
  }, [anchorAccountCacheType, publicKey58Str])
}
