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
  tokens: TokenInfo[],
  network: string
): TokenList => {
  let timestamp: string = new Date().toISOString();
  if (process.env.CI) {
    if (!previousTokenList) {
      throw new Error("Token list not found");
    }
    timestamp = previousTokenList.timestamp;
  }
  return {
    name: `${network.charAt(0).toUpperCase() + network.slice(1)} List`,
    logoURI: `${LOGO_URI_BASE}/logo.svg`,
    keywords: ["mushyswap", "defi"],
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
      const network =
        el.chainId === 393
          ? "devnet"
          : el.chainId === 504
          ? "lightchain"
          : "mainnet";
      const logoURI = `${LOGO_URI_BASE}/assets/${network}/${el.address}/logo.png`;

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
      const network =
        tok.chainId === 393
          ? "devnet"
          : tok.chainId === 504
          ? "lightchain"
          : "mainnet";
      if (isExperimental !== true && network === "mainnet") {
        return [
          [...mainTokens, tok],
          [...experimentalTokens, tok],
        ];
      } else if (network === "devnet") {
        return [mainTokens, [...experimentalTokens, tok]];
      } else if (network === "lightchain") {
        return [mainTokens, [...experimentalTokens, tok]];
      } else {
        return [mainTokens, experimentalTokens];
      }
    },
    [[] as TokenInfo[], [] as TokenInfo[]]
  );

  // const previousMainnetTokenList = requireOrNull(
  //   __dirname,
  //   "../mushyswap-mainnet.token-list.json"
  // );

  const previousDevnetTokenList = requireOrNull(
    __dirname,
    "../mushyswap-devnet.token-list.json"
  );

  const previousLightchainTokenList = requireOrNull(
    __dirname,
    "../mushyswap-lightchain.token-list.json"
  );

  // const mainnetTokenList = makeTokenList(
  //   previousMainnetTokenList,
  //   mainTokenListTokens,
  //   "mainnet"
  // );
  const devnetTokenList = makeTokenList(
    previousDevnetTokenList,
    experimentalTokenListTokens,
    "devnet"
  );

  const lightchainTokenList = makeTokenList(
    previousLightchainTokenList,
    experimentalTokenListTokens,
    "lightchain"
  );

  // await fs.writeFile(
  //   __dirname + "/../mushyswap-mainnet.token-list.json",
  //   JSON.stringify(mainnetTokenList, null, 2)
  // );

  await fs.writeFile(
    __dirname + "/../mushyswap-devnet.token-list.json",
    JSON.stringify(devnetTokenList, null, 2)
  );

  await fs.writeFile(
    __dirname + "/../mushyswap-lightchain.token-list.json",
    JSON.stringify(lightchainTokenList, null, 2)
  );
};

main().catch((err) => {
  console.error("Error", err);
  process.exit(1);
});
