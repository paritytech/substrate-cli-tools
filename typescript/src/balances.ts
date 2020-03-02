#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";

import { computeEvmId, constructLabel, unfoldId } from "./utils/accounts";
import { getWsProvider } from "./utils/connection";
import TokenUnit from "./utils/token";
import { TYPES } from "./utils/types";

async function main() {
    const args = process.argv.slice(2);
    const ids = args.filter((arg) => arg !== "--evm");
    const evm = ids.length < args.length;

    const api = await ApiPromise.create(Object.assign(
        { provider: getWsProvider() },
        TYPES
    ));

    const token = await TokenUnit.provide(api);
    const keyring = new Keyring({ type: "sr25519" });

    const accounts: Array<[string, string]> = ids
        .map((id) => {
            const label = constructLabel(id);
            let address = unfoldId(keyring, id);

            if (evm) {
                address = computeEvmId(keyring, address);
                console.log(`${label}'s EVM address is ${address}`);
            }

            return [label, address];
        });

    const labels = accounts.map((account) => account[0]);
    const addresses = accounts.map((account) => account[1]);
    const previousBalances = accounts.map((_) => undefined);

    if (evm) {
        await api.query.evm.accounts.multi(addresses,
            (evmAccounts) => {
                // @ts-ignore
                const balances = evmAccounts.map((evmAccount: Account) => evmAccount.balance);
                handleBalancesChange(labels, token, previousBalances, balances);
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

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
