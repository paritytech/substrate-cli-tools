#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";

import { constructLabel } from "./utils/accounts";
import { getWsProvider } from "./utils/connection";
import { getSigner, sendAndReturnCollated } from "./utils/signer";
import TokenUnit from "./utils/token";

import fs from "fs";
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
        .command("create", "Upload a contract from a file",
            (args: Argv) => {
                return args
                    .option("code", { alias: "c", type: "string" })
                    .option("file", { alias: "f", type: "string" })
                    .option("gas", { alias: "g", type: "number" })
                    .option("price", { alias: "p", type: "string" })
                    .option("endowment", { alias: "e", type: "string" });
            }, async (args) => {
                const gas = args.gas as number;
                const price = token.parseBalance(args.price);
                const endowment = token.parseBalance(args.endowment);
                console.log(`Creating contract with `
                + `gas price of ${token.display(price)}, `
                + `${token.display(endowment)} as an endowment and `
                + `${gas} of gas`);

                let code = args.code;
                if (!code) {
                    if (!args.file) {
                        console.log("Provide either code with -c option or path to file with -f");
                        process.exit(-1);
                    }
                    console.log(`Reading code from file ${args.file}`);
                    code = extractCode(args.file);
                } else {
                    if (args.file) {
                        console.log("Code is provided with -c option, ignoring provided file");
                    }
                }
                if (!code.startsWith("0x")) {
                    code = `0x${code}`;
                }

                console.log(`Code to deploy is ${code}`);

                const signer = getSigner(keyring, args.seed as string);
                const result = await sendAndReturnCollated(signer, api.tx.evm.create(code, endowment, gas, price, null));
                const created = result.findRecord("evm", "Created");

                if (!created) {
                    const failure = result.findRecord("system", "ExtrinsicFailed");
                    console.error("ExtrinsicFailed", JSON.stringify(failure, null, 2));
                }

                const address = created.event.data[0];
                console.log(`Contract instantiated with address ${address}`);
                process.exit(0);
            })
        .command("call", "Call some method of the contract",
            (args: Argv) => {
                return args
                    .option("address", {alias: "a", type: "string"})
                    .option("gas", {alias: "g", type: "number"})
                    .option("price", {alias: "p", type: "string"})
                    .option("endowment", {alias: "e", type: "string"})
                    .option("data", { alias: "d", type: "string" });
            }, async (args: Arguments) => {
                const gas = args.gas as number;
                const price = token.parseBalance(args.price as string);
                const endowment = token.parseBalance(args.endowment as string);
                console.log(`Calling contract`);
                console.log(`\taddress: ${args.address}`);
                console.log(`\tdata: ${args.data}`);
                console.log("\tendowment:", token.display(endowment));
                console.log("\tgas price:", token.display(price));
                console.log("\tgas limit:", gas);

                const signer = getSigner(keyring, args.seed as string);
                const tx = api.tx.evm.call(args.address as string, args.data as string, endowment, gas, price, null);
                await sendAndReturnCollated(signer, tx);

                process.exit(0);
            })
        .command("deposit", "Deposit funds to EVM balance of the account",
            (args: Argv) => {
                return args.option("amount", { alias: "a", type: "string" });
            }, async (args) => {
                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Depositing ${token.display(value)} to ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args.seed as string);
                await sendAndReturnCollated(signer, api.tx.evm.depositBalance(value));

                process.exit(0);
            })
        .command("withdraw", "Withdraw funds from EVM balance of the account",
            (args: Argv) => {
                return args.option("amount", { alias: "a", type: "string" });
            }, async (args) => {
                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Withdrawing ${token.display(value)} from ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args.seed as string);
                await sendAndReturnCollated(signer, api.tx.evm.withdrawBalance(value));

                process.exit(0);
            })
        .demandCommand()
        .argv;
}

function extractCode(file: string): string {
    const content = fs.readFileSync(file, "utf8");
    const json = JSON.parse(content);

    if (json) {
        return json.object;
    } else {
        return content.toString();
    }
}

main();
