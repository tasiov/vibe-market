import _ from "lodash"
import fs from "fs"
import { Provider, Wallet } from "@project-serum/anchor"
import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  Signer,
} from "@solana/web3.js"
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { HToken, HTokenManager } from "../models/tokenAccount"
import { getClusterConstants, setCluster } from "../constants"
import { getVibeMarketProgram } from "../solana/getPrograms"
import config from "./batchAddNftConfig.json"

const BATCH_SIZE = 3

interface Config {
  cluster: "devnet" | "mainnet-beta"
  keypair: string
  collectionAddress: string
  priceModelAddress: string
  preview: boolean
}

const validateConfig = (value: any): value is Readonly<Config> => {
  const invalidKeyMap: string[] = []
  if (!_.includes(["devnet", "mainnet-beta"], value.cluster)) {
    invalidKeyMap.push("cluster")
  }
  if (typeof value["preview"] !== "boolean") {
    invalidKeyMap.push("preview")
  }
  _.forEach(["keypair"], (key) => {
    if (typeof value[key] !== "string") {
      invalidKeyMap.push(key)
    }
  })
  _.forEach(["collectionAddress", "priceModelAddress"], (key) => {
    try {
      new PublicKey(value[key])
    } catch (err) {
      invalidKeyMap.push(key)
    }
  })
  if (_.isEmpty(invalidKeyMap)) {
    return true
  }
  console.log(`Invalid keys: ${_.join(invalidKeyMap, ", ")}`)
  return false
}

const loadKeypair = (keypairPath: string) => {
  let keypair: Keypair
  try {
    const rawSecretKey = fs.readFileSync(keypairPath)
    const parsedSecretKey = new Uint8Array(JSON.parse(rawSecretKey.toString()))
    keypair = Keypair.fromSecretKey(parsedSecretKey)
  } catch (err) {
    console.log(err)
    throw new Error("Failed to load keypair")
  }
  return keypair
}

const main = async () => {
  if (!validateConfig(config)) {
    throw new Error("Config is invalid")
  }
  const connection = new Connection(clusterApiUrl(config.cluster))
  const keypair = loadKeypair(config.keypair)
  const wallet = new Wallet(keypair)
  console.log(`Using wallet: ${wallet.publicKey.toString()}`)

  setCluster(config.cluster)
  const { ADDRESS_VIBE_MARKET, PROGRAM_VIBE_MARKET } = getClusterConstants(
    "ADDRESS_VIBE_MARKET",
    "PROGRAM_VIBE_MARKET"
  )
  console.log(`Vibe Market Program: ${PROGRAM_VIBE_MARKET.toString()}`)
  console.log(`Vibe Market Address: ${ADDRESS_VIBE_MARKET.toString()}`)

  const provider = new Provider(connection, wallet, {
    preflightCommitment: "recent",
    commitment: "recent",
  })
  const vibeMarketProgram = await getVibeMarketProgram(provider)

  const collectionAddress = new PublicKey(config.collectionAddress)
  const priceModelAddress = new PublicKey(config.priceModelAddress)
  const collection = await vibeMarketProgram.account.collection.fetch(
    collectionAddress
  )
  const listHead = await vibeMarketProgram.account.nftBucket.fetch(
    collection.listHead
  )

  console.log("Fetching token accounts...")
  const tokenAccountManager = new HTokenManager(connection)
  const fetchedTokenAccounts =
    await tokenAccountManager.getTokenAccountsByOwner(wallet.publicKey)
  const nftTokenAccounts = _.reduce(
    fetchedTokenAccounts,
    (accum: HToken[], tokenAccount) => {
      if (tokenAccount.data.amount === 1) {
        accum.push(tokenAccount)
      }
      return accum
    },
    []
  )
  console.log(`Fetched ${_.size(nftTokenAccounts)} nft token accounts`)

  if (config.preview) {
    console.log(`Exiting preview...`)
    return
  }

  console.log(`Processing these ${_.size(nftTokenAccounts)} accounts...`)
  const listHeadAddress = collection.listHead
  let nextListItem = listHead.nextListItem
  let remainingAccounts = nftTokenAccounts
  let count = 0
  while (!_.isEmpty(remainingAccounts)) {
    const processingTokenAccounts = _.slice(remainingAccounts, 0, BATCH_SIZE)
    remainingAccounts = _.slice(remainingAccounts, BATCH_SIZE)

    const transaction = new Transaction()
    const signers: Signer[] = [keypair]
    for (let i = 0; i < processingTokenAccounts.length; i++) {
      const tokenAccount = processingTokenAccounts[i]
      const nftBucket = Keypair.generate()
      const nftMintAddress = new PublicKey(tokenAccount.data.mint)
      const programAssociatedAddress = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        nftMintAddress,
        collectionAddress,
        true
      )
      transaction.add(
        vibeMarketProgram.instruction.addNft({
          accounts: {
            admin: wallet.publicKey,
            market: ADDRESS_VIBE_MARKET,
            collection: collectionAddress,
            listHead: listHeadAddress,
            nextListItem: nextListItem,
            newItem: nftBucket.publicKey,
            priceModel: priceModelAddress,
            adminNftAccount: tokenAccount.publicKey,
            adminNftMint: nftMintAddress,
            programNftAccount: programAssociatedAddress,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        })
      )
      signers.push(nftBucket)
      nextListItem = nftBucket.publicKey
    }
    const txSig = await provider.send(transaction, signers)
    console.log(`Tx succeeded: ${txSig}`)
    await provider.connection.confirmTransaction(txSig)
    count += BATCH_SIZE
    console.log(`Uploaded ${count} total`)
  }
  console.log("Process complete")
}

main()
