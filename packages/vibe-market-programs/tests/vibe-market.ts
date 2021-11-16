import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js"
import {
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { VibeMarket } from "../target/types/vibe_market"
import {
  getCollectionAddress,
  getGlobalStateAddress,
  getListHeadAddress,
  getListTailAddress,
} from "../utils/seedAddresses"
import { assert } from "chai"

describe("vibe-market", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env())

  const program = anchor.workspace.VibeMarket as Program<VibeMarket>
  const admin = program.provider.wallet
  const admin2 = anchor.web3.Keypair.generate()
  const mintAddress = anchor.web3.Keypair.generate()
  const fauxPayer = anchor.web3.Keypair.generate()
  const nftItem = anchor.web3.Keypair.generate()

  let globalStateAddress: PublicKey
  let globalStateAddressNonce: number
  let collectionAddress: PublicKey
  let collectionAddressNonce: number
  let listHeadAddress: PublicKey
  let listHeadAddressNonce: number
  let listTailAddress: PublicKey
  let listTailAddressNonce: number

  it("Is initialized!", async () => {
    ;[globalStateAddress, globalStateAddressNonce] =
      await getGlobalStateAddress()

    await program.rpc.initialize(globalStateAddressNonce, {
      accounts: {
        admin: admin.publicKey,
        globalState: globalStateAddress,
        systemProgram: SystemProgram.programId,
      },
    })

    const globalState = await program.account.globalState.fetch(
      globalStateAddress
    )

    assert.ok(
      globalState.whitelist
        .map((publicKey) => publicKey.toBase58())
        .includes(admin.publicKey.toBase58())
    )
    assert.ok(globalState.numCollections === 0)
  })

  it("Cannot initialize twice", async () => {
    try {
      await program.rpc.initialize(globalStateAddressNonce, {
        accounts: {
          admin: admin.publicKey,
          globalState: globalStateAddress,
          systemProgram: SystemProgram.programId,
        },
      })
      assert.ok(false)
    } catch (err) {
      assert.ok(true)
    }
  })

  it("Allows admin to add new admin", async () => {
    await program.rpc.addAdmin({
      accounts: {
        admin: admin.publicKey,
        globalState: globalStateAddress,
        newAdmin: admin2.publicKey,
      },
    })

    const globalState = await program.account.globalState.fetch(
      globalStateAddress
    )

    const whitelistStr = globalState.whitelist.map((publicKey) =>
      publicKey.toBase58()
    )
    assert.ok(whitelistStr.includes(admin.publicKey.toBase58()))
    assert.ok(whitelistStr.includes(admin2.publicKey.toBase58()))
  })

  it("Allows admin to remove other admin", async () => {
    await program.rpc.removeAdmin({
      accounts: {
        admin: admin.publicKey,
        globalState: globalStateAddress,
        removeAdmin: admin2.publicKey,
      },
    })

    const globalState = await program.account.globalState.fetch(
      globalStateAddress
    )

    const whitelistStr = globalState.whitelist.map((publicKey) =>
      publicKey.toBase58()
    )
    assert.ok(whitelistStr.includes(admin.publicKey.toBase58()))
    assert.ok(!whitelistStr.includes(admin2.publicKey.toBase58()))
  })

  it("Does not allow admin to remove self", async () => {
    try {
      await program.rpc.removeAdmin({
        accounts: {
          admin: admin.publicKey,
          globalState: globalStateAddress,
          removeAdmin: admin.publicKey,
        },
      })
      assert.ok(false)
    } catch (err) {
      assert.ok(true)
    }

    const globalState = await program.account.globalState.fetch(
      globalStateAddress
    )

    const whitelistStr = globalState.whitelist.map((publicKey) =>
      publicKey.toBase58()
    )
    assert.ok(whitelistStr.includes(admin.publicKey.toBase58()))
  })

  it("Allows for collection creation", async () => {
    ;[collectionAddress, collectionAddressNonce] = await getCollectionAddress(
      globalStateAddress,
      0
    )
    ;[listHeadAddress, listHeadAddressNonce] = await getListHeadAddress(
      collectionAddress
    )
    ;[listTailAddress, listTailAddressNonce] = await getListTailAddress(
      collectionAddress
    )

    await program.rpc.initCollection(
      collectionAddressNonce,
      listHeadAddressNonce,
      listTailAddressNonce,
      "Collection A",
      [{ mint: NATIVE_MINT, amount: new anchor.BN(10000) }],
      {
        accounts: {
          admin: admin.publicKey,
          globalState: globalStateAddress,
          collection: collectionAddress,
          listHead: listHeadAddress,
          listTail: listTailAddress,
          systemProgram: SystemProgram.programId,
        },
      }
    )

    const collection = await program.account.collection.fetch(collectionAddress)

    assert.ok(collection.title === "Collection A")
    assert.ok(
      collection.salePrices[0].mint.toBase58() === NATIVE_MINT.toBase58()
    )
    assert.ok(collection.listHead.toBase58() === listHeadAddress.toBase58())
    assert.ok(collection.listTail.toBase58() === listTailAddress.toBase58())
  })

  it("Allows for nft addition", async () => {
    const createAccountIx = await SystemProgram.createAccount({
      fromPubkey: admin.publicKey,
      newAccountPubkey: mintAddress.publicKey,
      space: 82,
      lamports:
        await program.provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    })
    const createNftMintIx = await Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintAddress.publicKey,
      0,
      admin.publicKey,
      admin.publicKey
    )
    const adminAssociatedAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAddress.publicKey,
      admin.publicKey
    )
    const createAdminTokenAccountIx =
      await Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintAddress.publicKey,
        adminAssociatedAddress,
        admin.publicKey,
        admin.publicKey
      )

    const programAssociatedAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAddress.publicKey,
      globalStateAddress,
      true
    )

    // const createProgramTokenAccount =
    //   await Token.createAssociatedTokenAccountInstruction(
    //     ASSOCIATED_TOKEN_PROGRAM_ID,
    //     TOKEN_PROGRAM_ID,
    //     mintAddress.publicKey,
    //     programAssociatedAddress,
    //     globalStateAddress,
    //     admin.publicKey
    //   )
    const mintToIx = await Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mintAddress.publicKey,
      adminAssociatedAddress,
      admin.publicKey,
      [],
      1
    )
    const tx = new Transaction().add(
      createAccountIx,
      createNftMintIx,
      createAdminTokenAccountIx,
      // createProgramTokenAccount,
      mintToIx
    )
    const txSign = await program.provider.send(tx, [mintAddress])

    const listHead = await program.account.tokenAccountWrapper.fetch(
      listHeadAddress
    )
    console.log("listHead", listHead)

    await program.rpc.addNft({
      accounts: {
        admin: admin.publicKey,
        globalState: globalStateAddress,
        collection: collectionAddress,
        listHead: listHeadAddress,
        nextListItem: listTailAddress,
        newItem: nftItem.publicKey,
        adminNftAccount: adminAssociatedAddress,
        adminNftMint: mintAddress.publicKey,
        programNftAccount: programAssociatedAddress,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      },
      signers: [nftItem],
    })
  })
})
