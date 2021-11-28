import _ from "lodash"
import { useContext, useEffect, useMemo, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { HToken } from "../models/tokenAccount"
import { AnchorAccountCacheContext } from "../contexts/AnchorAccountsCacheProvider"

export const useTokenAccounts = (ownerPublicKey: PublicKey | undefined) => {
  const anchorAccountCache = useContext(AnchorAccountCacheContext)
  const [tokenAccounts, setTokenAccounts] = useState<
    Record<string, HToken> | undefined
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

  return useMemo(() => {
    return _.reduce(
      tokenAccounts,
      (accum: Record<string, HToken>, tokenAccount) => {
        if (tokenAccount.data.amount > 1) {
          accum[tokenAccount.data.mint] = tokenAccount
        }
        return accum
      },
      {}
    )
  }, [tokenAccounts])
}
