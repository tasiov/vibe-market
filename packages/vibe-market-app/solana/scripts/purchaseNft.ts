import _ from "lodash"
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js"
import { Token, AccountLayout } from "@solana/spl-token"
import { getClusterConstants } from "../../constants"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"

const purchaseNft = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  collectionPublicKey: PublicKey,
  nftBucketPublicKey: PublicKey,
  paymentMintPublicKey: PublicKey,
  paymentTokenAccount?: PublicKey
) => {
  const {
    ADDRESS_NATIVE_MINT,
    ADDRESS_VIBE_MARKET,
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
  } = getClusterConstants(
    "ADDRESS_NATIVE_MINT",
    "ADDRESS_VIBE_MARKET",
    "PROGRAM_ASSOCIATED_TOKEN",
    "PROGRAM_TOKEN"
  )

  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }

  const nftBucket = await anchorAccountCache.fetch(
    "nftBucket",
    nftBucketPublicKey
  )
  if (!nftBucket) {
    throw new Error("Nft bucket not found")
  }

  const nftMintAddress = new PublicKey(nftBucket.data.nftMint)

  const userNftAccountAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    nftMintAddress,
    walletPublicKey
  )
  const programCreditAccountAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    paymentMintPublicKey,
    ADDRESS_VIBE_MARKET,
    true
  )
  const programNftAccountAddress = await Token.getAssociatedTokenAddress(
    PROGRAM_ASSOCIATED_TOKEN,
    PROGRAM_TOKEN,
    nftMintAddress,
    collectionPublicKey,
    true
  )

  const priceModelAddress = new PublicKey(nftBucket.data.priceModel)

  const tx = new Transaction()
  let newAccount: Keypair | undefined
  let paymentAccountAddress: PublicKey

  if (paymentMintPublicKey.equals(ADDRESS_NATIVE_MINT)) {
    newAccount = Keypair.generate()
    paymentAccountAddress = newAccount.publicKey

    const priceModel = await anchorAccountCache.fetch(
      "priceModel",
      priceModelAddress
    )
    if (!priceModel) {
      throw new Error("Price model not found")
    }

    const salePrice = _.find(
      priceModel.data.salePrices,
      (salePrice) => salePrice.mint === ADDRESS_NATIVE_MINT.toString()
    )
    if (!salePrice) {
      throw new Error("Sale price for native mint not found")
    }

    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
      anchorAccountCache.vibeMarketProgram.provider.connection
    )
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: walletPublicKey,
        lamports: salePrice.amount + balanceNeeded,
        newAccountPubkey: newAccount.publicKey,
        programId: PROGRAM_TOKEN,
        space: 165,
      }),
      Token.createInitAccountInstruction(
        PROGRAM_TOKEN,
        ADDRESS_NATIVE_MINT,
        newAccount.publicKey,
        walletPublicKey
      )
    )
  } else {
    if (!paymentTokenAccount) {
      throw new Error("Token account not provided")
    }
    paymentAccountAddress = paymentTokenAccount
  }

  const purchaseIx =
    await anchorAccountCache.vibeMarketProgram.instruction.purchaseNft({
      accounts: {
        owner: walletPublicKey,
        rentRefund: new PublicKey(nftBucket.data.payer),
        priceModel: priceModelAddress,
        market: ADDRESS_VIBE_MARKET,
        collection: collectionPublicKey,
        purchaseListItem: nftBucketPublicKey,
        debitMint: paymentMintPublicKey,
        debitAccount: paymentAccountAddress,
        programCreditAccount: programCreditAccountAddress,
        programNftAccount: programNftAccountAddress,
        programNftMint: nftMintAddress,
        ownerNftAccount: userNftAccountAddress,
        prevListItem: new PublicKey(nftBucket.data.prevListItem),
        nextListItem: new PublicKey(nftBucket.data.nextListItem),
        associatedTokenProgram: PROGRAM_ASSOCIATED_TOKEN,
        tokenProgram: PROGRAM_TOKEN,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  tx.add(purchaseIx)

  if (newAccount) {
    tx.add(
      Token.createCloseAccountInstruction(
        PROGRAM_TOKEN,
        newAccount.publicKey,
        walletPublicKey,
        walletPublicKey,
        []
      )
    )
  }

  await anchorAccountCache.vibeMarketProgram.provider.send(
    tx,
    newAccount ? [newAccount] : undefined
  )
}

export default purchaseNft
