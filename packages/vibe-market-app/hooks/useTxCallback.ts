import { useCallback, useRef } from "react"
import { useToast, ToastId, UseToastOptions } from "@chakra-ui/react"

const useTxCallback = (
  fn: () => Promise<void> | undefined,
  statusTexts: { info: string; success: string; error: string }
) => {
  const toast = useToast()

  return useCallback(async () => {
    if (!fn) {
      return
    }
    toast({
      status: "info",
      isClosable: true,
      description: statusTexts.info,
    })
    try {
      await fn()
      toast({
        status: "success",
        isClosable: true,
        description: statusTexts.success,
      })
    } catch (err) {
      console.log(err)
      toast({
        status: "error",
        isClosable: true,
        description: statusTexts.error,
      })
    }
  }, [fn])
}

export default useTxCallback
