import { getAddress } from "@ethersproject/address";
import * as fs from "fs/promises";
import * as process from "process";
import { NETWORK_NAMES, getNetworkTokens, INetwork } from "./utils/rawTokens";

const cleanupTokens = async (network: INetwork) => {
  const file = `${__dirname}/../src/${network}.tokens.json`;

  //const tokens = getNetworkTokens(network)
  //  .slice()
  //  .sort((a, b) =>
  //    a.address.toLowerCase().localeCompare(b.address.toLowerCase())
  //  );

  const tokens = getNetworkTokens(network);

  await fs.writeFile(
    file,
    JSON.stringify(
      tokens.map((tok) => ({ ...tok, address: getAddress(tok.address) }))
    )
  );
};

const main = async () => {
  console.log("Fixing addresses...");
  await Promise.all(NETWORK_NAMES.map(cleanupTokens));
  console.log("Fixed and files overwritten");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
