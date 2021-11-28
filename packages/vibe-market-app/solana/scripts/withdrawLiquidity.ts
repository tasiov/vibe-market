import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { Token } from "@solana/spl-token"
import { getClusterConstants } from "../../constants"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"
import { getGlobalStateAddress } from "../seedAddresses"
import { toRawAmount } from "../tokenConversion"

const withdrawLiquidity = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  programDebitAccountPublicKey: PublicKey,
  withdrawAmount: number
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }
  const { ADDRESS_VIBE_MARKET, PROGRAM_ASSOCIATED_TOKEN, PROGRAM_TOKEN } =
    getClusterConstants(
      "ADDRESS_VIBE_MARKET",
      "PROGRAM_ASSOCIATED_TOKEN",
      "PROGRAM_TOKEN"
    )

  const tokenAccount = await anchorAccountCache.fetch(
    "hTokenAccount",
    programDebitAccountPublicKey
  )
  if (!tokenAccount) {
    throw new Error("Token account not found")
  }

  const withdrawMintPublicKey = new PublicKey(tokenAccount.data.mint)
  const mint = await anchorAccountCache.fetch(
    "hMint",
    withdrawMintPublicKey,
    true
  )
  if (!mint) {
    throw new Error("Mint account not found")
  }

  const rawWithdrawAmount = toRawAmount(mint.data.decimals, withdrawAmount)

  const [globalStateAddress] = await getGlobalStateAddress()
  const adminPaymentAccountAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    withdrawMintPublicKey,
    walletPublicKey
  )

  await anchorAccountCache.vibeMarketProgram.rpc.withdrawLiquidity(
    rawWithdrawAmount,
    {
      accounts: {
        admin: walletPublicKey,
        globalState: globalStateAddress,
        market: ADDRESS_VIBE_MARKET,
        withdrawMint: withdrawMintPublicKey,
        programDebitAccount: programDebitAccountPublicKey,
        adminCreditAccount: adminPaymentAccountAddress,
        associatedTokenProgram: PROGRAM_ASSOCIATED_TOKEN,
        tokenProgram: PROGRAM_TOKEN,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    }
  )
}

export default withdrawLiquidity
