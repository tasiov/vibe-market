import { assert } from "chai"
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
  getMarketAddress,
  getPriceModelAddress,
} from "../utils/seedAddresses"

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
  let marketAddress: PublicKey
  let marketAddressNonce: number
  let collectionAddress: PublicKey
  let collectionAddressNonce: number
  let listHeadAddress: PublicKey
  let listHeadAddressNonce: number
  let listTailAddress: PublicKey
  let listTailAddressNonce: number
  let priceModelAddress: PublicKey
  let priceModelAddressNonce: number

  it("Is initialized!", async () => {
    ;[globalStateAddress, globalStateAddressNonce] =
      await getGlobalStateAddress()

    await program.rpc.initGlobalState(globalStateAddressNonce, {
      accounts: {
        admin: admin.publicKey,
        globalState: globalStateAddress,
        systemProgram: SystemProgram.programId,
      },
    })

    const globalState = await program.account.globalState.fetch(
      globalStateAddress
    )

    assert.ok(globalState.nonce === globalStateAddressNonce)
    assert.ok(globalState.numMarkets === 0)
  })

  it("Cannot initialize twice", async () => {
    try {
      await program.rpc.initGlobalState(globalStateAddressNonce, {
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

  it("Initializes a market", async () => {
    let globalState = await program.account.globalState.fetch(
      globalStateAddress
    )
    ;[marketAddress, marketAddressNonce] = await getMarketAddress(
      globalStateAddress,
      globalState.numMarkets
    )

    const title = "Vibe Market"

    await program.rpc.initMarket(marketAddressNonce, title, {
      accounts: {
        admin: admin.publicKey,
        globalState: globalStateAddress,
        market: marketAddress,
        systemProgram: SystemProgram.programId,
      },
    })

    globalState = await program.account.globalState.fetch(globalStateAddress)
    assert.ok(globalState.numMarkets === 1)

    const market = await program.account.market.fetch(marketAddress)
    assert.ok(market.nonce === marketAddressNonce)
    assert.ok(market.numCollections === 0)
    assert.ok(market.numPriceModels === 0)
    assert.ok(
      market.whitelist
        .map((publicKey) => publicKey.toBase58())
        .includes(admin.publicKey.toBase58())
    )
    assert.ok(market.title === title)
    assert.ok(market.index === 0)
  })

  it("Allows admin to add new admin", async () => {
    await program.rpc.addAdmin({
      accounts: {
        admin: admin.publicKey,
        market: marketAddress,
        addAdmin: admin2.publicKey,
      },
    })

    const market = await program.account.market.fetch(marketAddress)

    const whitelistStr = market.whitelist.map((publicKey) =>
      publicKey.toBase58()
    )
    assert.ok(whitelistStr.includes(admin.publicKey.toBase58()))
    assert.ok(whitelistStr.includes(admin2.publicKey.toBase58()))
  })

  it("Allows admin to remove other admin", async () => {
    await program.rpc.removeAdmin({
      accounts: {
        admin: admin.publicKey,
        market: marketAddress,
        removeAdmin: admin2.publicKey,
      },
    })

    const market = await program.account.market.fetch(marketAddress)

    const whitelistStr = market.whitelist.map((publicKey) =>
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
          market: marketAddress,
          removeAdmin: admin.publicKey,
        },
      })
      assert.ok(false)
    } catch (err) {
      assert.ok(true)
    }

    const market = await program.account.market.fetch(marketAddress)

    const whitelistStr = market.whitelist.map((publicKey) =>
      publicKey.toBase58()
    )
    assert.ok(whitelistStr.includes(admin.publicKey.toBase58()))
  })

  it("Allows for collection creation", async () => {
    const market = await program.account.market.fetch(marketAddress)

    ;[collectionAddress, collectionAddressNonce] = await getCollectionAddress(
      marketAddress,
      market.numCollections
    )
    ;[listHeadAddress, listHeadAddressNonce] = await getListHeadAddress(
      collectionAddress
    )
    ;[listTailAddress, listTailAddressNonce] = await getListTailAddress(
      collectionAddress
    )

    const title = "Collection A"

    await program.rpc.initCollection(
      collectionAddressNonce,
      listHeadAddressNonce,
      listTailAddressNonce,
      title,
      {
        accounts: {
          admin: admin.publicKey,
          market: marketAddress,
          collection: collectionAddress,
          listHead: listHeadAddress,
          listTail: listTailAddress,
          systemProgram: SystemProgram.programId,
        },
      }
    )

    const collection = await program.account.collection.fetch(collectionAddress)
    assert.ok(collection.listHead.toBase58() === listHeadAddress.toBase58())
    assert.ok(collection.listTail.toBase58() === listTailAddress.toBase58())
    assert.ok(collection.title === title)
    assert.ok(collection.nonce === collectionAddressNonce)
    assert.ok(collection.index === 0)
  })

  it("Allows for price model creation", async () => {
    const market = await program.account.market.fetch(marketAddress)

    ;[priceModelAddress, priceModelAddressNonce] = await getPriceModelAddress(
      marketAddress,
      market.numPriceModels
    )

    await program.rpc.initPriceModel(
      priceModelAddressNonce,
      [{ mint: NATIVE_MINT, amount: new anchor.BN(10000) }],
      {
        accounts: {
          admin: admin.publicKey,
          market: marketAddress,
          priceModel: priceModelAddress,
          systemProgram: SystemProgram.programId,
        },
      }
    )

    const priceModel = await program.account.priceModel.fetch(priceModelAddress)
    assert.ok(priceModel.nonce === priceModelAddressNonce)
    assert.ok(priceModel.index === 0)
    assert.ok(
      priceModel.salePrices[0].mint.toString() === NATIVE_MINT.toString()
    )
    assert.ok(priceModel.salePrices[0].amount.toNumber() === 10000)
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
      marketAddress,
      true
    )

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
      mintToIx
    )
    const txSign = await program.provider.send(tx, [mintAddress])

    const token = new Token(
      program.provider.connection,
      mintAddress.publicKey,
      TOKEN_PROGRAM_ID,
      admin2
    )
    let adminAccount = await token.getAccountInfo(adminAssociatedAddress)
    assert.ok(adminAccount.amount.toNumber() === 1)

    await program.rpc.addNft({
      accounts: {
        admin: admin.publicKey,
        market: marketAddress,
        collection: collectionAddress,
        listHead: listHeadAddress,
        nextListItem: listTailAddress,
        newItem: nftItem.publicKey,
        priceModel: priceModelAddress,
        adminNftAccount: adminAssociatedAddress,
        adminNftMint: mintAddress.publicKey,
        programNftAccount: programAssociatedAddress,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [nftItem],
    })

    adminAccount = await token.getAccountInfo(adminAssociatedAddress)
    assert.ok(adminAccount.amount.toNumber() === 0)
    let programAccount = await token.getAccountInfo(programAssociatedAddress)
    assert.ok(programAccount.amount.toNumber() === 1)

    const nftItemAccount = await program.account.tokenAccountWrapper.fetch(
      nftItem.publicKey
    )
    assert.ok(nftItemAccount.nonce === 0)
    assert.ok(
      nftItemAccount.tokenAccount.toString() ===
        programAssociatedAddress.toString()
    )
    assert.ok(
      nftItemAccount.priceModel.toString() === priceModelAddress.toString()
    )
    assert.ok(
      nftItemAccount.prevListItem.toString() === listHeadAddress.toString()
    )
    assert.ok(
      nftItemAccount.nextListItem.toString() === listTailAddress.toString()
    )
    assert.ok(nftItemAccount.payer.toString() === admin.publicKey.toString())

    const listHead = await program.account.tokenAccountWrapper.fetch(
      listHeadAddress
    )
    assert.ok(listHead.nextListItem.toString() === nftItem.publicKey.toString())
    const listTail = await program.account.tokenAccountWrapper.fetch(
      listTailAddress
    )
    assert.ok(listTail.prevListItem.toString() === nftItem.publicKey.toString())
  })
})
