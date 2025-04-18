import mainnet from "../../src/mainnet.tokens.json";
import testnet from "../../src/testnet.tokens.json";
import { TokenInfo } from "@uniswap/token-lists";

type IRawToken = Pick<TokenInfo, "address" | "name" | "symbol"> &
  Partial<Pick<TokenInfo, "logoURI" | "decimals">> & {
    isExperimental?: boolean;
    logoFile?: string;
  };

type IRawTokenListJson = readonly IRawToken[];

export const NETWORK_NAMES = ["testnet", "mainnet"] as const;
export type INetwork = typeof NETWORK_NAMES[number];

// assert the JSON is valid
const rawTokensJson: {
  [network in INetwork]: [number, IRawTokenListJson];
} = {
  testnet: [504, testnet],
  mainnet: [503, mainnet], //Unknown yet
};

export const getNetworkTokens = (network: INetwork): IRawTokenListJson =>
  rawTokensJson[network][1];

export const rawTokens: readonly (IRawToken & {
  chainId: number;
})[] = Object.values(rawTokensJson).flatMap(([chainId, tokens]) =>
  tokens.map((tok) => ({ ...tok, chainId }))
);
