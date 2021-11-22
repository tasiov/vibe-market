import _ from "lodash"
import { useContext, useEffect, useMemo, useState } from "react"
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
): [SpecificAccountType<T> | undefined, boolean] {
  const anchorAccountCache = useContext(AnchorAccountCacheContext)
  const publicKey58 = publicKey?.toBase58()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !publicKey) {
      return
    }

    ;(async function () {
      setLoading(true)
      if (subscribe) {
        await anchorAccountCache.fetchAndSub(accountType, publicKey)
      } else {
        await anchorAccountCache.fetch(accountType, publicKey)
      }
      setLoading(false)
    })()

    return () => {
      if (subscribe) {
        anchorAccountCache.unsubscribe(accountType, publicKey)
      }
    }
  }, [anchorAccountCache.isEnabled, accountType, publicKey58, subscribe])

  const anchorAccountCacheType =
    anchorAccountCache.isEnabled && anchorAccountCache[accountType]

  const account = useMemo(() => {
    if (!anchorAccountCacheType || !publicKey) {
      return undefined
    }
    return anchorAccountCacheType[publicKey.toBase58()] as
      | SpecificAccountType<T>
      | undefined
  }, [anchorAccountCacheType, publicKey58])

  return [account, loading]
}

export function useAccounts<T extends AccountTypes>(
  accountType: T,
  publicKeys: PublicKey[] | undefined,
  subscribe = true
): [{ [key: string]: SpecificAccountType<T> } | undefined, boolean] {
  const anchorAccountCache = useContext(AnchorAccountCacheContext)
  const publicKeys58 = _.map(publicKeys, (publicKey) => publicKey.toBase58())
  const publicKey58Str = _.join(publicKeys58, "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !publicKeys || _.isEmpty(publicKeys)) {
      return
    }

    ;(async function () {
      setLoading(true)
      if (subscribe) {
        await anchorAccountCache.fetchAndSubMulti(accountType, publicKeys)
      } else {
        await anchorAccountCache.fetchMulti(accountType, publicKeys)
      }
      setLoading(false)
    })()

    return () => {
      if (subscribe) {
        anchorAccountCache.unsubscribeMulti(accountType, publicKeys)
      }
    }
  }, [anchorAccountCache.isEnabled, accountType, publicKey58Str, subscribe])

  const anchorAccountCacheType =
    anchorAccountCache.isEnabled && anchorAccountCache[accountType]

  const accounts = useMemo(() => {
    if (!anchorAccountCacheType || !publicKeys || _.isEmpty(publicKeys)) {
      return undefined
    }
    return _.pick(anchorAccountCacheType, publicKeys58) as {
      [key: string]: SpecificAccountType<T>
    }
  }, [anchorAccountCacheType, publicKey58Str])

  return [accounts, loading]
}
