import _ from "lodash"
import {
  Heading,
  Select,
  VStack,
  Radio,
  RadioGroup,
  Text,
  FormControl,
  FormLabel,
  Button,
  AspectRatio,
  Flex,
} from "@chakra-ui/react"
import { Center } from "@chakra-ui/layout"
import { getClusterConstants } from "../../constants"
import { ChangeEvent, useState, useCallback } from "react"
import { PublicKey } from "@solana/web3.js"
import { useAccount, useAccounts } from "../../hooks/useAccounts"
import {
  usePriceModelAddresses,
  useCollectionAddresses,
} from "../../hooks/useSeedAddress"
import { shortenAddress } from "../../solana/address"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"
import { fromRawAmount } from "../../solana/tokenConversion"
import { useNftAccounts } from "../../hooks/useNftAccounts"
import { useMetaplexMetadata } from "../../hooks/useMetaplexMetadata"
import useTxCallback from "../../hooks/useTxCallback"
import addNft from "../../solana/scripts/addNft"

const AddNftPage = () => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const { ADDRESS_VIBE_MARKET, PROGRAM_TOKEN } = getClusterConstants(
    "ADDRESS_VIBE_MARKET",
    "PROGRAM_TOKEN"
  )
  const [market] = useAccount("market", ADDRESS_VIBE_MARKET, {
    subscribe: true,
  })

  const [selectedCollection, setSelectedCollection] = useState<string>("")
  const handleCollectionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCollection(event.target.value)
  }

  const collectionAddresses = useCollectionAddresses(
    market?.publicKey,
    market?.data.numCollections
  )

  const [collections] = useAccounts(
    "collection",
    collectionAddresses &&
      _.map(
        collectionAddresses,
        (collectionAddress) => new PublicKey(collectionAddress)
      )
  )

  const priceModelAddresses = usePriceModelAddresses(
    market?.publicKey,
    market?.data.numPriceModels
  )

  const [priceModels] = useAccounts(
    "priceModel",
    priceModelAddresses &&
      _.map(
        priceModelAddresses,
        (priceModelAddress) => new PublicKey(priceModelAddress)
      )
  )

  const [selectedPriceModel, setSelectedPriceModel] = useState("")

  const [mints] = useAccounts(
    "hMint",
    priceModels &&
      _.flatten(
        _.map(priceModels, (priceModel) =>
          _.map(
            priceModel.data.salePrices,
            (salePrice) => new PublicKey(salePrice.mint)
          )
        )
      ),
    { useCache: true }
  )

  const nftAccounts = useNftAccounts(wallet?.publicKey)

  const [selectedNft, setSelectedNft] = useState<string | undefined>()
  const handleNftChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedNft(event.target.value)
  }
  const selectedMint =
    nftAccounts && selectedNft
      ? new PublicKey(nftAccounts[selectedNft].data.mint)
      : undefined

  const metadata = useMetaplexMetadata(connection, selectedMint)

  const _addNftClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !selectedCollection ||
      !selectedPriceModel ||
      !selectedNft
    ) {
      return
    }
    await addNft(
      anchorAccountCache,
      wallet?.publicKey,
      new PublicKey(selectedCollection),
      new PublicKey(selectedPriceModel),
      new PublicKey(selectedNft)
    )
  }, [
    anchorAccountCache.isEnabled,
    wallet?.publicKey.toString(),
    !selectedCollection.toString(),
    !selectedPriceModel.toString(),
    !selectedNft?.toString(),
  ])

  const addNftClickHandler = useTxCallback(_addNftClickHandler, {
    info: "Adding NFT to collection...",
    success: "NFT added!",
    error: "Transaction failed",
  })

  const disabledButton =
    !anchorAccountCache.isEnabled ||
    !wallet?.publicKey ||
    !selectedCollection ||
    !selectedPriceModel ||
    !selectedNft

  return (
    <Center flexDirection="column" mb="16" w="full">
      <Heading mb="8">Add NFT</Heading>
      <VStack mb="16" w="96" spacing="8">
        <FormControl id="select-collection">
          <FormLabel>Select Collection</FormLabel>
          {collections && (
            <Select
              type="select-collection"
              value={selectedCollection}
              onChange={handleCollectionChange}
              cursor="pointer"
            >
              {_.map(collections, (collection) => (
                <option
                  key={collection.publicKey.toString()}
                  value={collection.publicKey.toString()}
                >
                  {collection.data.title}
                </option>
              ))}
            </Select>
          )}
        </FormControl>
        <FormControl id="radio-price-model">
          <FormLabel>Select Price Model</FormLabel>
          {priceModels && mints && !_.isEmpty(mints) && (
            <RadioGroup
              type="radio-price-model"
              onChange={setSelectedPriceModel}
              value={selectedPriceModel}
            >
              <VStack spacing="8">
                {_.map(priceModels, (priceModel) => (
                  <Radio
                    key={priceModel.publicKey.toString()}
                    value={priceModel.publicKey.toString()}
                    justifyContent="flex-start"
                    alignSelf="flex-start"
                  >
                    {_.map(priceModel.data.salePrices, (salePrice, index) => (
                      <Text key={`sale-price-${index}`}>{`${shortenAddress(
                        salePrice.mint
                      )} [${fromRawAmount(
                        mints[salePrice.mint].data.decimals,
                        salePrice.amount
                      )}]`}</Text>
                    ))}
                  </Radio>
                ))}
              </VStack>
            </RadioGroup>
          )}
        </FormControl>
        <FormControl id="select-nft">
          <FormLabel>Select NFT</FormLabel>
          {_.isEmpty(nftAccounts) ? (
            <Text>No NFT accounts found</Text>
          ) : (
            <>
              <Select
                type="select-nft"
                cursor="pointer"
                value={selectedNft}
                onChange={handleNftChange}
              >
                {_.map(nftAccounts, (nftAccount) => (
                  <option
                    key={nftAccount.publicKey.toString()}
                    value={nftAccount.publicKey.toString()}
                  >
                    {nftAccount.publicKey.toString()}
                  </option>
                ))}
              </Select>
              <Center h="40" w="full" justifyContent="space-around" mt="2">
                {metadata ? (
                  <AspectRatio maxH="40" maxW="40" h="full" w="full" ratio={1}>
                    <img title="selected nft" src={metadata[1]} />
                  </AspectRatio>
                ) : (
                  <Text>No NFT metadata found</Text>
                )}
              </Center>
            </>
          )}
        </FormControl>
        <Button
          colorScheme="purple"
          mt="4"
          px="8"
          w="40"
          onClick={addNftClickHandler}
          disabled={disabledButton}
        >
          Add NFT
        </Button>
      </VStack>
    </Center>
  )
}

export default AddNftPage
