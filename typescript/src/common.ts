import { WsProvider } from "@polkadot/api";
import { PromiseResult } from "@polkadot/api/types";
import { Observable } from "rxjs";

export const LOCAL_NODE = "ws://127.0.0.1:9944";

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

export function textify<X, Y>(f: PromiseResult<(X) => Observable<Y>>): (X) => Promise<string> {
    return (x: X) => f(x).then((y) => y.toString());
}
