import BN from "bn.js"

const decimalsExponent = (decimals: number) => new BN(10).pow(new BN(decimals))

export const toRawAmount = (decimals: number, amount: number) => {
  const bnAmount = new BN(amount)
  return bnAmount.mul(decimalsExponent(decimals))
}

export const fromRawAmount = (decimals: number, amount: number) => {
  const bnAmount = new BN(amount)
  return bnAmount.div(decimalsExponent(decimals)).toNumber()
}
