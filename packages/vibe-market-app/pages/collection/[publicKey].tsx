import _ from "lodash"
import { useRouter } from "next/router"
import { Heading, Center, Box, VStack, HStack, Flex } from "@chakra-ui/layout"
import {
  Skeleton,
  SimpleGrid,
  Image,
  Text,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Link,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
} from "@chakra-ui/react"
import { useState, useCallback } from "react"
import { useAccount, useAccounts } from "../../hooks/useAccounts"
import { PublicKey } from "@solana/web3.js"
import { useBreakpointValue } from "@chakra-ui/media-query"
import {
  useNftBuckets,
  usePurchaseItems,
  PurchaseItem,
} from "../../hooks/usePurchaseItems"
import { shortenAddress } from "../../solana/address"
import { programs } from "@metaplex/js"
import { FiArrowLeft, FiArrowRight } from "react-icons/fi"
import { useTokenRegistry } from "../../hooks/useTokenRegistry"
import { fromRawAmount } from "../../solana/tokenConversion"
import useTxCallback from "../../hooks/useTxCallback"
import purchaseNft from "../../solana/scripts/purchaseNft"
import withdrawNft from "../../solana/scripts/withdrawNft"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import { useTokenAccounts } from "../../hooks/useTokenAccounts"
import { useBalance } from "../../hooks/useBalance"
import { ADDRESS_NATIVE_MINT } from "../../constants/shared"
import { useIsAdmin } from "../../hooks/useIsAdmin"
import { getClusterConstants } from "../../constants"

const getItemHeaderText = (
  metadata?: programs.metadata.Metadata,
  staticData?: any
) => {
  const retval = []
  if (metadata?.data.data.symbol) {
    retval.push(metadata.data.data.symbol)
  }
  if (staticData?.data.name) {
    retval.push(staticData.data.name)
  }
  return _.join(retval, ": ")
}

