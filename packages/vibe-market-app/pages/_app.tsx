import { ReactNode, useState, useEffect } from "react"
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"
import { ChakraProvider } from "@chakra-ui/react"
import { useConnection } from "@solana/wallet-adapter-react"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { Program, Provider } from "@project-serum/anchor"
import AnchorAccountCacheProvider from "../contexts/AnchorAccountsCacheProvider"
import { ClusterContextProvider } from "../contexts/cluster"
import { getVibeMarketProgram } from "../solana/getPrograms"
import SidebarWithHeader from "../components/Layout"
import { theme } from "../styles/theme"
import { VibeMarket } from "../solana/vibeMarket"
import "../styles/globals.css"

const WalletConnectionProvider = dynamic(
  () => import("../contexts/walletConnectionProvider"),
  {
    ssr: false,
  }
)

const AccountsCacheProvidersSetup = ({ children }: { children: ReactNode }) => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [vibeMarketProgram, setVibeMarketProgram] =
    useState<Program<VibeMarket> | null>(null)

  useEffect(() => {
    ;(async function () {
      // @ts-ignore - calling provider without wallet is used to instantiate connection
      const provider = new Provider(connection, wallet, {})
      const vibeMarketProgram = await getVibeMarketProgram(provider)
      setVibeMarketProgram(vibeMarketProgram)
    })()
  }, [wallet?.publicKey.toString()])

  if (!vibeMarketProgram) {
    return <>{children}</>
  }

  return (
    <AnchorAccountCacheProvider vibeMarketProgram={vibeMarketProgram}>
      {children}
    </AnchorAccountCacheProvider>
  )
}

function VibeMarketApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <ClusterContextProvider>
        <WalletConnectionProvider>
          <AccountsCacheProvidersSetup>
            <SidebarWithHeader>
              <Component {...pageProps} />
            </SidebarWithHeader>
          </AccountsCacheProvidersSetup>
        </WalletConnectionProvider>
      </ClusterContextProvider>
    </ChakraProvider>
  )
}

export default VibeMarketApp
