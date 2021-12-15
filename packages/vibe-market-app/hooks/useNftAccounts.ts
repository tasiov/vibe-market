import _ from "lodash"
import { useContext, useEffect, useMemo, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { HToken } from "../models"
import { AnchorAccountCacheContext } from "../contexts/AnchorAccountsCacheProvider"

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

  return useMemo(() => {
    if (!tokenAccounts || _.isEmpty(tokenAccounts)) {
      return undefined
    }
    return _.reduce(
      tokenAccounts,
      (accum: Record<string, HToken.HToken>, tokenAccount) => {
        if (tokenAccount.data.amount === 1) {
          accum[tokenAccount.publicKey.toString()] = tokenAccount
        }
        return accum
      },
      {}
    )
  }, [tokenAccounts])
}
