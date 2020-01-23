#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { getWsProvider } from "./utils/connection";
import TokenUnit from "./utils/token";

async function main() {
    const api = await ApiPromise.create({ provider: getWsProvider() });
    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    const accounts: Array<[string, string]> = process.argv.slice(2)
        .map((arg) => {
            if (arg.startsWith("/")) {
                return [arg, keyring.addFromUri(arg).address];
            } else {
                return [shorten(arg), arg];
            }
        });

    const labels = accounts.map((account) => account[0]);
    const addresses = accounts.map((account) => account[1]);
    const previousBalances = accounts.map((_) => undefined);

    await api.query.balances.freeBalance.multi(addresses, (balances) => {
        addresses.forEach((_, i) => {
            const previous = previousBalances[i];

            if (previous) {
                console.log();
            }

            const current = balances[i];
            console.log(`${labels[i]}'s balance is ${token.display(current as Balance)}`);

            if (previous) {
                console.log(`\tDelta: ${token.display((current as Balance).sub(previous))}`);
            }
            previousBalances[i] = current;
        });
    });
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
