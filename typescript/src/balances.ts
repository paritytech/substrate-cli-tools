#!/usr/bin/env node

import { ApiPromise } from "@polkadot/api";
import { getWsProvider } from "./utils/common";

async function main() {
    const accounts = process.argv.slice(2);
    // todo: resolve aliases

    const api = await ApiPromise.create({ provider: getWsProvider() });

    await api.query.balances.freeBalance.multi(accounts, (balances) => {
        accounts.forEach((account, i) => {
            console.log(`${account} account balance is ${balances[i]}`);
        });
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
