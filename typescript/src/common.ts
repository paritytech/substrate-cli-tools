import { WsProvider } from '@polkadot/api';

export const LOCAL_NODE = 'wss://cc3-5.kusama.network/';

export function getWsProvider(): WsProvider {
    const i = process.argv.findIndex((argument) => argument === "--url");
    if (i < 0) {
        return new WsProvider(LOCAL_NODE);
    } else if (process.argv.length < i + 2) {
        console.error("Encountered `--url` option, but no url provided.");
        process.exit(22);
    }
    const url = process.argv[i + 1];
    console.log(`Connecting to ${url}`);
    return new WsProvider(url);
}

//exports.LOCAL_NODE = LOCAL_NODE;
//exports.getWsProvider = getWsProvider;
