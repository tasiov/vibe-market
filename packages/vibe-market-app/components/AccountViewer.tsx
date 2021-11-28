import _ from "lodash"
import { ChangeEvent, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { Select, Code, Spinner, Text, Button } from "@chakra-ui/react"
import { Center, Box, VStack } from "@chakra-ui/layout"
import { AccountTypes } from "../models"
import { useAccount } from "../hooks/useAccounts"

export const renderObj = (obj: any, prefix?: string): JSX.Element[] => {
  return _.flatten(
    _.map(obj, (item, key) => {
      if (_.isObject(item)) return renderObj(item, key)
      return (
        <Code
          w="full"
          textAlign="left"
          mb="2"
          key={`item-${prefix ? prefix + "-" + key : key}`}
          backgroundColor="transparent"
        >
          {`${key}: ${item}`}
        </Code>
      )
    })
  )
}

export const AccountViewer = ({
  accountType,
  accountAddresses,
  closeAccountHandler,
}: {
  accountType: AccountTypes
  accountAddresses: PublicKey[] | undefined
  closeAccountHandler?: () => Promise<void>
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>()
  const handleSelectionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccount(event.target.value)
  }

  const [account, accountLoading] = useAccount(
    accountType,
    selectedAccount ? new PublicKey(selectedAccount) : undefined
  )

  console.log("account", account)

  return (
    <VStack w="96" spacing="8">
      <Select
        value={selectedAccount}
        onChange={handleSelectionChange}
        cursor="pointer"
        placeholder="Select Account"
      >
        {_.map(accountAddresses, (accountAddress) => (
          <option
            key={accountAddress.toString()}
            value={accountAddress.toString()}
          >
            {accountAddress.toString()}
          </option>
        ))}
      </Select>
      {account && closeAccountHandler && (
        <Button
          colorScheme="red"
          mt="4"
          px="8"
          w="40"
          onClick={closeAccountHandler}
        >
          Close Account
        </Button>
      )}
      <Box h="96" overflow="auto" w="full">
        {account && (
          <Code
            w="full"
            textAlign="left"
            mb="2"
            key={`account-data-publicKey`}
            backgroundColor="transparent"
          >{`publicKey: ${account.publicKey.toString()}`}</Code>
        )}
        {account && renderObj(account.data)}
        {!account && accountLoading && (
          <Center>
            <Spinner />
          </Center>
        )}
        {!account && selectedAccount && !accountLoading && (
          <Text textAlign="center">Account not found</Text>
        )}
      </Box>
    </VStack>
  )
}

export default AccountViewer
