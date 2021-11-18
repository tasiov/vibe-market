import { FC } from "react"
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui"

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css"

export const Wallet: FC = () => {
  return (
    <WalletModalProvider>
      <WalletMultiButton style={{ backgroundColor: "#8333fe" }} />
    </WalletModalProvider>
  )
}
