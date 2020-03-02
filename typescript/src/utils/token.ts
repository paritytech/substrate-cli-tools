import { ApiPromise } from "@polkadot/api";
import { TypeRegistry, u32 } from "@polkadot/types";
import { ChainProperties } from "@polkadot/types/interfaces/rpc";
import { Balance } from "@polkadot/types/interfaces/runtime";
import { formatBalance } from "@polkadot/util";
import BN from "bn.js";

const registry = new TypeRegistry();

export const DEFAULT_UNIT = "DEV";
export const DEFAULT_DECIMALS = new u32(registry, 12);

export default class TokenUnit {
    public decimals: number;
    public unit: Balance;
    public symbol: string;

    private formatter: any;

    public static async provide(api: ApiPromise): Promise<TokenUnit> {
        const properties: ChainProperties = await api.rpc.system.properties();

        const token = new TokenUnit();
        token.decimals = properties.tokenDecimals.unwrapOr(DEFAULT_DECIMALS).toNumber();
        token.symbol = properties.tokenSymbol.unwrapOr(DEFAULT_UNIT).toString();
        token.unit = new BN(Math.pow(10, token.decimals)) as Balance;

        token.formatter = formatBalance;
        token.formatter.setDefaults({ decimals: token.decimals, unit: token.symbol });

        return token;
    }

    public parseBalance(raw: string | number): Balance {
        console.log("type is: ", typeof raw);
        if (typeof raw === "string" && raw.endsWith(this.symbol)) {
            const value = raw.substring(0, raw.length - this.symbol.length);
            return this.multiply(new BN(value, 10));
        } else {
            return new BN(raw, 10) as Balance;
        }
    }

    public multiply(n: number | BN | Balance): Balance {
        const value: Balance = (n instanceof Number ? new BN(n) : n) as Balance;
        return this.unit.mul(value) as Balance;
    }

    public display(n: number | BN | Balance): string {
        return this.formatter(n);
    }
}
