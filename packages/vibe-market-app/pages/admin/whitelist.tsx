import _ from "lodash"
import { Heading, Text, Input, Button } from "@chakra-ui/react"
import { Center, Box, Container, Flex } from "@chakra-ui/layout"
import { useAccount } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"
import addAdmin from "../../solana/scripts/addAdmin"
import removeAdmin from "../../solana/scripts/removeAdmin"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import useTxCallback from "../../hooks/useTxCallback"
import { PublicKey } from "@solana/web3.js"

const WhitelistPage = () => {
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const [market] = useAccount("market", ADDRESS_VIBE_MARKET)

  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const [addPublicKey, setAddPublicKey] = useState("")
  const [removePublicKey, setRemovePublicKey] = useState("")

  const handleAddChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setAddPublicKey(event.target.value)
  const handleRemoveChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setRemovePublicKey(event.target.value)

  const buttonDisabled = !anchorAccountCache.isEnabled || !wallet?.publicKey

  const _addAdminClickHandler = useCallback(async () => {
    if (!anchorAccountCache.isEnabled || !wallet?.publicKey || !addPublicKey) {
      return
    }
    await addAdmin(
      anchorAccountCache,
      wallet?.publicKey,
      new PublicKey(addPublicKey)
    )
    setAddPublicKey("")
  }, [!anchorAccountCache.isEnabled, wallet?.publicKey, addPublicKey])

  const addAdminClickHandler = useTxCallback(_addAdminClickHandler, {
    info: "Adding admin...",
    success: "Admin added!",
    error: "Transaction failed",
  })

  const _removeAdminClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !removePublicKey
    ) {
      return
    }
    await removeAdmin(
      anchorAccountCache,
      wallet?.publicKey,
      new PublicKey(removePublicKey)
    )
    setRemovePublicKey("")
  }, [!anchorAccountCache.isEnabled, wallet?.publicKey, removePublicKey])

  const removeAdminClickHandler = useTxCallback(_removeAdminClickHandler, {
    info: "Removing admin...",
    success: "Admin removed!",
    error: "Transaction failed",
  })

  return (
    <Center w="full" flexDirection="column" textAlign="center">
      <Container mb="8">
        <Heading w="full">Manage Whitelist</Heading>
        <Container mt="8" w="64" textAlign="left">
          <Text fontWeight="700" fontSize="lg" mb="2">
            Admins are able to:
          </Text>
          <ul>
            <li>Add and remove other admins</li>
            <li>Create Collections</li>
            <li>Close Collections</li>
            <li>Create Pricing Models</li>
            <li>Add NFTs to Collections</li>
            <li>Withdraw NFTs from Collections</li>
            <li>Withdraw liquidity</li>
          </ul>
        </Container>
      </Container>
      <Container mb="8">
        <Text fontWeight="700" fontSize="lg" mb="2">
          Admin Whitelist
        </Text>
        {market &&
          _.map(market.data.whitelist, (publicKeyStr) => (
            <Text>{publicKeyStr}</Text>
          ))}
      </Container>
      <Flex mb="8" w="96">
        <Input
          placeholder="Address"
          w="72"
          mr="4"
          value={addPublicKey}
          onChange={handleAddChange}
        />
        <Button
          colorScheme="purple"
          disabled={buttonDisabled}
          onClick={addAdminClickHandler}
        >
          Add Admin
        </Button>
      </Flex>
      <Flex mb="8" w="96">
        <Input
          placeholder="Address"
          w="72"
          mr="4"
          value={removePublicKey}
          onChange={handleRemoveChange}
        />
        <Button
          colorScheme="purple"
          disabled={buttonDisabled}
          onClick={removeAdminClickHandler}
        >
          Remove Admin
        </Button>
      </Flex>
    </Center>
  )
}

export default WhitelistPage
