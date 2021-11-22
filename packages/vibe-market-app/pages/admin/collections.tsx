import _ from "lodash"
import {
  Heading,
  Code,
  Text,
  Input,
  Button,
  Divider,
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

const CreateCollection = () => {
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const [title, setTitle] = useState("")
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setTitle(event.target.value)

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const market = useAccount("market", ADDRESS_VIBE_MARKET)

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

  const collection = useAccount(
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
      spacing={4}
      textAlign="center"
    >
      <Center flexDirection="column" mb="16">
        <Heading w="full">View Collections</Heading>
        <Wrap mt="4" spacing="20" justify="center">
          <Flex mt="8" flexDirection="column" h="80" overflow="auto" p="4">
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
          <Center mt="8" w="96" p="4" h="80" flexDirection="column">
            <Flex
              flexDirection="column"
              justifyContent="flex-start"
              alignItems="flex-start"
              backgroundColor="gray.100"
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
          </Center>
        </Wrap>
      </Center>
      <Center mt="16" flexDirection="column">
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

export default CreateCollection
