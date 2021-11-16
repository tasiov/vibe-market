import { FC } from "react"
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui"

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css")

export const Wallet: FC = () => {
  return (
    <WalletModalProvider>
      <WalletMultiButton />
    </WalletModalProvider>
  )
}
