#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { computeEvmId, constructLabel, unfoldId } from "./utils/accounts";
import { getWsProvider } from "./utils/connection";
import { getSigner, sendAndReturnFinalized } from "./utils/signer";
import TokenUnit from "./utils/token";

import yargs = require("yargs");
import { Argv } from "yargs";
import { CUSTOM_TYPES } from "./utils/types";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const api = await ApiPromise.create({
        provider: getWsProvider(),
        types: CUSTOM_TYPES,
    });

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    yargs
        .option("seed", { alias: "s", global: true, default: "//Alice" })
        .option("amount", { alias: "a", type: "string" })
        .command("transfer", "Transfer funds to another account",
            (args: Argv) => {
                return args.option("target", { alias: "t", type: "string" });
            }, async (args) => {
                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Transferring ${token.display(value)} from ${
                    constructLabel(args.seed as string)
                } to ${constructLabel(args.target)}`);

                const signer = getSigner(keyring, args);
                const target = unfoldId(keyring, args.target);

                await sendAndReturnFinalized(signer,
                    api.tx.balances.transfer(target, value));

                process.exit(0);
            })
        .command("deposit-evm", "Deposit funds to EVM balance of the account",
            (args: Argv) => args, async (args) => {
                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Depositing ${token.display(value)} to ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args);

                await sendAndReturnFinalized(signer,
                    api.tx.evm.depositBalance(value));

                process.exit(0);
            })
        .command("withdraw-evm", "Withdraw funds from EVM balance of the account",
            (args: Argv) => args, async (args) => {
                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Withdrawing ${token.display(value)} from ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args);

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
