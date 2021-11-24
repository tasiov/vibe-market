import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js"
import { Token } from "@solana/spl-token"
import { getClusterConstants } from "../../constants"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"

const addNft = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  collectionPublicKey: PublicKey,
  priceModelPublicKey: PublicKey,
  nftAccountPublicKey: PublicKey
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
  const collection = await anchorAccountCache.fetch(
    "collection",
    collectionPublicKey
  )
  if (!collection) {
    throw new Error("Collection not found")
  }
  const listHeadPublicKey = new PublicKey(collection.data.listHead)
  const listHead = await anchorAccountCache.fetch(
    "nftBucket",
    listHeadPublicKey
  )
  if (!listHead) {
    throw new Error("List head not found")
  }
  const nextListItemPublicKey = new PublicKey(listHead.data.nextListItem)

  const tokenAccount = await anchorAccountCache.fetch(
    "hTokenAccount",
    nftAccountPublicKey
  )
  if (!tokenAccount) {
    throw new Error("Token account not found")
  }
  const nftMint = new PublicKey(tokenAccount.data.mint)
  const nftBucket = Keypair.generate()

  const adminAssociatedAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    nftMint,
    walletPublicKey
  )
  const programAssociatedAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    nftMint,
    ADDRESS_VIBE_MARKET,
    true
  )

  await anchorAccountCache.vibeMarketProgram.rpc.addNft({
    accounts: {
      admin: walletPublicKey,
      market: ADDRESS_VIBE_MARKET,
      collection: collectionPublicKey,
      listHead: listHeadPublicKey,
      nextListItem: nextListItemPublicKey,
      newItem: nftBucket.publicKey,
      priceModel: priceModelPublicKey,
      adminNftAccount: adminAssociatedAddress,
      adminNftMint: nftMint,
      programNftAccount: programAssociatedAddress,
      associatedTokenProgram: PROGRAM_ASSOCIATED_TOKEN,
      tokenProgram: PROGRAM_TOKEN,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    },
    signers: [nftBucket],
  })
}

export default addNft
