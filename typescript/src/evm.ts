#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { keccakAsHex } from "@polkadot/util-crypto";

import { constructLabel } from "./utils/accounts";
import { getWsProvider } from "./utils/connection";
import { getSigner, sendAndReturnCollated } from "./utils/signer";
import TokenUnit from "./utils/token";

import fs from "fs";
import yargs = require("yargs");
import { Arguments, Argv } from "yargs";

import { TYPES } from "./utils/types";

async function main() {
    yargs
        .boolean("q") // pass -q for quiet mode
        .option("seed", { alias: "s", global: true, default: "//Alice" })
        .command("create", "Upload a contract from a file",
            (args: Argv) => {
                return args
                    .option("code", { alias: "c", type: "string" })
                    .option("file", { alias: "f", type: "string" })
                    .option("gas", { alias: "g", type: "number" })
                    .option("price", { alias: "p", type: "string" })
                    .option("endowment", { alias: "e", type: "string" });
            }, async (args: Arguments) => {
                const quiet = args.q as boolean;
                const verbose_log = noisy(quiet);

                const [api, token, keyring] = await initialize();

                const gas = args.gas as number;
                const price = token.parseBalance(args.price as string);
                const endowment = token.parseBalance(args.endowment as string);
                verbose_log(`Creating contract with `
                + `gas price of ${token.display(price)}, `
                + `${token.display(endowment)} as an endowment and `
                + `${gas} of gas`);

                let code = args.code as string;
                if (!code) {
                    if (!args.file) {
                        console.error("Provide either code with -c option or path to file with -f");
                        process.exit(-1);
                    }
                    verbose_log(`Reading code from file ${args.file}`);
                    code = extractCode(args.file as string);
                } else {
                    if (args.file) {
                        console.warn("Code is provided with -c option, ignoring provided file");
                    }
                }
                if (!code.startsWith("0x")) {
                    code = `0x${code}`;
                }

                verbose_log(`Code to deploy is ${code.substr(0, 8)}...${code.substr(code.length - 8)}`);

                const signer = getSigner(keyring, args.seed as string, quiet);
                const tx = api.tx.evm.create(code, endowment, gas, price, null);
                const result = await sendAndReturnCollated(signer, tx, quiet);
                const created = result.findRecord("evm", "Created");

                if (!created) {
                    const failure = result.findRecord("system", "ExtrinsicFailed");
                    console.error("ExtrinsicFailed", JSON.stringify(failure, null, 2));
                    process.exit(-1);
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
                const quiet = args.q as boolean;
                const verbose_log = noisy(quiet);

                const [api, token, keyring] = await initialize();

                const gas = args.gas as number;
                const price = token.parseBalance(args.price as string);
                const endowment = token.parseBalance(args.endowment as string);
                verbose_log(`Calling contract`);
                verbose_log(`\taddress: ${args.address}`);
                verbose_log(`\tdata: ${args.data}`);
                verbose_log(`\tendowment: ${token.display(endowment)}`);
                verbose_log(`\tgas price: ${token.display(price)}`);
                verbose_log(`\tgas limit: ${gas}`);

                const signer = getSigner(keyring, args.seed as string, quiet);
                const tx = api.tx.evm.call(args.address as string, args.data as string, endowment, gas, price, null);
                await sendAndReturnCollated(signer, tx, quiet);
                console.log("Call performed");

                process.exit(0);
            })
        .command("info", "Grab some information about instantiated contract",
            (args: Argv) => {
                return args
                    .option("address", { alias: "a", type: "string" })
                    .option("index", { alias: "i", type: "string" });
            }, async (args: Arguments) => {
                const [api, token, keyring] = await initialize();

                if (!args.q as boolean) {
                    console.log("State:")
                }

                const idx = args.index as string;
                const storage = await api.query.evm.accountStorages(args.address as string, idx);
                console.log(`[${idx}]`, JSON.stringify(storage, null, 2));

                process.exit(0);
            })
        .command("deposit", "Deposit funds to EVM balance of the account",
            (args: Argv) => {
                return args.option("amount", { alias: "a", type: "string" });
            }, async (args: Arguments) => {
                const quiet = args.q as boolean;
                const [api, token, keyring] = await initialize();

                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Depositing ${token.display(value)} to ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args.seed as string, quiet);
                await sendAndReturnCollated(signer, api.tx.evm.depositBalance(value), quiet);

                process.exit(0);
            })
        .command("withdraw", "Withdraw funds from EVM balance of the account",
            (args: Argv) => {
                return args.option("amount", { alias: "a", type: "string" });
            }, async (args: Arguments) => {
                const quiet = args.q as boolean;
                const [api, token, keyring] = await initialize();

                const value: Balance = token.parseBalance(args.amount as string);
                console.log(`Withdrawing ${token.display(value)} from ${constructLabel(args.seed as string)}`);

                const signer = getSigner(keyring, args.seed as string, quiet);
                await sendAndReturnCollated(signer, api.tx.evm.withdrawBalance(value), quiet);

                process.exit(0);
            })
        .command("selector", "Get an encoded function signature for some method",
            (args: Argv) => args, (args) => {
                const raw = args._.slice(1);
                const arg = raw[raw.length - 1];
                if (arg === undefined) {
                    console.error("Provide a function signature to encode");
                    process.exit(-1);
                }

                const selector = keccakAsHex(arg).substr(0, 10);
                console.log(selector);
                process.exit(0);
            })
        .demandCommand()
        .argv;
}

async function initialize(): Promise<[ApiPromise, TokenUnit, Keyring]> {
    const api = await ApiPromise.create(Object.assign(
        { provider: getWsProvider() },
        TYPES
    ));

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    return [api, token, keyring];
}

function extractCode(file: string): string {
    const content = fs.readFileSync(file, "utf8");

    try {
        const json = JSON.parse(content);
        return json.object;
    } catch (e) {
        return content.toString();
    }
}

function preview(text: string, n: number): string {
    return text.substr(0, n) +
           "..." +
           text.substr(text.length - n);
}

function noisy(quiet: boolean) {
    if (quiet) {
        return (msg) => {};
    } else {
        return (msg) => console.log(msg);
    }
}

main();
