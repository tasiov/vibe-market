export const assert = (val: any, msg: string) => {
  if (!val) throw new Error(msg || "Assertion failed")
}

export const assertEqual = (l: any, r: any, msg: string) => {
  if (l != r) throw new Error(msg || "Assertion failed: " + l + " != " + r)
}
