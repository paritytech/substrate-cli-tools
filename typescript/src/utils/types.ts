export const CUSTOM_TYPES = {
    Account: {
        nonce: "U256",
        balance: "U256",
    },
    Log: {
        address: "H160",
        topics: "Vec<H256>",
        data: "Vec<u8>",
    },
};
