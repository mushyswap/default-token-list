import mainnet from "../../src/mainnet.tokens.json";
import devnet from "../../src/devnet.tokens.json";
import { TokenInfo } from "@uniswap/token-lists";

type IRawToken = Pick<TokenInfo, "address" | "name" | "symbol"> &
  Partial<Pick<TokenInfo, "logoURI" | "decimals">> & {
    isExperimental?: boolean;
    logoFile?: string;
  };

type IRawTokenListJson = readonly IRawToken[];

export const NEXUS_NETWORK_NAMES = ["devnet", "mainnet"] as const;
export type INexusNetwork = typeof NEXUS_NETWORK_NAMES[number];

// assert the JSON is valid
const rawTokensJson: {
  [network in INexusNetwork]: [number, IRawTokenListJson];
} = {
  devnet: [393, devnet],
  mainnet: [392, mainnet],
};

export const getNetworkTokens = (network: INexusNetwork): IRawTokenListJson =>
  rawTokensJson[network][1];

export const rawTokens: readonly (IRawToken & {
  chainId: number;
})[] = Object.values(rawTokensJson).flatMap(([chainId, tokens]) =>
  tokens.map((tok) => ({ ...tok, chainId }))
);
