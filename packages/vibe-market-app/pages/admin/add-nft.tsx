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
  Box,
  Image,
  HStack,
  Spinner,
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
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import { useConnection } from "@solana/wallet-adapter-react"
import { fromRawAmount } from "../../solana/tokenConversion"
import { useNftAccounts } from "../../hooks/useNftAccounts"
import { useMetaplexMetadata } from "../../hooks/useMetaplexMetadata"
import useTxCallback from "../../hooks/useTxCallback"
import addNft from "../../solana/scripts/addNft"
import { useTokenRegistry } from "../../hooks/useTokenRegistry"
import useWalletPublicKey from "../../hooks/useWalletPublicKey"

const AddNftPage = () => {
  const { connection } = useConnection()
  const walletPublicKey = useWalletPublicKey()
  const anchorAccountCache = useAnchorAccountCache()
  const tokenRegistry = useTokenRegistry()

  const { ADDRESS_VIBE_MARKET, PROGRAM_TOKEN } = getClusterConstants(
    "ADDRESS_VIBE_MARKET",
    "PROGRAM_TOKEN"
  )
  const [market] = useAccount("market", ADDRESS_VIBE_MARKET, {
    subscribe: true,
  })

  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >()
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

  const [selectedPriceModel, setSelectedPriceModel] = useState<
    string | undefined
  >()

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

  const nftAccounts = useNftAccounts(walletPublicKey)

  const [selectedNft, setSelectedNft] = useState<string | undefined>()
  const handleNftChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedNft(event.target.value)
  }
  const selectedMint =
    nftAccounts && selectedNft ? nftAccounts[selectedNft].data.mint : undefined

  const [metadata, metadataLoading] = useMetaplexMetadata(
    connection,
    selectedMint ? new PublicKey(selectedMint) : undefined
  )

  const _addNftClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !walletPublicKey ||
      !selectedCollection ||
      !selectedPriceModel ||
      !selectedNft
    ) {
      return
    }
    await addNft(
      anchorAccountCache,
      walletPublicKey,
      new PublicKey(selectedCollection),
      new PublicKey(selectedPriceModel),
      new PublicKey(selectedNft)
    )
  }, [
    anchorAccountCache.isEnabled,
    walletPublicKey?.toString(),
    selectedCollection,
    selectedPriceModel,
    selectedNft,
  ])

  const addNftClickHandler = useTxCallback(_addNftClickHandler, {
    info: "Adding NFT to collection...",
    success: "NFT added!",
    error: "Transaction failed",
  })

  const disabledButton =
    !anchorAccountCache.isEnabled ||
    !walletPublicKey ||
    !selectedCollection ||
    !selectedPriceModel ||
    !selectedNft ||
    !metadata

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
              placeholder="Title"
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
          {priceModels &&
            !_.isEmpty(priceModels) &&
            mints &&
            !_.isEmpty(mints) &&
            tokenRegistry && (
              <RadioGroup
                type="radio-price-model"
                onChange={setSelectedPriceModel}
                value={selectedPriceModel}
              >
                <VStack spacing="8">
                  {_.map(priceModels, (priceModel, index) => (
                    <Radio
                      key={priceModel.publicKey.toString()}
                      value={index}
                      justifyContent="flex-start"
                      alignSelf="flex-start"
                    >
                      {_.map(priceModel.data.salePrices, (salePrice, index) => {
                        const registryMint = tokenRegistry[salePrice.mint]
                        return (
                          <HStack key={`sale-price-${index}`}>
                            <Text>
                              {fromRawAmount(
                                mints[salePrice.mint].data.decimals,
                                salePrice.amount
                              )}
                            </Text>
                            <Text>{registryMint.symbol}</Text>
                          </HStack>
                        )
                      })}
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
                placeholder="NFT Mint Address"
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
                {metadata && (
                  <Image
                    title="selected nft"
                    maxH="full"
                    maxW="full"
                    src={metadata[1].image}
                  />
                )}
                {!metadata && metadataLoading && <Spinner />}
                {!metadata && !metadataLoading && (
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
