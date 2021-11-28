import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { useEffect, useState } from "react"
import type { IAnchorAccountCacheContext } from "../contexts/AnchorAccountsCacheProvider"

export const useBalance = (
  anchorAccountCache: IAnchorAccountCacheContext,
  ownerPublicKey: PublicKey | undefined
) => {
  const [balance, setBalance] = useState<number | undefined>()

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !ownerPublicKey) {
      return
    }
    ;(async function () {
      const balance =
        await anchorAccountCache.vibeMarketProgram.provider.connection.getBalance(
          ownerPublicKey
        )
      setBalance(balance)
    })()
  }, [anchorAccountCache.isEnabled, ownerPublicKey?.toString()])

  return balance && balance / LAMPORTS_PER_SOL
}
