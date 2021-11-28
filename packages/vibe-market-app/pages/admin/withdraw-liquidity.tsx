import _ from "lodash"
import {
  Heading,
  VStack,
  Radio,
  RadioGroup,
  Text,
  FormControl,
  FormLabel,
  Button,
  Image,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react"
import { Center } from "@chakra-ui/layout"
import { getClusterConstants } from "../../constants"
import { useTokenAccounts } from "../../hooks/useTokenAccounts"
import { useState, useCallback } from "react"
import { PublicKey } from "@solana/web3.js"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { fromRawAmount } from "../../solana/tokenConversion"
import useTxCallback from "../../hooks/useTxCallback"
import { useTokenRegistry } from "../../hooks/useTokenRegistry"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import withdrawLiquidity from "../../solana/scripts/withdrawLiquidity"

const WithdrawLiquidityPage = () => {
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()
  const tokenRegistry = useTokenRegistry()

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")

  const [withdrawAmount, setWithdrawAmount] = useState<number | undefined>()
  const handleAmountChange = (valueAsString: string, valueAsNumber: number) => {
    setWithdrawAmount(valueAsNumber)
  }

  const tokenAccounts = useTokenAccounts(ADDRESS_VIBE_MARKET)

  const [selectedTokenAccount, setSelectedTokenAccount] = useState<
    string | undefined
  >()

  const _withdrawLiquidityClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !selectedTokenAccount ||
      !withdrawAmount
    ) {
      return
    }
    await withdrawLiquidity(
      anchorAccountCache,
      wallet?.publicKey,
      new PublicKey(selectedTokenAccount),
      withdrawAmount
    )
  }, [!anchorAccountCache.isEnabled, wallet?.publicKey, selectedTokenAccount])

  const withdrawLiquidityClickHandler = useTxCallback(
    _withdrawLiquidityClickHandler,
    {
      info: "Withdrawing liquidity...",
      success: "Liquidity withdrawn!",
      error: "Transaction failed",
    }
  )

  const buttonDisabled =
    !wallet?.publicKey || !selectedTokenAccount || !withdrawAmount

  return (
    <Center flexDirection="column" mb="16" w="full">
      <Heading mb="8">Withdraw Liquidity</Heading>
      <VStack mb="16" w="96" spacing="8">
        <VStack>
          <FormLabel>Set Withdraw Amount</FormLabel>
          <NumberInput
            value={withdrawAmount}
            defaultValue={0}
            min={0}
            keepWithinRange={true}
            onChange={handleAmountChange}
            m="0"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </VStack>
        <Center>
          <FormControl id="radio-withdraw-mint">
            <FormLabel>Select Withdraw Mint</FormLabel>
            <RadioGroup
              type="radio-withdraw-mint"
              onChange={setSelectedTokenAccount.bind(this)}
              value={selectedTokenAccount}
            >
              <VStack spacing="6">
                {tokenRegistry &&
                  _.map(tokenAccounts, (tokenAccount) => {
                    return (
                      <Radio
                        key={tokenAccount.publicKey.toString()}
                        value={tokenAccount.publicKey.toString()}
                        justifyContent="flex-start"
                        alignSelf="flex-start"
                      >
                        <HStack justifyContent="center" alignItems="center">
                          {tokenRegistry[tokenAccount.data.mint].logoURI && (
                            <Image
                              alt="token image"
                              w="4"
                              h="4"
                              borderRadius="20"
                              src={
                                tokenRegistry[tokenAccount.data.mint].logoURI
                              }
                            />
                          )}
                          <Text>{`${
                            tokenRegistry[tokenAccount.data.mint].symbol
                          } ${fromRawAmount(
                            tokenRegistry[tokenAccount.data.mint].decimals,
                            tokenAccount.data.amount
                          )}`}</Text>
                        </HStack>
                      </Radio>
                    )
                  })}
              </VStack>
            </RadioGroup>
          </FormControl>
        </Center>
        <Button
          colorScheme="purple"
          mt="4"
          px="8"
          w="40"
          onClick={withdrawLiquidityClickHandler}
          disabled={buttonDisabled}
        >
          Withdraw Liquidity
        </Button>
      </VStack>
    </Center>
  )
}

export default WithdrawLiquidityPage
