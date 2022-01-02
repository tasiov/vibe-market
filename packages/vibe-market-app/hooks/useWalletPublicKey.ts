import { PublicKey } from "@solana/web3.js"
import { useAnchorWallet } from "@solana/wallet-adapter-react"

const useWalletPublicKey = () => {
  const wallet = useAnchorWallet()

  const impersonate = "Er6QJPusC1JsUqevTjFKXtYHbgCtJkyo1DNjEBWevWut"

  if (impersonate) {
    return new PublicKey(impersonate)
  }

  return wallet?.publicKey
}

export default useWalletPublicKey
