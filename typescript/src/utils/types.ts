// todo: just import  api/packages/types/src/interfaces/evm/definitions.ts

export const TYPES = {
    types: {
        Account: {
            nonce: "U256",
            balance: "U256",
        },
        Log: {
            address: "H160",
            topics: "Vec<H256>",
            data: "Vec<u8>",
        },
    },
    typesSpec: {
        "node": {},
        "node-template": {
            Address: "AccountId",
            LookupSource: "AccountId",
        }
    }
};
