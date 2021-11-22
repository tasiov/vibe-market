import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useAccount } from "./useAccounts"
import { useMemo } from "react"

export function useIsAdmin(marketAddress: PublicKey) {
  const wallet = useAnchorWallet()
  const [market] = useAccount("market", marketAddress)

  const isAdmin = useMemo(() => {
    if (!wallet || !market) {
      return false
    }
    return _.includes(market.data.whitelist, wallet.publicKey.toString())
  }, [wallet, market])

  return isAdmin
}
