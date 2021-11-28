import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js"
import { Token } from "@solana/spl-token"
import { getClusterConstants } from "../../constants"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"

const withdrawNft = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  collectionPublicKey: PublicKey,
  nftBucketPublicKey: PublicKey
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

  const withdrawNftBucket = await anchorAccountCache.fetch(
    "nftBucket",
    nftBucketPublicKey
  )
  if (!withdrawNftBucket) {
    throw new Error("Nft bucket not found")
  }

  const nftMintPublicKey = new PublicKey(withdrawNftBucket.data.nftMint)

  const adminNftAccountAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    nftMintPublicKey,
    walletPublicKey
  )
  const programNftAccountAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    nftMintPublicKey,
    collectionPublicKey,
    true
  )

  console.log("withdrawNftBucket.publicKey", withdrawNftBucket.publicKey)
  await anchorAccountCache.vibeMarketProgram.rpc.withdrawNft({
    accounts: {
      admin: walletPublicKey,
      rentRefund: new PublicKey(withdrawNftBucket.data.payer),
      priceModel: new PublicKey(withdrawNftBucket.data.priceModel),
      market: ADDRESS_VIBE_MARKET,
      collection: collectionPublicKey,
      withdrawListItem: withdrawNftBucket.publicKey,
      programNftAccount: programNftAccountAddress,
      programNftMint: nftMintPublicKey,
      adminNftAccount: adminNftAccountAddress,
      prevListItem: new PublicKey(withdrawNftBucket.data.prevListItem),
      nextListItem: new PublicKey(withdrawNftBucket.data.nextListItem),
      associatedTokenProgram: PROGRAM_ASSOCIATED_TOKEN,
      tokenProgram: PROGRAM_TOKEN,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    },
  })
}

export default withdrawNft
