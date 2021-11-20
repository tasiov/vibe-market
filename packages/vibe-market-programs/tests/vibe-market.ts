import { assert } from "chai"
import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  LAMPORTS_PER_SOL,
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
import {
  airdropAccount,
  createAdminNftMint,
  createUserDebitAccount,
} from "./testUtils"

describe("vibe-market", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env())

  const program = anchor.workspace.VibeMarket as Program<VibeMarket>
  const connection = program.provider.connection
  const admin = program.provider.wallet
  const admin2 = anchor.web3.Keypair.generate()
  const user = anchor.web3.Keypair.generate()
  const nftMint = anchor.web3.Keypair.generate()
  const paymentMint = anchor.web3.Keypair.generate()
  const nftBucket = anchor.web3.Keypair.generate()

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

  before("vibe-market setup", async () => {
    await airdropAccount(connection, user.publicKey)
    await createAdminNftMint(program.provider, nftMint, admin.publicKey)
    await createUserDebitAccount(program.provider, user, paymentMint)
  })

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
      [{ mint: paymentMint.publicKey, amount: new anchor.BN(100) }],
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
      priceModel.salePrices[0].mint.toString() ===
        paymentMint.publicKey.toString()
    )
    assert.ok(priceModel.salePrices[0].amount.toNumber() === 100)
  })

  it("Allows for nft addition", async () => {
    const adminAssociatedAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftMint.publicKey,
      admin.publicKey
    )
    const programAssociatedAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftMint.publicKey,
      marketAddress,
      true
    )

    const token = new Token(
      program.provider.connection,
      nftMint.publicKey,
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
        newItem: nftBucket.publicKey,
        priceModel: priceModelAddress,
        adminNftAccount: adminAssociatedAddress,
        adminNftMint: nftMint.publicKey,
        programNftAccount: programAssociatedAddress,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [nftBucket],
    })

    adminAccount = await token.getAccountInfo(adminAssociatedAddress)
    assert.ok(adminAccount.amount.toNumber() === 0)
    let programAccount = await token.getAccountInfo(programAssociatedAddress)
    assert.ok(programAccount.amount.toNumber() === 1)

    const nftBucketAccount = await program.account.nftBucket.fetch(
      nftBucket.publicKey
    )
    assert.ok(nftBucketAccount.nonce === 0)
    assert.ok(
      nftBucketAccount.tokenAccount.toString() ===
        programAssociatedAddress.toString()
    )
    assert.ok(
      nftBucketAccount.priceModel.toString() === priceModelAddress.toString()
    )
    assert.ok(
      nftBucketAccount.prevListItem.toString() === listHeadAddress.toString()
    )
    assert.ok(
      nftBucketAccount.nextListItem.toString() === listTailAddress.toString()
    )
    assert.ok(nftBucketAccount.payer.toString() === admin.publicKey.toString())

    const listHead = await program.account.nftBucket.fetch(listHeadAddress)
    assert.ok(
      listHead.nextListItem.toString() === nftBucket.publicKey.toString()
    )
    const listTail = await program.account.nftBucket.fetch(listTailAddress)
    assert.ok(
      listTail.prevListItem.toString() === nftBucket.publicKey.toString()
    )
  })

  it("Allows for nft purchasing", async () => {
    const userPaymentAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      paymentMint.publicKey,
      user.publicKey
    )
    const userNftAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftMint.publicKey,
      user.publicKey
    )
    const programCreditAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      paymentMint.publicKey,
      marketAddress,
      true
    )
    const programNftAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftMint.publicKey,
      marketAddress,
      true
    )

    const nftBucketAccount = await program.account.nftBucket.fetch(
      nftBucket.publicKey
    )

    await program.rpc.purchaseNft({
      accounts: {
        owner: user.publicKey,
        rentRefund: admin.publicKey,
        priceModel: priceModelAddress,
        globalState: globalStateAddress,
        market: marketAddress,
        purchaseListItem: nftBucket.publicKey,
        debitMint: paymentMint.publicKey,
        debitAccount: userPaymentAccountAddress,
        programCreditAccount: programCreditAccountAddress,
        programNftAccount: programNftAccountAddress,
        programNftMint: nftMint.publicKey,
        ownerNftAccount: userNftAccountAddress,
        prevListItem: nftBucketAccount.prevListItem,
        nextListItem: nftBucketAccount.nextListItem,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [user],
    })

    try {
      await program.account.nftBucket.fetch(nftBucket.publicKey)
      assert.ok(false)
    } catch (err) {
      assert.ok(true)
    }

    const paymentToken = new Token(
      connection,
      paymentMint.publicKey,
      TOKEN_PROGRAM_ID,
      user
    )
    const userPaymentAccount = await paymentToken.getAccountInfo(
      userPaymentAccountAddress
    )
    assert.ok(userPaymentAccount.amount.toNumber() === 10000 - 100)
    const programCreditAccount = await paymentToken.getAccountInfo(
      programCreditAccountAddress
    )
    assert.ok(programCreditAccount.amount.toNumber() === 100)

    const nftToken = new Token(
      connection,
      nftMint.publicKey,
      TOKEN_PROGRAM_ID,
      user
    )
    const userNFtAccount = await nftToken.getAccountInfo(userNftAccountAddress)
    assert.ok(userNFtAccount.amount.toNumber() === 1)
    try {
      await nftToken.getAccountInfo(programNftAccountAddress)
      assert.ok(false)
    } catch (err) {
      assert.ok(true)
    }

    const prevListItem = await program.account.nftBucket.fetch(
      nftBucketAccount.prevListItem
    )
    assert.ok(
      prevListItem.nextListItem.toString() ===
        nftBucketAccount.nextListItem.toString()
    )
    const nextListItem = await program.account.nftBucket.fetch(
      nftBucketAccount.nextListItem
    )
    assert.ok(
      nextListItem.prevListItem.toString() ===
        nftBucketAccount.prevListItem.toString()
    )
  })
})
