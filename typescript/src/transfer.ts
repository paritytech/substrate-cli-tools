#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { constructLabel, unfoldId } from "./utils/accounts";
import { getWsProvider } from "./utils/connection";
import { getSigner, sendAndReturnCollated } from "./utils/signer";
import TokenUnit from "./utils/token";

import { CUSTOM_TYPES } from "./utils/types";

async function main() {
    const args = process.argv.slice(2);
    const seed = args[0];
    const amount = args[1];
    const target = args[2];

    const from = constructLabel(seed);
    const to = constructLabel(target);

    const api = await ApiPromise.create({
        provider: getWsProvider(),
        types: CUSTOM_TYPES,
    });

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });
    const signer = getSigner(keyring, seed);

    const value: Balance = token.parseBalance(amount);
    console.log(`Transferring ${token.display(value)} from ${from} to ${to}`);

    await sendAndReturnCollated(signer,
        api.tx.balances.transfer(
            unfoldId(keyring, target),
            value));
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
