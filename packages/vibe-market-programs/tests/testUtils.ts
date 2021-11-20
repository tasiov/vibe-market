import { SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
} from "@solana/spl-token"

export const airdropAccount = async (connection, userPublicKey) => {
  const signature = await connection.requestAirdrop(
    userPublicKey,
    LAMPORTS_PER_SOL * 5
  )
  await connection.confirmTransaction(signature)
}

export const createAdminNftMint = async (
  provider,
  mintAddress,
  adminPublicKey
) => {
  const createAccountIx = await SystemProgram.createAccount({
    fromPubkey: adminPublicKey,
    newAccountPubkey: mintAddress.publicKey,
    space: 82,
    lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
    programId: TOKEN_PROGRAM_ID,
  })
  const createNftMintIx = await Token.createInitMintInstruction(
    TOKEN_PROGRAM_ID,
    mintAddress.publicKey,
    0,
    adminPublicKey,
    adminPublicKey
  )
  const adminAssociatedAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintAddress.publicKey,
    adminPublicKey
  )
  const createAdminTokenAccountIx =
    await Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAddress.publicKey,
      adminAssociatedAddress,
      adminPublicKey,
      adminPublicKey
    )

  const mintToIx = await Token.createMintToInstruction(
    TOKEN_PROGRAM_ID,
    mintAddress.publicKey,
    adminAssociatedAddress,
    adminPublicKey,
    [],
    1
  )
  const tx = new Transaction().add(
    createAccountIx,
    createNftMintIx,
    createAdminTokenAccountIx,
    mintToIx
  )
  const signature = await provider.send(tx, [mintAddress])
  await provider.connection.confirmTransaction(signature)
}

export const createUserDebitAccount = async (
  provider,
  userKeypair,
  paymentMint
) => {
  const createAccountIx = await SystemProgram.createAccount({
    fromPubkey: userKeypair.publicKey,
    newAccountPubkey: paymentMint.publicKey,
    space: 82,
    lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
    programId: TOKEN_PROGRAM_ID,
  })
  const createPaymentMintIx = await Token.createInitMintInstruction(
    TOKEN_PROGRAM_ID,
    paymentMint.publicKey,
    0,
    userKeypair.publicKey,
    userKeypair.publicKey
  )
  const userPaymentAccountAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    paymentMint.publicKey,
    userKeypair.publicKey
  )
  const createUserTokenAccountIx =
    await Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      paymentMint.publicKey,
      userPaymentAccountAddress,
      userKeypair.publicKey,
      userKeypair.publicKey
    )

  const mintToIx = await Token.createMintToInstruction(
    TOKEN_PROGRAM_ID,
    paymentMint.publicKey,
    userPaymentAccountAddress,
    userKeypair.publicKey,
    [],
    10000
  )
  const tx = new Transaction().add(
    createAccountIx,
    createPaymentMintIx,
    createUserTokenAccountIx,
    mintToIx
  )
  const signature = await provider.send(tx, [userKeypair, paymentMint])
  await provider.connection.confirmTransaction(signature)
}
