#!/usr/bin/env node

import { ApiPromise } from "@polkadot/api";
import { getWsProvider } from "./utils/common";
import { callContract, instantiate, putCode } from "./utils/contracts";

async function main() {
    const api = await ApiPromise.create({ provider: getWsProvider() });
    console.log("Hi");
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
