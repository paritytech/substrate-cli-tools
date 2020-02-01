#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { blake2AsHex } from "@polkadot/util-crypto";
import { getWsProvider } from "./utils/connection";
import TokenUnit from "./utils/token";

async function main() {
    const args = process.argv.slice(2);
    const ids = args.filter((arg) => arg !== "--evm");
    const evm = ids.length < args.length;

    let api;
    if (evm) {
        console.log("EVM mode is enabled");

        api = await ApiPromise.create({
            provider: getWsProvider(),
            types: {
                Account: {
                    nonce: "U256",
                    balance: "U256",
                },
                Log: {
                    address: "H160",
                    topics: "Vec<H256>",
                    data: "Vec<u8>",
                },
            },
        });
    } else {
        api = await ApiPromise.create({ provider: getWsProvider() });
    }

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    const accounts: Array<[string, string]> = ids
        .map((id) => {
            let label;
            let address;
            if (id.startsWith("/")) {
                label = id;
                address = keyring.addFromUri(id).address;
            } else {
                label = shorten(id);
                address = id;
            }

            if (evm) {
                address = evmAddress(keyring, address);
                console.log(`${label}'s EVM address is 0x${address}`);
            }

            return [label, address];
        });

    const labels = accounts.map((account) => account[0]);
    const addresses = accounts.map((account) => account[1]);
    const previousBalances = accounts.map((_) => undefined);

    if (evm) {
        console.log();
        await api.query.evm.accounts.multi(addresses,
            (evmAccounts) => {
                const balances = evmAccounts.map((evmAccount) => evmAccount.balance);
                handleBalancesChange(labels, token, previousBalances, balances);

                evmAccounts.forEach((evmAccount) => {
                    console.log("[debug]", JSON.stringify(evmAccount, null, 2));
                });
            });
    } else {
        await api.query.balances.freeBalance.multi(addresses,
            (balances) => handleBalancesChange(labels, token, previousBalances, balances));
    }
}

function handleBalancesChange(labels, token, prevValues, newValues) {
    labels.forEach((label, i) => {
        const previous = prevValues[i];

        if (previous) {
            console.log();
        }

        const current = newValues[i];
        console.log(`${label}'s balance is ${token.display(current as Balance)}`);

        if (previous) {
            console.log(`\tDelta: ${token.display((current as Balance).sub(previous))}`);
        }
        prevValues[i] = current;
    });
}

function evmAddress(keyring: Keyring, address: string): string {
    const bytes = keyring.decodeAddress(address);
    const hex = blake2AsHex(bytes, 256);
    console.assert(hex.length === 66); // 0x + 32 bytes
    return hex.substring(2 + 24); // skipping 12 bytes
}

function shorten(long: string): string {
    const n = long.length;
    return long.substr(0, 4) + "..."
        + long.substr(n - 1 - 4, 4);
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
