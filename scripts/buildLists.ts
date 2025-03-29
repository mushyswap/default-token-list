import fs from "fs/promises";
import * as process from "process";
import packageJSON from "../package.json";
import { rawTokens } from "./utils/rawTokens";
import { TokenInfo, TokenList } from "@uniswap/token-lists";
import { requireOrNull } from "./utils/requireOrNull";

const version = packageJSON.version.split(".");

const LOGO_URI_BASE =
  "https://raw.githubusercontent.com/mushyswap/default-token-list/master";

const makeTokenList = (
  previousTokenList: TokenList | null,
  tokens: TokenInfo[]
): TokenList => {
  let timestamp: string = new Date().toISOString();
  if (process.env.CI) {
    if (!previousTokenList) {
      throw new Error("Token list not found");
    }
    timestamp = previousTokenList.timestamp;
  }
  return {
    name: previousTokenList?.name ?? "Unknown List",
    logoURI: `${LOGO_URI_BASE}/logo.svg`,
    keywords: ["nexus", "mushyswap", "defi"],
    timestamp,
    tokens,
    version: {
      major: parseInt(version[0]),
      minor: parseInt(version[1]),
      patch: parseInt(version[2]),
    },
  };
};

const main = async () => {
  const allTokens = await Promise.all(
    rawTokens.map(async ({ logoURI: elLogoURI, logoFile, ...el }) => {
      const network = el.chainId === 393 ? "devnet" : "mainnet";
      const logoURI = `${LOGO_URI_BASE}/assets/${network}/${el.address}/logo.png`;

      // Validate logo existence
      const logoPath = `${__dirname}/..${logoURI.substring(
        LOGO_URI_BASE.length
      )}`;
      try {
        await fs.stat(logoPath);
      } catch {
        console.warn(`Missing logo for ${el.address} on ${network}`);
      }

      return {
        ...el,
        decimals: el.decimals || 18,
        logoURI,
        isExperimental: el.isExperimental,
      };
    })
  );

  const [mainTokenListTokens, experimentalTokenListTokens] = allTokens.reduce(
    ([mainTokens, experimentalTokens], { isExperimental, ...tok }) => {
      if (isExperimental !== true && tok.chainId === 393) {
        return [
          [...mainTokens, tok],
          [...experimentalTokens, tok],
        ];
      } else {
        return [mainTokens, [...experimentalTokens, tok]];
      }
    },
    [[] as TokenInfo[], [] as TokenInfo[]]
  );

  const previousTokenList = requireOrNull(
    __dirname,
    "../mushyswap.token-list.json"
  );
  const previousExperimentalTokenList = requireOrNull(
    __dirname,
    "../mushyswap-experimental.token-list.json"
  );

  const tokenList = makeTokenList(previousTokenList, mainTokenListTokens);
  const experimentalTokenList = makeTokenList(
    previousExperimentalTokenList,
    experimentalTokenListTokens
  );

  await fs.writeFile(
    __dirname + "/../mushyswap.token-list.json",
    JSON.stringify(tokenList, null, 2)
  );

  await fs.writeFile(
    __dirname + "/../mushyswap-experimental.token-list.json",
    JSON.stringify(experimentalTokenList, null, 2)
  );
};

main().catch((err) => {
  console.error("Error", err);
  process.exit(1);
});
