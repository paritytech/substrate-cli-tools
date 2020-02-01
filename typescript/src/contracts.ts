#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { H256 } from "@polkadot/types";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { getWsProvider} from "./utils/connection";
import { callContract, instantiate, putCode } from "./utils/contracts";
import TokenUnit from "./utils/token";

import yargs = require("yargs");
import {Arguments, Argv} from "yargs";

import BN from "bn.js";

async function main() {
    const api = await ApiPromise.create({ provider: getWsProvider() });
    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    yargs
        .option("seed", { alias: "s", global: true, default: "//Alice" })
        .option("gas", { alias: "g", type: "number" })
        .command("deploy", "Upload a contract from a file",
            (args: Argv) => {
                return args.option("file", { alias: "f", type: "string" });
            }, async (args) => {
                const signer = provideSigner(keyring, args);

                const gas = args.gas as number;
                console.log(`Deploying code from file ${args.file} with ${gas} of gas`);
                const hash = await putCode(api, signer, args.file, gas);
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
                const signer = provideSigner(keyring, args);

                const codeHash = new H256(api.registry, args.hash);
                const gas = args.gas as number;
                const endowment = balance(token, args.endowment);
                const data = args.data;

                console.log(`Instantiating contract with hash ${codeHash}, ${token.display(endowment)} as an endowment and ${gas} of gas`);

                const address = await instantiate(api, signer, codeHash, data, endowment, gas);
                console.log(`Contract instantiated with address ${address}`);

                process.exit(0);
            })
        .command("call", "Call a method of some contract",
            (args: Argv) => {
                return args; // .option("file", { alias: "f", default: "contract.wasm" });
            }, (args: Arguments) => {
                console.log("<Not implemented yet>");
                process.exit(0);
            })
        .command("info", "Grab some information about instantiated contract",
            (args: Argv) => {
                return args.option("address", { alias: "a", type: "string" });
            }, async (args) => {
                const info = await api.query.contracts.contractInfoOf(args.address);
                console.log(JSON.stringify(info, null, 2));
                process.exit(0);
            })
        .demandCommand()
        .argv;
}

function balance(token: TokenUnit, raw: string): Balance {
    if (raw.endsWith(token.symbol)) {
        return token.multiply(new BN(raw.substring(0, raw.length - token.symbol.length), 10));
    } else {
        return new BN(raw, 10) as Balance;
    }
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
