import _ from "lodash"
import { useContext, useEffect, useMemo, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { HToken } from "../models"
import { AnchorAccountCacheContext } from "../contexts/AnchorAccountsCacheProvider"
import { useAccounts } from "./useAccounts"
import { BN } from "@project-serum/anchor"

export const useNftAccounts = (ownerPublicKey: PublicKey | undefined) => {
  const anchorAccountCache = useContext(AnchorAccountCacheContext)
  const [tokenAccounts, setTokenAccounts] = useState<
    Record<string, HToken.HToken> | undefined
  >()

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !ownerPublicKey) {
      return
    }
    ;(async function () {
      const tokenAccounts = await anchorAccountCache.fetchTokenAccountsByOwner(
        ownerPublicKey
      )
      setTokenAccounts(tokenAccounts)
    })()
  }, [anchorAccountCache.isEnabled, ownerPublicKey?.toString()])

  const mintAddresses = useMemo(() => {
    return _.reduce(
      tokenAccounts,
      (accum: PublicKey[], tokenAccount) => {
        if (tokenAccount.data.amount === 1) {
          accum.push(new PublicKey(tokenAccount.data.mint))
        }
        return accum
      },
      []
    )
  }, [tokenAccounts])

  const [mints] = useAccounts("hMint", mintAddresses, { useCache: true })

  return useMemo(() => {
    if (
      !tokenAccounts ||
      _.isEmpty(tokenAccounts) ||
      !mints ||
      _.isEmpty(mints)
    ) {
      return undefined
    }
    return _.reduce(
      tokenAccounts,
      (accum: Record<string, HToken.HToken>, tokenAccount) => {
        const mint = mints[tokenAccount.data.mint]
        if (
          tokenAccount.data.amount === 1 &&
          mint.data.decimals === 0 &&
          mint.data.supply.eq(new BN(1))
        ) {
          accum[tokenAccount.publicKey.toString()] = tokenAccount
        }
        return accum
      },
      {}
    )
  }, [tokenAccounts, mints])
}
