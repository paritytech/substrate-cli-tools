#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { constructLabel, unfoldId } from "./utils/accounts";
import { getWsProvider } from "./utils/connection";
import { getSigner, sendAndReturnCollated } from "./utils/signer";
import TokenUnit from "./utils/token";

import { TYPES } from "./utils/types";

import yargs = require("yargs");

async function main() {
    const args = yargs
        .option("seed", { alias: "s", global: true, type: "string", default: "//Alice" })
        .option("target", { alias: "t", global: true, type: "string" })
        .option("amount", { alias: "a", global: true, type: "string" })
        .argv;

    const from = constructLabel(args.seed);
    const to = constructLabel(args.target);

    const api = await ApiPromise.create(Object.assign(
        { provider: getWsProvider() },
        TYPES
    ));

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });
    const signer = getSigner(keyring, args.seed);

    const value: Balance = token.parseBalance(args.amount);
    console.log(`Transferring ${token.display(value)} from ${from} to ${to}`);

    await sendAndReturnCollated(signer,
        api.tx.balances.transfer(
            unfoldId(keyring, args.target),
            value));
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
