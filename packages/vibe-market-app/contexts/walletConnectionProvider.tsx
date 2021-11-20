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
import { useCluster, ClusterContextProvider } from "./cluster"
import { FC, useMemo } from "react"

const RPC_POOL_CLUSTER_MAP = {
  [WalletAdapterNetwork.Devnet]: "https://hedgehog.devnet.rpcpool.com",
  [WalletAdapterNetwork.Mainnet]: "https://hedgehog.rpcpool.com ",
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
    <ClusterContextProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          {children}
        </WalletProvider>
      </ConnectionProvider>
    </ClusterContextProvider>
  )
}

export default WalletConnectionProvider
