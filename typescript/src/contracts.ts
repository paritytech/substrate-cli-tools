#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Option } from "@polkadot/types";
import { ContractInfo } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { getWsProvider } from "./utils/connection";
import { getSigner, sendAndReturnCollated } from "./utils/signer";
import TokenUnit from "./utils/token";
import { TYPES } from "./utils/types";

import blake = require("blakejs");
import fs from "fs";

import yargs = require("yargs");
import { Arguments, Argv } from "yargs";

async function main() {
    const api = await ApiPromise.create(Object.assign(
        { provider: getWsProvider() },
        TYPES
    ));

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    yargs
        .boolean("q") // pass -q for quiet mode
        .option("seed", { alias: "s", global: true, default: "//Alice" })
        .option("gas", { alias: "g", type: "number" })
        .command("deploy", "Upload a contract from a file",
            (args: Argv) => {
                return args.option("file", { alias: "f", type: "string" });
            }, async (args: Arguments) => {
                const quiet = args.q as boolean;
                const verbose_log = noisy(quiet);

                const gas = args.gas as number;
                verbose_log("Deploying code");
                verbose_log(`\tsource: ${args.file}`);
                verbose_log(`\tgas: ${gas}`)

                const wasm = fs
                    .readFileSync(args.file as string)
                    .toString("hex");
                const tx = api.tx.contracts.putCode(gas, `0x${wasm}`);

                const signer = getSigner(keyring, args.seed as string, quiet);

                const result: any = await sendAndReturnCollated(signer, tx, quiet);
                const record = result.findRecord("contracts", "CodeStored");

                if (!record) {
                    const failure = result.findRecord("system", "ExtrinsicFailed");
                    console.error("ExtrinsicFailed", JSON.stringify(failure, null, 2));
                }

                const hash = record.event.data[0];
                console.log(`Code deployed with hash ${hash}`);

                process.exit(0);
            })
        .command("instantiate", "Instantiate a deployed contract",
            (args: Argv) => {
                return args
                    .option("hash", { alias: "h", type: "string" })
                    .option("endowment", { alias: "e", type: "string" })
                    .option("data", { alias: "d", type: "string" });
            }, async (args: Arguments) => {
                const quiet = args.q as boolean;
                const verbose_log = noisy(quiet);

                const gas = args.gas as number;
                const endowment = token.parseBalance(args.endowment as string);

                verbose_log(`Instantiating contract`);
                verbose_log(`\tcode hash: ${args.hash}`);
                verbose_log(`\tendowment: ${token.display(endowment)}`);
                verbose_log(`\tgas: ${gas}`);

                const signer = getSigner(keyring, args.seed as string, quiet);

                const tx = api.tx.contracts.instantiate(endowment, gas, args.hash as string, args.data as string);

                const result: any = await sendAndReturnCollated(signer, tx, quiet);
                const instantiated = result.findRecord("contracts", "Instantiated");

                if (!instantiated) {
                    const failure = result.findRecord("system", "ExtrinsicFailed");
                    console.error("ExtrinsicFailed", JSON.stringify(failure, null, 2));
                }

                const address = instantiated.event.data[1];
                console.log(`Contract instantiated with address ${address}`);

                process.exit(0);
            })
        .command("call", "Call a method of some contract",
            (args: Argv) => {
                return args
                    .option("address", { alias: "a", type: "string" })
                    .option("endowment", { alias: "e", type: "string" })
                    .option("data", { alias: "d", type: "string" });
            }, async (args: Arguments) => {
                const quiet = args.q as boolean;
                const verbose_log = noisy(quiet);

                const gas = args.gas as number;
                const endowment = token.parseBalance(args.endowment as string);

                verbose_log(`Calling contract`);
                verbose_log(`\taddress: ${args.address}`);
                verbose_log(`\tdata: ${args.data}`);
                verbose_log(`\tendowment: ${token.display(endowment)}`);
                verbose_log(`\tgas:" ${gas}`);

                const signer = getSigner(keyring, args.seed as string, quiet);
                const tx = api.tx.contracts.call(args.address as string, endowment, gas, args.data as string);
                await sendAndReturnCollated(signer, tx, quiet);
                console.log("Call performed");

                process.exit(0);
            })
        .command("info", "Grab some information about instantiated contract",
            (args: Argv) => {
                return args.option("address", { alias: "a", type: "string" });
            }, async (args: Arguments) => {
                const quiet = args.q as boolean;
                const verbose_log = noisy(quiet);

                verbose_log(`Reguesting contract's info`);
                verbose_log(`\taddress: ${args.address}`);
                const info = await api.query.contracts.contractInfoOf(args.address as string);
                verbose_log(`Info: ${JSON.stringify(info, null, 2)}`);

                const trieId = (info as Option<ContractInfo>).unwrap().asAlive.trieId;
                const trieIdWithoutPrefix = trieId.subarray(trieId.byteLength - 32, trieId.byteLength);

                const childStorageKey = u8aToHex(trieId);
                const childInfo = u8aToHex(trieIdWithoutPrefix);

                verbose_log("Storage:");
                const keys = await api.rpc.state.getChildKeys(childStorageKey, childInfo, 1, ROOT_PREFIX);
                // @ts-ignore
                for (const key of keys) {
                    const storage = await api.rpc.state.getChildStorage(childStorageKey, childInfo, 1, key);
                    console.log(`\t${key} -> ${storage}`);
                }

                process.exit(0);
            })
        .demandCommand()
        .argv;
}

const ROOT_PREFIX: Uint8Array = new Uint8Array(0);

function noisy(quiet: boolean) {
    if (quiet) {
        return (msg) => {};
    } else {
        return (msg) => console.log(msg);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
