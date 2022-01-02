import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import useWalletPublicKey from "../hooks/useWalletPublicKey"
import { useAccount } from "./useAccounts"
import { useMemo } from "react"

export function useIsAdmin(marketAddress: PublicKey) {
  const walletPublicKey = useWalletPublicKey()
  const [market] = useAccount("market", marketAddress, { subscribe: true })

  const isAdmin = useMemo(() => {
    if (!walletPublicKey || !market) {
      return false
    }
    return _.includes(market.data.whitelist, walletPublicKey.toString())
  }, [walletPublicKey, market])

  return isAdmin
}
