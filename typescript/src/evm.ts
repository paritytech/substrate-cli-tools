#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { computeEvmId, constructLabel, unfoldId } from "./utils/accounts";
import { getWsProvider } from "./utils/connection";
import { getSigner, sendAndReturnFinalized } from "./utils/signer";
import TokenUnit from "./utils/token";

import yargs = require("yargs");
import { Arguments, Argv } from "yargs";

import { CUSTOM_TYPES } from "./utils/types";

async function main() {
    const api = await ApiPromise.create({
        provider: getWsProvider(),
        types: CUSTOM_TYPES,
    });

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    yargs
        .option("seed", { alias: "s", global: true, default: "//Alice" })
        .option("gas", { alias: "g", type: "number" })
        .command("create", "Upload a contract from a file",
            (args: Argv) => {
                return args.option("file", { alias: "f", type: "string" });
            }, async (args) => {

                process.exit(0);
            })
        .command("deposit", "Deposit funds to EVM balance of the account",
            (args: Argv) => {
                return args.option("amount", { alias: "a", type: "string" });
            }, async (args) => {
                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Depositing ${token.display(value)} to ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args.seed as string);

                await sendAndReturnFinalized(signer,
                    api.tx.evm.depositBalance(value));

                process.exit(0);
            })
        .command("withdraw", "Withdraw funds from EVM balance of the account",
            (args: Argv) => {
                return args.option("amount", { alias: "a", type: "string" });
            }, async (args) => {
                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Withdrawing ${token.display(value)} from ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args.seed as string);

                await sendAndReturnFinalized(signer,
                    api.tx.evm.withdrawBalance(value));

                process.exit(0);
            })
        .demandCommand()
        .argv;
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
