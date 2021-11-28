export type VibeMarket = {
  version: "0.0.0"
  name: "vibe_market"
  instructions: [
    {
      name: "initGlobalState"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "globalState"
          isMut: true
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "nonce"
          type: "u8"
        }
      ]
    },
    {
      name: "initMarket"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "globalState"
          isMut: true
          isSigner: false
        },
        {
          name: "market"
          isMut: true
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "nonce"
          type: "u8"
        },
        {
          name: "whitelist"
          type: {
            vec: "publicKey"
          }
        },
        {
          name: "title"
          type: "string"
        }
      ]
    },
    {
      name: "addAdmin"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "market"
          isMut: true
          isSigner: false
        },
        {
          name: "addAdmin"
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: "removeAdmin"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "market"
          isMut: true
          isSigner: false
        },
        {
          name: "removeAdmin"
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: "initCollection"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "market"
          isMut: true
          isSigner: false
        },
        {
          name: "collection"
          isMut: true
          isSigner: false
        },
        {
          name: "listHead"
          isMut: true
          isSigner: false
        },
        {
          name: "listTail"
          isMut: true
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "collectionNonce"
          type: "u8"
        },
        {
          name: "listHeadNonce"
          type: "u8"
        },
        {
          name: "listTailNonce"
          type: "u8"
        },
        {
          name: "title"
          type: "string"
        }
      ]
    },
    {
      name: "initPriceModel"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "market"
          isMut: true
          isSigner: false
        },
        {
          name: "priceModel"
          isMut: true
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "nonce"
          type: "u8"
        },
        {
          name: "salePrices"
          type: {
            vec: {
              defined: "SalePrice"
            }
          }
        }
      ]
    },
    {
      name: "addNft"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "market"
          isMut: false
          isSigner: false
        },
        {
          name: "collection"
          isMut: false
          isSigner: false
        },
        {
          name: "listHead"
          isMut: true
          isSigner: false
        },
        {
          name: "nextListItem"
          isMut: true
          isSigner: false
        },
        {
          name: "newItem"
          isMut: true
          isSigner: true
        },
        {
          name: "priceModel"
          isMut: false
          isSigner: false
        },
        {
          name: "adminNftAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "adminNftMint"
          isMut: false
          isSigner: false
        },
        {
          name: "programNftAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "associatedTokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "rent"
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: "withdrawNft"
      accounts: [
        {
          name: "admin"
          isMut: true
          isSigner: true
        },
        {
          name: "rentRefund"
          isMut: false
          isSigner: true
        },
        {
          name: "priceModel"
          isMut: false
          isSigner: false
        },
        {
          name: "market"
          isMut: false
          isSigner: false
        },
        {
          name: "collection"
          isMut: false
          isSigner: false
        },
        {
          name: "withdrawListItem"
          isMut: true
          isSigner: false
        },
        {
          name: "programNftAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "programNftMint"
          isMut: false
          isSigner: false
        },
        {
          name: "adminNftAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "prevListItem"
          isMut: true
          isSigner: false
        },
        {
          name: "nextListItem"
          isMut: true
          isSigner: false
        },
        {
          name: "associatedTokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "rent"
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: "purchaseNft"
      accounts: [
        {
          name: "owner"
          isMut: true
          isSigner: true
        },
        {
          name: "rentRefund"
          isMut: false
          isSigner: true
        },
        {
          name: "priceModel"
          isMut: false
          isSigner: false
        },
        {
          name: "market"
          isMut: false
          isSigner: false
        },
        {
          name: "collection"
          isMut: false
          isSigner: false
        },
        {
          name: "purchaseListItem"
          isMut: true
          isSigner: false
        },
        {
          name: "debitMint"
          isMut: true
          isSigner: false
        },
        {
          name: "debitAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "programCreditAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "programNftAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "programNftMint"
          isMut: false
          isSigner: false
        },
        {
          name: "ownerNftAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "prevListItem"
          isMut: true
          isSigner: false
        },
        {
          name: "nextListItem"
          isMut: true
          isSigner: false
        },
        {
          name: "associatedTokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "rent"
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: "withdrawLiquidity"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "globalState"
          isMut: false
          isSigner: false
        },
        {
          name: "market"
          isMut: false
          isSigner: false
        },
        {
          name: "withdrawMint"
          isMut: false
          isSigner: false
        },
        {
          name: "programDebitAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "adminCreditAccount"
          isMut: true
          isSigner: false
        },
        {
          name: "associatedTokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "rent"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "amount"
          type: "u64"
        }
      ]
    },
    {
      name: "closeCollection"
      accounts: [
        {
          name: "admin"
          isMut: false
          isSigner: true
        },
        {
          name: "market"
          isMut: false
          isSigner: false
        },
        {
          name: "rentRefund"
          isMut: false
          isSigner: true
        },
        {
          name: "collection"
          isMut: true
          isSigner: false
        },
        {
          name: "listHead"
          isMut: true
          isSigner: false
        },
        {
          name: "listTail"
          isMut: true
          isSigner: false
        }
      ]
      args: []
    }
  ]
  accounts: [
    {
      name: "globalState"
      type: {
        kind: "struct"
        fields: [
          {
            name: "nonce"
            type: "u8"
          },
          {
            name: "numMarkets"
            type: "u32"
          }
        ]
      }
    },
    {
      name: "market"
      type: {
        kind: "struct"
        fields: [
          {
            name: "nonce"
            type: "u8"
          },
          {
            name: "index"
            type: "u32"
          },
          {
            name: "whitelist"
            type: {
              vec: "publicKey"
            }
          },
          {
            name: "numCollections"
            type: "u32"
          },
          {
            name: "numPriceModels"
            type: "u32"
          },
          {
            name: "title"
            type: "string"
          }
        ]
      }
    },
    {
      name: "collection"
      type: {
        kind: "struct"
        fields: [
          {
            name: "nonce"
            type: "u8"
          },
          {
            name: "index"
            type: "u32"
          },
          {
            name: "listHead"
            type: "publicKey"
          },
          {
            name: "listTail"
            type: "publicKey"
          },
          {
            name: "title"
            type: "string"
          }
        ]
      }
    },
    {
      name: "nftBucket"
      type: {
        kind: "struct"
        fields: [
          {
            name: "nonce"
            type: "u8"
          },
          {
            name: "nftMint"
            type: "publicKey"
          },
          {
            name: "priceModel"
            type: "publicKey"
          },
          {
            name: "prevListItem"
            type: "publicKey"
          },
          {
            name: "nextListItem"
            type: "publicKey"
          },
          {
            name: "payer"
            type: "publicKey"
          }
        ]
      }
    },
    {
      name: "priceModel"
      type: {
        kind: "struct"
        fields: [
          {
            name: "nonce"
            type: "u8"
          },
          {
            name: "index"
            type: "u32"
          },
          {
            name: "market"
            type: "publicKey"
          },
          {
            name: "salePrices"
            type: {
              vec: {
                defined: "SalePrice"
              }
            }
          }
        ]
      }
    }
  ]
  types: [
    {
      name: "SalePrice"
      type: {
        kind: "struct"
        fields: [
          {
            name: "mint"
            type: "publicKey"
          },
          {
            name: "amount"
            type: "u64"
          }
        ]
      }
    }
  ]
  errors: [
    {
      code: 300
      name: "Unauthorized"
      msg: "Instruction invoked without a valid admin."
    },
    {
      code: 301
      name: "CannotRemoveSelf"
      msg: "Signing account cannot remove itself."
    },
    {
      code: 302
      name: "InvalidPurchaseMint"
      msg: "Cannot purchase from selected collection with specified Mint."
    },
    {
      code: 303
      name: "Overflow"
      msg: "Overflow when applying an arithmetic operation."
    },
    {
      code: 304
      name: "AdminNotFound"
      msg: "Admin address was not found in market whitelist."
    },
    {
      code: 305
      name: "AdminOutOfBounds"
      msg: "Admin whitelist exceeded max length of 16."
    },
    {
      code: 306
      name: "CollectionNonEmpty"
      msg: "Collections cannot be closed until all NFTs are removed."
    }
  ]
}

