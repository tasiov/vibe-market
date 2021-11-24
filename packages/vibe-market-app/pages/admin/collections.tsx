import _ from "lodash"
import {
  Heading,
  Code,
  Text,
  Input,
  Button,
  Spinner,
  Wrap,
} from "@chakra-ui/react"
import {
  Center,
  VStack,
  StackDivider,
  Container,
  Flex,
} from "@chakra-ui/layout"
import { useAccount, useAccounts } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"
import { useCollectionAddresses } from "../../hooks/useSeedAddress"
import createCollection from "../../solana/scripts/createCollection"
import closeCollection from "../../solana/scripts/closeCollection"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import useTxCallback from "../../hooks/useTxCallback"
import { PublicKey } from "@solana/web3.js"

const CollectionsPage = () => {
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const [title, setTitle] = useState("")
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setTitle(event.target.value)

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const [market] = useAccount("market", ADDRESS_VIBE_MARKET, {
    subscribe: true,
  })

  const createCollectionButtonDisabled =
    !anchorAccountCache.isEnabled || !wallet?.publicKey

  const _createCollectionClickHandler = useCallback(async () => {
    if (!anchorAccountCache.isEnabled || !wallet?.publicKey) {
      return
    }
    await createCollection(anchorAccountCache, wallet?.publicKey, title)
    setTitle("")
  }, [!anchorAccountCache.isEnabled, wallet?.publicKey, title])

  const createCollectionClickHandler = useTxCallback(
    _createCollectionClickHandler,
    {
      info: "Creating collection...",
      success: "Collection created!",
      error: "Transaction failed",
    }
  )

  const collectionAddresses = useCollectionAddresses(
    market?.publicKey,
    market?.data.numCollections
  )

  const [collectionAdress, setCollectionAdress] = useState<string | undefined>(
    undefined
  )

  const [collection, collectionLoading] = useAccount(
    "collection",
    collectionAdress ? new PublicKey(collectionAdress) : undefined
  )

  const _closeCollectionClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !collectionAdress
    ) {
      return
    }
    await closeCollection(
      anchorAccountCache,
      wallet?.publicKey,
      new PublicKey(collectionAdress)
    )
  }, [
    anchorAccountCache.isEnabled,
    wallet?.publicKey.toString(),
    collectionAdress?.toString(),
  ])

  const closeCollectionClickHandler = useTxCallback(
    _closeCollectionClickHandler,
    {
      info: "Closing collection...",
      success: "Collection closed!",
      error: "Transaction failed",
    }
  )

  return (
    <VStack
      w="full"
      divider={<StackDivider borderColor="gray.200" />}
      spacing={16}
      textAlign="center"
    >
      <Center flexDirection="column" mb="16">
        <Heading w="full" mb="8">
          View Collections
        </Heading>
        <Wrap spacing="16" justify="center" minH="96">
          <Flex
            h="80"
            w="96"
            p="4"
            flexDirection="column"
            overflow="auto"
            border="1px solid black"
            borderRadius="10px"
          >
            {collectionAddresses &&
              _.map(collectionAddresses, (publicKey) => (
                <Button
                  key={publicKey.toString()}
                  value={publicKey.toString()}
                  size="xs"
                  mb="2"
                  p="1"
                  onClick={setCollectionAdress.bind(null, publicKey.toString())}
                >
                  {publicKey.toString()}
                </Button>
              ))}
          </Flex>
          <VStack>
            <Flex
              w="96"
              p="4"
              minH="80"
              flexDirection="column"
              border="1px solid black"
              borderRadius="10px"
            >
              {collection && (
                <Code
                  w="full"
                  textAlign="left"
                  mb="2"
                  key={`collection-data-publicKey`}
                  backgroundColor="transparent"
                >{`publicKey: ${collection.publicKey.toString()}`}</Code>
              )}
              {collection &&
                _.map(
                  Object.keys(collection.data),
                  (key: keyof typeof collection.data) => (
                    <Code
                      w="full"
                      textAlign="left"
                      mb="2"
                      key={`collection-data-${key}`}
                      backgroundColor="transparent"
                    >{`${key}: ${collection.data[key]}`}</Code>
                  )
                )}
              {!collection && collectionLoading && (
                <Center>
                  <Spinner />
                </Center>
              )}
              {!collection && !collectionLoading && (
                <Text textAlign="center">Collection not found</Text>
              )}
            </Flex>
            {collection && (
              <Button
                colorScheme="red"
                mt="4"
                px="8"
                w="40"
                onClick={closeCollectionClickHandler}
              >
                Close Collection
              </Button>
            )}
          </VStack>
        </Wrap>
      </Center>
      <Center flexDirection="column">
        <Heading w="full">Create Collection</Heading>
        <Center mt="8" w="96" flexDirection="column">
          <Input
            placeholder="Title"
            w="full"
            mr="4"
            maxLength={32}
            value={title}
            onChange={handleTitleChange}
          />
          <Button
            colorScheme="purple"
            mt="4"
            px="8"
            w="40"
            onClick={createCollectionClickHandler}
            disabled={createCollectionButtonDisabled}
          >
            Create Collection
          </Button>
        </Center>
      </Center>
    </VStack>
  )
}

export default CollectionsPage
