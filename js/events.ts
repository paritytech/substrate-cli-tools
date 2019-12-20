const { ApiPromise, WsProvider } = require('@polkadot/api');

const wsProvider = new WsProvider('ws://127.0.0.1:9944');
// const wsProvider = new WsProvider('wss://cc3-5.kusama.network/');

async function main() {
    const api = new ApiPromise({ provider: wsProvider });
    await api.isReady;

    api.query.system.events((events) => {
        console.log(`Received ${events.length} events:`);

        events.forEach((record) => {
            const { event, phase } = record;

            // if (event.section == "contracts") {
                console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
                console.log(`\t\t${event.meta.documentation.toString()}`);

                const types = event.typeDef;
                event.data.forEach((data, index) => {
                    console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
                });
            // }
        });

        console.log("\n");
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
