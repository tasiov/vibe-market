## Scripts

### Batch Add Nfts

Command: `yarn batch-add-nfts`

This command allows you to upload NFTs to the vibe marketplace in large batches. There is a file located in `scripts/batchAddNftConfig.json` that you must configure in order to run this script. The json config file should look like this:

```js
{
  "cluster": "mainnet", // devnet or mainnet
  "keypair": "./mainnet-wallet.json", // the path to a Solana keypair that holds NFTs and will pay for the uploads
  "collectionAddress": "3LU3zDUMX9ca6Qsf2RtDL5XAfeYzvCoAW5Uu3PjjnFBr", // a Solana address to a valid Collection account
  "priceModelAddress": "AqzVPF7G2aUCEA4fDpqzvQ3UiXLr2xNEiCjmPAb39Qxz", // a Solana address to a valid Price Model account
  "preview": false // Run in preview mode, does not execute the upload
}
```

The script will take the provided keypair, and upload all of it's NFTs to the Vibe Market program. This keypair will also pay the transaction fees that must be paid. As users purchase NFTs on the site, this account will be reimbursed for the Solana rent fees that were paid to store the NFTs on chain. Lastly, this account needs to be an admin on the market so that it has the authority to add NFTs.

The `collectionAddress` will determine which collection the NFTs are stored under. The collection address can be retrieved from the collection page on the app.

The `priceModelAddress` will determine the price for the NFTs that are being uploaded. The price model address can be retrieved from the price model page on the app.
