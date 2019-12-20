const { ApiPromise, WsProvider } = require('@polkadot/api');

const localNode = 'ws://127.0.0.1:9944';

//todo: move to common
function getWsProvider() {
    const i = process.argv.findIndex((argument) => argument === "--url");
    if (i < 0) {
        return new WsProvider(localNode);
    } else if (process.argv.length < i + 2) {
        console.error("Encountered `--url` option, but no url provided.");
        process.exit(22);
    }
    const url = process.argv[i + 1];
    console.log(`Connecting to ${url}`);
    return new WsProvider(url);
}

async function main() {
    const pretty = process.argv.includes("--pretty");
    const displayFull = process.argv.includes("--full");
    const displayHeader = process.argv.includes("--head");
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

    await api.rpc.chain.subscribeNewHeads()
        .pipe() ((header) => {
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