export const IDL: VibeMarket = {
  version: "0.0.0",
  name: "vibe_market",
  instructions: [
    {
      name: "initGlobalState",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "globalState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "nonce",
          type: "u8",
        },
      ],
    },
    {
      name: "initMarket",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "globalState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "market",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "nonce",
          type: "u8",
        },
        {
          name: "whitelist",
          type: {
            vec: "publicKey",
          },
        },
        {
          name: "title",
          type: "string",
        },
      ],
    },
    {
      name: "addAdmin",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "market",
          isMut: true,
          isSigner: false,
        },
        {
          name: "addAdmin",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "removeAdmin",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "market",
          isMut: true,
          isSigner: false,
        },
        {
          name: "removeAdmin",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initCollection",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "market",
          isMut: true,
          isSigner: false,
        },
        {
          name: "collection",
          isMut: true,
          isSigner: false,
        },
        {
          name: "listHead",
          isMut: true,
          isSigner: false,
        },
        {
          name: "listTail",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "collectionNonce",
          type: "u8",
        },
        {
          name: "listHeadNonce",
          type: "u8",
        },
        {
          name: "listTailNonce",
          type: "u8",
        },
        {
          name: "title",
          type: "string",
        },
      ],
    },
    {
      name: "initPriceModel",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "market",
          isMut: true,
          isSigner: false,
        },
        {
          name: "priceModel",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "nonce",
          type: "u8",
        },
        {
          name: "salePrices",
          type: {
            vec: {
              defined: "SalePrice",
            },
          },
        },
      ],
    },
    {
      name: "addNft",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "market",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collection",
          isMut: false,
          isSigner: false,
        },
        {
          name: "listHead",
          isMut: true,
          isSigner: false,
        },
        {
          name: "nextListItem",
          isMut: true,
          isSigner: false,
        },
        {
          name: "newItem",
          isMut: true,
          isSigner: true,
        },
        {
          name: "priceModel",
          isMut: false,
          isSigner: false,
        },
        {
          name: "adminNftAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "adminNftMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "programNftAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "withdrawNft",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "rentRefund",
          isMut: false,
          isSigner: true,
        },
        {
          name: "priceModel",
          isMut: false,
          isSigner: false,
        },
        {
          name: "market",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collection",
          isMut: false,
          isSigner: false,
        },
        {
          name: "withdrawListItem",
          isMut: true,
          isSigner: false,
        },
        {
          name: "programNftAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "programNftMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "adminNftAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "prevListItem",
          isMut: true,
          isSigner: false,
        },
        {
          name: "nextListItem",
          isMut: true,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "purchaseNft",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "rentRefund",
          isMut: false,
          isSigner: true,
        },
        {
          name: "priceModel",
          isMut: false,
          isSigner: false,
        },
        {
          name: "market",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collection",
          isMut: false,
          isSigner: false,
        },
        {
          name: "purchaseListItem",
          isMut: true,
          isSigner: false,
        },
        {
          name: "debitMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "debitAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "programCreditAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "programNftAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "programNftMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "ownerNftAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "prevListItem",
          isMut: true,
          isSigner: false,
        },
        {
          name: "nextListItem",
          isMut: true,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "withdrawLiquidity",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "globalState",
          isMut: false,
          isSigner: false,
        },
        {
          name: "market",
          isMut: false,
          isSigner: false,
        },
        {
          name: "withdrawMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "programDebitAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "adminCreditAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "closeCollection",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "market",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rentRefund",
          isMut: false,
          isSigner: true,
        },
        {
          name: "collection",
          isMut: true,
          isSigner: false,
        },
        {
          name: "listHead",
          isMut: true,
          isSigner: false,
        },
        {
          name: "listTail",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "globalState",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            type: "u8",
          },
          {
            name: "numMarkets",
            type: "u32",
          },
        ],
      },
    },
    {
      name: "market",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            type: "u8",
          },
          {
            name: "index",
            type: "u32",
          },
          {
            name: "whitelist",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "numCollections",
            type: "u32",
          },
          {
            name: "numPriceModels",
            type: "u32",
          },
          {
            name: "title",
            type: "string",
          },
        ],
      },
    },
    {
      name: "collection",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            type: "u8",
          },
          {
            name: "index",
            type: "u32",
          },
          {
            name: "listHead",
            type: "publicKey",
          },
          {
            name: "listTail",
            type: "publicKey",
          },
          {
            name: "title",
            type: "string",
          },
        ],
      },
    },
    {
      name: "nftBucket",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            type: "u8",
          },
          {
            name: "nftMint",
            type: "publicKey",
          },
          {
            name: "priceModel",
            type: "publicKey",
          },
          {
            name: "prevListItem",
            type: "publicKey",
          },
          {
            name: "nextListItem",
            type: "publicKey",
          },
          {
            name: "payer",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "priceModel",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nonce",
            type: "u8",
          },
          {
            name: "index",
            type: "u32",
          },
          {
            name: "market",
            type: "publicKey",
          },
          {
            name: "salePrices",
            type: {
              vec: {
                defined: "SalePrice",
              },
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "SalePrice",
      type: {
        kind: "struct",
        fields: [
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "amount",
            type: "u64",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 300,
      name: "Unauthorized",
      msg: "Instruction invoked without a valid admin.",
    },
    {
      code: 301,
      name: "CannotRemoveSelf",
      msg: "Signing account cannot remove itself.",
    },
    {
      code: 302,
      name: "InvalidPurchaseMint",
      msg: "Cannot purchase from selected collection with specified Mint.",
    },
    {
      code: 303,
      name: "Overflow",
      msg: "Overflow when applying an arithmetic operation.",
    },
    {
      code: 304,
      name: "AdminNotFound",
      msg: "Admin address was not found in market whitelist.",
    },
    {
      code: 305,
      name: "AdminOutOfBounds",
      msg: "Admin whitelist exceeded max length of 16.",
    },
    {
      code: 306,
      name: "CollectionNonEmpty",
      msg: "Collections cannot be closed until all NFTs are removed.",
    },
  ],
}
