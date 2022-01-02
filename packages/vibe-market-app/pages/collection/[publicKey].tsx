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
import { useState, useCallback, useMemo } from "react"
import { useAccount, useAccounts } from "../../hooks/useAccounts"
import { PublicKey } from "@solana/web3.js"
import { useBreakpointValue } from "@chakra-ui/media-query"
import {
  usePurchaseItems,
  PurchaseItem,
  useNftBucketAddresses,
} from "../../hooks/usePurchaseItems"
import { shortenAddress } from "../../solana/address"
import { programs } from "@metaplex/js"
import { FiArrowLeft, FiArrowRight } from "react-icons/fi"
import { useTokenRegistry } from "../../hooks/useTokenRegistry"
import { fromRawAmount } from "../../solana/tokenConversion"
import useTxCallback from "../../hooks/useTxCallback"
import purchaseNft from "../../solana/scripts/purchaseNft"
import withdrawNft from "../../solana/scripts/withdrawNft"
import useWalletPublicKey from "../../hooks/useWalletPublicKey"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import { useTokenAccounts } from "../../hooks/useTokenAccounts"
import { useBalance } from "../../hooks/useBalance"
import { ADDRESS_NATIVE_MINT } from "../../constants/shared"
import { useIsAdmin } from "../../hooks/useIsAdmin"
import { getClusterConstants } from "../../constants"
import { NftBucket } from "../../models/nftBucket"

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

  const walletPublicKey = useWalletPublicKey()
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
    collection && new PublicKey(collection.data.listHead),
    { subscribe: true }
  )

  const [pageAddresses, setPageAddresses] = useState<PublicKey[]>([])
  const [page, setPage] = useState<number>(0)

  const firstBucketAddress =
    page === 0
      ? listHead
        ? new PublicKey(listHead.data.nextListItem)
        : undefined
      : pageAddresses[page - 1]

  const [nftBucketAddresses, nftBucketAddressesLoading] = useNftBucketAddresses(
    firstBucketAddress,
    collection ? new PublicKey(collection.data.listTail) : undefined,
    numBucketsPerPage,
    refreshFlag
  )
  const [nftBuckets] = useAccounts("nftBucket", nftBucketAddresses)

  const nftBucketsList = useMemo(() => {
    if (!nftBucketAddresses || !nftBuckets) {
      return
    }
    const retval: NftBucket[] = []
    for (let i = 0; i < nftBucketAddresses.length; i++) {
      const key = nftBucketAddresses[i].toString()
      const nftBucket = nftBuckets[key]
      if (!nftBucket) {
        break
      }
      retval.push(nftBucket)
    }
    return retval
  }, [nftBucketAddresses, nftBuckets])

  const purchaseItems = usePurchaseItems(nftBucketsList)

  const onLeftButtonClick = () => {
    setPage(page - 1)
  }

  const leftButtonEnabled =
    collection &&
    nftBucketsList &&
    !_.isEmpty(nftBucketsList) &&
    nftBucketsList[0].data.prevListItem !== collection.data.listHead

  const onRightButtonClick = () => {
    if (!nftBucketsList) {
      return
    }
    const newPageAddresses = [...pageAddresses]
    newPageAddresses.push(
      new PublicKey(nftBucketsList[nftBucketsList.length - 1].data.nextListItem)
    )
    setPageAddresses(newPageAddresses)
    setPage(page + 1)
  }

  const rightButtonEnabled =
    collection &&
    nftBucketsList &&
    !_.isEmpty(nftBucketsList) &&
    nftBucketsList[nftBucketsList.length - 1].data.nextListItem !==
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

  const tokenAccounts = useTokenAccounts(walletPublicKey)
  const solBalance = useBalance(anchorAccountCache, walletPublicKey)

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<
    string | undefined
  >()

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const isAdmin = useIsAdmin(ADDRESS_VIBE_MARKET)

  const handleNftRemoval = () => {
    setSelectedPurchaseItem(undefined)
    setPageAddresses(_.slice(pageAddresses, 0, page))
    if (page > 0 && nftBucketsList?.length === 1) {
      setPage(page - 1)
    }
    setRefreshFlag(!refreshFlag)
  }

  const _purchaseNftClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !walletPublicKey ||
      !collection ||
      !selectedPurchaseItem ||
      !selectedPaymentOption
    ) {
      return
    }
    const paymentTokenAccount = tokenAccounts[selectedPaymentOption]
    await purchaseNft(
      anchorAccountCache,
      walletPublicKey,
      collection.publicKey,
      selectedPurchaseItem.nftBucket.publicKey,
      new PublicKey(selectedPaymentOption),
      paymentTokenAccount?.publicKey
    )
    handleNftRemoval()
  }, [
    anchorAccountCache.isEnabled,
    walletPublicKey?.toString(),
    collection?.publicKey.toString(),
    selectedPurchaseItem,
    selectedPaymentOption,
    tokenAccounts,
  ])

  const purchaseNftClickHandler = useTxCallback(_purchaseNftClickHandler, {
    info: "Purchasing NFT...",
    success: "NFT purchased!",
    error: "Transaction failed",
  })

  const _withdrawNftClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !walletPublicKey ||
      !collection ||
      !selectedPurchaseItem
    ) {
      return
    }
    await withdrawNft(
      anchorAccountCache,
      walletPublicKey,
      collection.publicKey,
      selectedPurchaseItem.nftBucket.publicKey
    )
    handleNftRemoval()
  }, [
    anchorAccountCache.isEnabled,
    walletPublicKey?.toString(),
    collection?.publicKey.toString(),
    selectedPurchaseItem,
  ])

  const withdrawNftClickHandler = useTxCallback(_withdrawNftClickHandler, {
    info: "Withdrawing NFT...",
    success: "NFT withdrawn!",
    error: "Transaction failed",
  })

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
                        selectedPurchaseItem.metadata.data.mint,
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
                      onChange={setSelectedPaymentOption}
                      value={selectedPaymentOption}
                    >
                      <VStack spacing="6">
                        {_.map(
                          selectedPurchaseItem.priceModel.data.salePrices,
                          (salePrice, index) => {
                            const { logoURI, symbol } =
                              tokenRegistry[salePrice.mint]
                            const mint = mints[salePrice.mint]
                            let userBalance = 0
                            if (
                              salePrice.mint ===
                                ADDRESS_NATIVE_MINT.toString() &&
                              solBalance
                            ) {
                              userBalance = solBalance
                            } else if (tokenAccounts[salePrice.mint]) {
                              userBalance = fromRawAmount(
                                mint.data.decimals,
                                tokenAccounts[salePrice.mint].data.amount
                              )
                            }
                            return (
                              <Radio
                                key={salePrice.mint.toString()}
                                value={salePrice.mint.toString()}
                                justifyContent="flex-start"
                                alignSelf="flex-start"
                              >
                                <HStack position="relative">
                                  {logoURI && (
                                    <Image
                                      alt="token image"
                                      w="4"
                                      h="4"
                                      borderRadius="20"
                                      src={logoURI}
                                    />
                                  )}
                                  <Text>{`${symbol} ${fromRawAmount(
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
                                  >{`Balance: ${userBalance.toFixed(2)}`}</Text>
                                </HStack>
                              </Radio>
                            )
                          }
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
                disabled={!selectedPaymentOption || !tokenAccounts}
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
      {!nftBucketAddressesLoading &&
        nftBucketAddresses &&
        _.isEmpty(nftBucketAddresses) && (
          <Center
            w="full"
            position="relative"
            maxW={{ base: "auto", lg: "70%" }}
          >
            <Text
              position="absolute"
              top={{ base: "2", md: "8" }}
              color="white"
              fontSize={{ base: "16", md: "24", lg: "32" }}
              fontWeight="800"
            >
              NFTs Not Found
            </Text>
            <Image
              alt="token image"
              maxW="900px"
              w="full"
              h="full"
              borderRadius="20"
              src={"/nfts-not-found.png"}
            />
          </Center>
        )}
      {nftBucketAddressesLoading && numBucketsPerPage && (
        <SimpleGrid
          columns={numColumnsPerPage}
          spacing={16}
          maxW="900px"
          minH="70vh"
          w="full"
        >
          {_.map(_.range(numBucketsPerPage), (index) => {
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
        </SimpleGrid>
      )}
      {!nftBucketAddressesLoading &&
        purchaseItems &&
        !_.isEmpty(nftBucketAddresses) && (
          <SimpleGrid
            columns={numColumnsPerPage}
            spacing={16}
            maxW="900px"
            minH="70vh"
            w="full"
          >
            {_.map(purchaseItems, (purchaseItem) => {
              const { nftBucket, priceModel, metadata, staticData } =
                purchaseItem
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
                                      src={
                                        tokenRegistry[salePrice.mint].logoURI
                                      }
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
        )}
    </Center>
  )
}

export default NftPurchasePage
