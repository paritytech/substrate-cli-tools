#!/usr/bin/env node

import { ApiPromise, Keyring } from "@polkadot/api";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { U256 } from '@polkadot/types/primitive';

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

    if (evm) {
        const previous: Array<U256 | undefined> = accounts.map((_) => undefined);

        await api.query.evm.accounts.multi(addresses,
            (evmAccounts) => {
                // @ts-ignore
                const balances = evmAccounts.map((evmAccount: Account) => evmAccount.balance);
                handleBalancesChange<U256>(labels, null, previous, balances);
            });
    } else {
        const token = await TokenUnit.provide(api);
        const previous: Array<Balance | undefined> = accounts.map((_) => undefined);

        await api.query.system.account.multi(addresses,
            (balances) => handleBalancesChange<Balance>(labels, token, previous,
                balances.map((x: any) => x.data.free)));
    }
}

function handleBalancesChange<B extends U256 | Balance>(
        labels: Array<String>,
        token: TokenUnit | null,
        prevValues: Array<B | undefined>,
        newValues: Array<B>) {
    function display(balance: B) {
        if (token === null) {
            return balance.toString();
        } else {
            return token.display(balance);
        }
    }

    labels.forEach((label, i) => {
        const previous = prevValues[i];

        if (previous) {
            console.log();
        }

        const current = newValues[i] as B;
        console.log(`${label}'s balance is ${display(current)}`);

        if (previous) {
            const x: B = current.sub(previous) as B;
            console.log(`\tDelta: ${display(x)}`);
        }
        prevValues[i] = current;
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
