import "../styles/globals.css"
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"
import { ChakraProvider } from "@chakra-ui/react"
import { theme } from "../styles/theme"

const WalletConnectionProvider = dynamic(
  () => import("../contexts/walletConnectionProvider"),
  {
    ssr: false,
  }
)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <WalletConnectionProvider>
        <Component {...pageProps} />
      </WalletConnectionProvider>
    </ChakraProvider>
  )
}

export default MyApp
