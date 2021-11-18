import _ from "lodash"
import { Heading, Text, Input, Button } from "@chakra-ui/react"
import { Center, Box, Container, Flex } from "@chakra-ui/layout"
import { useAccount } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"

const ManagerWhitelist = () => {
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const market = useAccount("market", ADDRESS_VIBE_MARKET)
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
            <li>Create Pricing Models</li>
            <li>Add NFTs to Collections</li>
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
        <Input placeholder="Address" w="72" mr="4" />
        <Button colorScheme="purple">Add Admin</Button>
      </Flex>
      <Flex mb="8" w="96">
        <Input placeholder="Address" w="72" mr="4" />
        <Button colorScheme="purple">Remove Admin</Button>
      </Flex>
    </Center>
  )
}

export default ManagerWhitelist
