#!/usr/bin/env node

import { ApiPromise } from "@polkadot/api";
import { Compact } from "@polkadot/types/codec";
import { BlockNumber, Hash, Header, SignedBlock } from "@polkadot/types/interfaces";
import { getWsProvider } from "./utils/connection";
import { TYPES } from "./utils/types";

async function main() {
    const pretty = process.argv.includes("--pretty");
    const displayFull = process.argv.includes("--full");
    const displayHeader = process.argv.includes("--header");

    const all = process.argv.includes("--all");
    const includeHistorical = all || process.argv.includes("--old");
    const subscribeToNew = all || process.argv.includes("--new");
    // todo: option to display finalized only

    if (process.argv.length < 3 || process.argv.includes("--help")) {
        console.info("Choose `--old` to dump historical blocks or `--new` to subscribe for new ones (or both).");
        console.info("Choose a display mode: `--full`, `--header`. None for hashes only.");
        console.info("Specify `--pretty` if you want to prettify jsons.");
        process.exit(22);
    }

    if (!subscribeToNew && !includeHistorical) {
        console.error("Choose `--old` or `--new` blocks (or both).");
        process.exit(22);
    }

    if (displayFull && displayHeader) {
        console.error("Choose maximum one display mode (`--full` or `--header`).");
        process.exit(22);
    }

    const api = await ApiPromise.create(Object.assign(
        { provider: getWsProvider() },
        TYPES
    ));

    const last = await api.rpc.chain.getHeader();

    if (includeHistorical) {
        // @ts-ignore
        const n = last.number.toNumber();

        const hashPromises = Array.from({length: n},
            (_, i) => api.rpc.chain.getBlockHash(i + 1));

        let promises: Array<Promise<Hash | Header | SignedBlock>>;
        if (displayHeader || displayFull) {
            const retrieve: (Hash) => Promise<Header | SignedBlock> = displayFull ?
                api.rpc.chain.getBlock :
                api.rpc.chain.getHeader;

            promises = hashPromises.map((promise) => promise.then((hash) => retrieve(hash)));
        } else {
            promises = hashPromises;
        }

        const items = await Promise.all(promises);
        for (let i = 0; i < items.length; i++) {
            display(pretty, i + 1, items[i]);
        }
    }

    // todo: lag compensation between historical data and new one

    // todo: headers from `api.derive` also provide info about author, display it in full blocks mode also

    if (subscribeToNew) {
        await api.derive.chain.subscribeNewHeads((header) => {
            if (displayFull) {
                api.rpc.chain.getBlock(header.hash)
                    .then((block) => display(pretty, header.number, block));
            } else if (displayHeader) {
                display(pretty, header.number, header);
            } else {
                display(pretty, header.number, header.hash);
            }
        });
    } else {
        process.exit(0);
    }
}

type N = number | Compact<BlockNumber>;

function display(pretty: boolean, n: N, item: Hash | Header | SignedBlock) {
    if ("block" in item || "parentHash" in item) {
        console.log(`=== #${n} ===`);
        if (pretty) {
            console.log(JSON.stringify(item, null, 2));
        } else {
            console.log(`${item.toString()}`);
        }
    } else {
        console.log(`#${n}: ${item.toString()}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
