#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { H256 } from "@polkadot/types";
import { getWsProvider } from "./utils/common";
import { callContract, CREATION_FEE, instantiate, putCode } from "./utils/contracts";

import yargs = require("yargs");
import {Arguments, Argv} from "yargs";

async function main() {
    const api = await ApiPromise.create({ provider: getWsProvider() });
    const keyring = new Keyring({ type: "sr25519" });

    yargs
        .option("seed", { alias: "s", global: true, default: "//Alice" })
        .command("deploy", "Upload a contract from a file",
            (args: Argv) => {
                return args.option("file", { alias: "f", type: "string" });
            }, async (args) => {
                const signer = provideSigner(keyring, args);

                console.log(`Deploying code from file ${args.file}`);
                const hash = await putCode(api, signer, args.file);
                console.log(`\tcode hash: ${hash}`);
            })
        .command("instantiate", "Instantiate a deployed contract",
            (args: Argv) => {
                return args.option("hash", { alias: "h", type: "string" });
            }, async (args) => {
                const signer = provideSigner(keyring, args);

                const codeHash = new H256(api.registry, args.hash);
                console.log(`Instantiating contract with hash ${codeHash}`);
                const address = await instantiate(api, signer, codeHash, "", CREATION_FEE);
                console.log(`\taddress: ${address}`);
            })
        .command("call", "Call a method of some contract",
            (args: Argv) => {
                return args; // .option("file", { alias: "f", default: "contract.wasm" });
            }, (args: Arguments) => {
                console.log("<Not implemented yet>");
            })
        .argv;
}

function provideSigner(keyring: Keyring, args: Arguments): KeyringPair {
    // @ts-ignore
    const signer = keyring.addFromUri(args.seed);
    console.log(`Signing transaction with "${signer.meta.name}":
        address: ${signer.address}
        public key: ${signer.publicKey}`);

    return signer;
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
