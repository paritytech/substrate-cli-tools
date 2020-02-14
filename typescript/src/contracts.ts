#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { H256, Option } from "@polkadot/types";
import { ContractInfo } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { getWsProvider } from "./utils/connection";
import { instantiate, upload } from "./utils/contracts";
import {getSigner, sendAndReturnFinalized} from "./utils/signer";
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
        .command("deploy", "Upload a contract from a file",
            (args: Argv) => {
                return args.option("file", { alias: "f", type: "string" });
            }, async (args) => {
                const gas = args.gas as number;
                console.log("Deploying code");
                console.log("\tsource:", args.file);
                console.log("\tgas:", gas);

                const signer = getSigner(keyring, args.seed as string);
                const hash = await upload(api, signer, args.file, gas);
                console.log(`Code deployed with hash ${hash}`);

                process.exit(0);
            })
        .command("instantiate", "Instantiate a deployed contract",
            (args: Argv) => {
                return args
                    .option("hash", { alias: "h", type: "string" })
                    .option("endowment", { alias: "e", type: "string" })
                    .option("data", { alias: "d", type: "string" });
            }, async (args) => {
                const codeHash = new H256(api.registry, args.hash);
                const gas = args.gas as number;
                const endowment = token.parseBalance(args.endowment);

                console.log(`Instantiating contract`);
                console.log(`\tcode hash: ${codeHash}`);
                console.log("\tendowment:", token.display(endowment));
                console.log("\tgas:", gas);

                const signer = getSigner(keyring, args.seed as string);
                const address = await instantiate(api, signer, codeHash, args.data, endowment, gas);
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
                const gas = args.gas as number;
                const endowment = token.parseBalance(args.endowment as string);

                console.log(`Calling contract`);
                console.log(`\taddress: ${args.address}`);
                console.log(`\tdata: ${args.data}`);
                console.log("\tendowment:", token.display(endowment));
                console.log("\tgas:", gas);

                const signer = getSigner(keyring, args.seed as string);
                const tx = api.tx.contracts.call(args.address, endowment, gas, args.data);
                await sendAndReturnFinalized(signer, tx);
                console.log("Call performed");

                process.exit(0);
            })
        .command("info", "Grab some information about instantiated contract",
            (args: Argv) => {
                return args.option("address", { alias: "a", type: "string" });
            }, async (args) => {
                console.log(`Reguesting contract's info`);
                console.log(`\taddress: ${args.address}`);
                const info = await api.query.contracts.contractInfoOf(args.address);
                console.log("Info:", JSON.stringify(info, null, 2));

                const trieId = (info as Option<ContractInfo>).unwrap().asAlive.trieId;
                const trieIdWithoutPrefix = trieId.subarray(trieId.byteLength - 32, trieId.byteLength);

                const childStorageKey = u8aToHex(trieId);
                const childInfo = u8aToHex(trieIdWithoutPrefix);

                console.log("Storage:");
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

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
