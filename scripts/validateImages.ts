// import mushyswapMainnetList from "../mushyswap-mainnet.token-list.json";
import mushyswapTestnetList from "../mushyswap-testnet.token-list.json";
import { TokenList } from "@uniswap/token-lists";
import schema from "@uniswap/token-lists/src/tokenlist.schema.json";
import Ajv, { Schema } from "ajv";
import addFormats from "ajv-formats";
import deepmerge from "deepmerge";

// export const mainnetList: TokenList = mushyswapMainnetList;
export const testnetList: TokenList = mushyswapTestnetList;

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Update JSON schema for latest version
const newSchema: Schema = deepmerge(schema, {
  definitions: {
    TokenInfo: {
      properties: {
        name: {
          pattern: "^[ \\w.'+\\-%/À-ÖØ-öø-ÿ:]+$",
        },
        tags: {
          maxItems: schema.definitions.TokenInfo.properties.tags.maxItems,
        },
      },
    },
  },
});
delete newSchema.definitions.TokenInfo.properties.tags.maxLength;

const tokenListValidator = ajv.compile(newSchema);

const validateList = (list: TokenList) => {
  const name = list.name;
  if (!tokenListValidator(list)) {
    console.error(
      `Invalid list "${name}"`,
      JSON.stringify(tokenListValidator.errors, null, 2)
    );
    throw new Error("Could not validate list: " + name);
  }
};

// Validate both lists
[testnetList].forEach(validateList);
