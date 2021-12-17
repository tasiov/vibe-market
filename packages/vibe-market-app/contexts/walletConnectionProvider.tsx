import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import {
  getSolletWallet,
  getSolongWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSlopeWallet,
  getLedgerWallet,
} from "@solana/wallet-adapter-wallets"
import { useCluster } from "./cluster"
import { FC, useMemo } from "react"

const RPC_POOL_CLUSTER_MAP = {
  [WalletAdapterNetwork.Devnet]: "https://api.devnet.solana.com",
  [WalletAdapterNetwork.Mainnet]: "https://api.mainnet-beta.solana.com",
}

const WalletConnectionProvider: FC = ({ children }) => {
  const network = useCluster()

  const endpoint = useMemo(
    () => RPC_POOL_CLUSTER_MAP[network as keyof typeof RPC_POOL_CLUSTER_MAP],
    [network]
  )

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getLedgerWallet(),
      getSolletWallet({ network }),
      getSolongWallet(),
      getSlopeWallet(),
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default WalletConnectionProvider
