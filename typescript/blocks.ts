#!/usr/bin/env node

const { ApiPromise } = require('@polkadot/api');
const { getWsProvider } = require('./common.ts');

async function main() {
    const pretty = process.argv.includes("--pretty");
    const displayFull = process.argv.includes("--full");
    const displayHeader = process.argv.includes("--header");
    const includeHistorical = process.argv.includes("--all");
    //todo: option to display finalized only

    if (displayFull && displayHeader) {
        console.error("Choose maximum one display mode.");
        process.exit(22);
    }

    const display = displayFull || displayHeader ? displayWithDetails : displayOnlyHash;

    const api = await ApiPromise.create({ provider: getWsProvider() });

    const [chain, last] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.chain.getHeader()
    ]);

    if (includeHistorical) {
        const n = last.number.toNumber();

        const hashPromises = Array.from({length: n},
            (_, i) => api.rpc.chain.getBlockHash(i + 1));

        var promises;
        if (displayHeader || displayFull) {
            const retrieve = displayFull ? api.rpc.chain.getBlock : api.rpc.chain.getHeader;
            promises = hashPromises.map((promise) => promise.then((hash) => retrieve(hash)));
        } else {
            promises = hashPromises;
        }

        const items = await Promise.all(promises);
        for (let i = 0; i < items.length; i++) {
            display(pretty, i + 1, items[i]);
        }
    }

    //todo: lag compensation between historical data and new one

    await api.rpc.chain.subscribeNewHeads((header) => {
        if (displayHeader) {
            display(pretty, header.number, header);
        } else if (displayFull) {
            //fixme:
            //const block = api.rpc.chain.getBlock(header);
            //display(pretty, header.number, block);
            display(pretty, header.number, header);

            //rough idea by YJ:
            // const unsub = await api.rpx.chain.subscribeNewHeads()
            //     .pipe(() =>
            //         switchMap((header) => {
            //             // get block and do some stuff
            //
            //             return obervable<results>
            //         }).subscribe((results) => { ... do stuff })
            //
            // unsub()
        } else {
            display(pretty, header.number, header.hash);
        }
    });
}

function displayOnlyHash(_, number, hash) {
    console.log(`#${number}: ${hash.toString()}`);
}

function displayWithDetails(pretty, number, item) {
    console.log(`=== #${number} ===`);
    if (pretty) {
        console.log(JSON.stringify(item, null, 2));
    } else {
        console.log(`${item.toString()}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