const NftPurchasePage = () => {
  const { query } = useRouter()
  const numBucketsPerPage = useBreakpointValue({ base: 2, sm: 4, lg: 6 })
  const numColumnsPerPage = useBreakpointValue({ base: 1, sm: 2, lg: 3 })

  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const [refreshFlag, setRefreshFlag] = useState(false)

  const collectionAddress =
    typeof query.publicKey === "string"
      ? new PublicKey(query.publicKey)
      : undefined

  const [collection] = useAccount("collection", collectionAddress, {
    useCache: true,
  })

  const [listHead] = useAccount(
    "nftBucket",
    collection && new PublicKey(collection.data.listHead)
  )

  const [pageAddresses, setPageAddresses] = useState<PublicKey[]>([])
  const [page, setPage] = useState<number>(0)

  const firstBucketAddress =
    page === 0
      ? listHead
        ? new PublicKey(listHead.data.nextListItem)
        : undefined
      : pageAddresses[page - 1]

  const nftBuckets = useNftBuckets(
    firstBucketAddress,
    collection ? new PublicKey(collection.data.listTail) : undefined,
    numBucketsPerPage,
    refreshFlag
  )
  const purchaseItems = usePurchaseItems(nftBuckets)

  const onLeftButtonClick = () => {
    setPage(page - 1)
  }

  const leftButtonEnabled =
    collection &&
    nftBuckets &&
    nftBuckets[0].data.prevListItem !== collection.data.listHead

  const onRightButtonClick = () => {
    if (!nftBuckets) {
      return
    }
    const newPageAddresses = [...pageAddresses]
    newPageAddresses.push(
      new PublicKey(nftBuckets[nftBuckets.length - 1].data.nextListItem)
    )
    setPageAddresses(newPageAddresses)
    setPage(page + 1)
  }

  const rightButtonEnabled =
    collection &&
    nftBuckets &&
    nftBuckets[nftBuckets.length - 1].data.nextListItem !==
      collection.data.listTail

  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState<
    PurchaseItem | undefined
  >()
  const modalClose = () => setSelectedPurchaseItem(undefined)

  const tokenRegistry = useTokenRegistry()

  const mintAddresses =
    selectedPurchaseItem &&
    _.map(
      selectedPurchaseItem.priceModel.data.salePrices,
      (salePrice) => new PublicKey(salePrice.mint)
    )

  const [mints] = useAccounts("hMint", mintAddresses, { useCache: true })

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<
    string | undefined
  >()

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const isAdmin = useIsAdmin(ADDRESS_VIBE_MARKET)

  const _purchaseNftClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !collection ||
      !selectedPurchaseItem ||
      !selectedPaymentOption
    ) {
      return
    }
    await purchaseNft(
      anchorAccountCache,
      wallet.publicKey,
      collection.publicKey,
      selectedPurchaseItem.nftBucket.publicKey,
      new PublicKey(selectedPaymentOption)
    )
    setRefreshFlag(!refreshFlag)
  }, [
    anchorAccountCache.isEnabled,
    wallet?.publicKey.toString(),
    collection?.publicKey.toString(),
    selectedPurchaseItem,
    selectedPaymentOption,
  ])

  const purchaseNftClickHandler = useTxCallback(_purchaseNftClickHandler, {
    info: "Purchasing NFT...",
    success: "NFT purchased!",
    error: "Transaction failed",
  })

  const _withdrawNftClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !collection ||
      !selectedPurchaseItem
    ) {
      return
    }
    await withdrawNft(
      anchorAccountCache,
      wallet.publicKey,
      collection.publicKey,
      selectedPurchaseItem.nftBucket.publicKey
    )
    if (
      firstBucketAddress &&
      selectedPurchaseItem.nftBucket.publicKey.equals(firstBucketAddress)
    ) {
      setPageAddresses(
        _.map(pageAddresses, (pageAddress) =>
          pageAddress.equals(selectedPurchaseItem.nftBucket.publicKey)
            ? new PublicKey(selectedPurchaseItem.nftBucket.data.nextListItem)
            : pageAddress
        )
      )
    } else {
      setRefreshFlag(!refreshFlag)
    }
  }, [
    anchorAccountCache.isEnabled,
    wallet?.publicKey.toString(),
    collection?.publicKey.toString(),
    selectedPurchaseItem,
  ])

  const withdrawNftClickHandler = useTxCallback(_withdrawNftClickHandler, {
    info: "Withdrawing NFT...",
    success: "NFT withdrawn!",
    error: "Transaction failed",
  })

  const tokenAccounts = useTokenAccounts(wallet?.publicKey)
  const solBalance = useBalance(anchorAccountCache, wallet?.publicKey)

  return (
    <Center flexDirection="column" w="full">
      <Modal isOpen={!!selectedPurchaseItem} size="xl" onClose={modalClose}>
        <ModalOverlay />
        {selectedPurchaseItem && tokenRegistry && mints && !_.isEmpty(mints) && (
          <ModalContent>
            <ModalHeader>
              {getItemHeaderText(
                selectedPurchaseItem.metadata,
                selectedPurchaseItem.staticData
              )}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <HStack alignItems="flex-start" spacing={4} w="full">
                <VStack textAlign="left" minW="50%">
                  <Image
                    alt="selected nft"
                    objectFit="cover"
                    h="full"
                    maxH="80"
                    boxShadow="md"
                    borderRadius="lg"
                    src={selectedPurchaseItem.staticData.data.image}
                  />
                  <Text w="full" fontWeight="bold">
                    About
                  </Text>
                  <Text w="full">
                    {selectedPurchaseItem.staticData.data.description}
                  </Text>
                  <Box w="full">
                    <Text w="full" fontWeight="bold">
                      {"Mint ID"}
                    </Text>
                    <Link
                      href={`https://explorer.solana.com/address/${selectedPurchaseItem.metadata.data.mint}`}
                      target="_blank"
                      color="blue.500"
                      fontSize="lg"
                      w="full"
                    >
                      {shortenAddress(
                        selectedPurchaseItem.metadata.data.mint || "",
                        6
                      )}
                    </Link>
                  </Box>
                </VStack>
                <VStack h="full" minW="35%" justifyContent="space-between">
                  <FormControl id="radio-payment-option">
                    <FormLabel>Select Payment Option</FormLabel>
                    <RadioGroup
                      type="radio-payment-option"
                      onChange={setSelectedPaymentOption.bind(this)}
                      value={selectedPaymentOption}
                    >
                      <VStack spacing="6">
                        {_.map(
                          selectedPurchaseItem.priceModel.data.salePrices,
                          (salePrice, index) => (
                            <Radio
                              key={salePrice.mint.toString()}
                              value={salePrice.mint.toString()}
                              justifyContent="flex-start"
                              alignSelf="flex-start"
                            >
                              <HStack position="relative">
                                {tokenRegistry[salePrice.mint].logoURI && (
                                  <Image
                                    alt="token image"
                                    w="4"
                                    h="4"
                                    borderRadius="20"
                                    src={tokenRegistry[salePrice.mint].logoURI}
                                  />
                                )}
                                <Text>{`${
                                  tokenRegistry[salePrice.mint].symbol
                                } ${fromRawAmount(
                                  mints[salePrice.mint].data.decimals,
                                  salePrice.amount
                                )}`}</Text>
                                <Text
                                  position="absolute"
                                  top="5"
                                  m="0"
                                  w="40"
                                  color="grey"
                                  fontWeight="700"
                                  fontSize="14px"
                                >{`Balance: ${
                                  salePrice.mint ===
                                  ADDRESS_NATIVE_MINT.toString()
                                    ? solBalance?.toFixed(2)
                                    : fromRawAmount(
                                        mints[salePrice.mint].data.decimals,
                                        tokenAccounts[salePrice.mint].data
                                          .amount
                                      )
                                }`}</Text>
                              </HStack>
                            </Radio>
                          )
                        )}
                      </VStack>
                    </RadioGroup>
                  </FormControl>
                </VStack>
              </HStack>
            </ModalBody>

            <ModalFooter>
              <Button
                bgColor="brandPink.200"
                color="white"
                mr={3}
                onClick={purchaseNftClickHandler}
                _hover={{
                  bgColor: "brandPink.900",
                }}
                disabled={!selectedPaymentOption}
              >
                Buy Now
              </Button>
              {isAdmin && (
                <Button variant="ghost" onClick={withdrawNftClickHandler}>
                  Admin Withdraw
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
      <Heading mb="8" textAlign="center">
        {collection ? collection.data.title : "..."}
      </Heading>
      <Center w="full" maxW="900px" justifyContent="space-between" mb="8">
        <IconButton
          aria-label="nav-left"
          icon={<FiArrowLeft />}
          onClick={onLeftButtonClick}
          disabled={!leftButtonEnabled}
        />
        <IconButton
          aria-label="nav-right"
          icon={<FiArrowRight />}
          onClick={onRightButtonClick}
          disabled={!rightButtonEnabled}
        />
      </Center>
      <SimpleGrid
        columns={numColumnsPerPage}
        spacing={16}
        maxW="900px"
        maxH="full"
        w="full"
      >
        {!purchaseItems &&
          numBucketsPerPage &&
          _.map(_.range(numBucketsPerPage), (index) => {
            return (
              <Skeleton
                key={`skeleton-${index}`}
                startColor="brandPink.100"
                endColor="brandPink.900"
                boxShadow="md"
                borderRadius="md"
              >
                <Box bg="beige" h="280px" w="full"></Box>
              </Skeleton>
            )
          })}
        {purchaseItems &&
          _.map(purchaseItems, (purchaseItem) => {
            const { nftBucket, priceModel, metadata, staticData } = purchaseItem
            return (
              <Box
                bg="beige"
                h="280px"
                w="full"
                boxShadow="md"
                borderRadius="md"
                cursor="pointer"
                overflow="hidden"
                key={purchaseItem.nftBucket.publicKey.toString()}
                onClick={() => setSelectedPurchaseItem(purchaseItem)}
              >
                <VStack h="full">
                  <Center bgColor="gray.400" minH="55%" maxH="55%" w="full">
                    {staticData && (
                      <Image
                        alt="selected nft"
                        objectFit="contain"
                        h="full"
                        boxShadow="md"
                        src={staticData.data.image}
                      />
                    )}
                  </Center>
                  {metadata && staticData && (
                    <VStack w="full" p="4">
                      <Heading size="sm">
                        {getItemHeaderText(metadata, staticData)}
                      </Heading>
                      {priceModel && tokenRegistry && (
                        <SimpleGrid
                          columns={
                            priceModel.data.salePrices.length > 4 ? 3 : 2
                          }
                          spacing={2}
                          w="full"
                          h="full"
                        >
                          {_.map(
                            priceModel.data.salePrices,
                            (salePrice, index) => (
                              <HStack
                                justifyContent="center"
                                alignItems="center"
                                key={`sale-price-${index}`}
                              >
                                {tokenRegistry[salePrice.mint].logoURI && (
                                  <Image
                                    alt="token image"
                                    w="4"
                                    h="4"
                                    borderRadius="20"
                                    src={tokenRegistry[salePrice.mint].logoURI}
                                  />
                                )}
                                <Text fontSize="14px">{`${
                                  tokenRegistry[salePrice.mint].symbol
                                } ${fromRawAmount(
                                  tokenRegistry[salePrice.mint].decimals,
                                  salePrice.amount
                                )}`}</Text>
                              </HStack>
                            )
                          )}
                        </SimpleGrid>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Box>
            )
          })}
      </SimpleGrid>
    </Center>
  )
}

export default NftPurchasePage
