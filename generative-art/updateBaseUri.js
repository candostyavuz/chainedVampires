const fs = require("fs");
const { ethers } = require("hardhat");
const baseUri = "ipfs://Qmd7DdbQNrdkQQZaQDqXRG2o7cKK488k3a683YZkZbFCyV";

const HASH_BASE = "fikret";

// read json data
let rawdata = fs.readFileSync(`generative-art/output/metadata/_allmetadata.json`);
let data = JSON.parse(rawdata);

data.forEach((item) => {
  let hashInput = ethers.utils.toUtf8Bytes(HASH_BASE + item.edition.toString());
  let intHash = BigInt(ethers.utils.keccak256(hashInput));
  let hash = (intHash.toString());

  item.image = `${baseUri}/${hash}.png`;
  fs.writeFileSync(
    `./generative-art/output/metadata/${hash}.json`,
    JSON.stringify(item, null, 2)
  );

  // item.image = `${baseUri}/${item.edition}.png`;
  // fs.writeFileSync(
  //   `./generative-art/output/metadata/${item.edition}.json`,
  //   JSON.stringify(item, null, 2)
  // );
});

fs.writeFileSync(
  `generative-art/output/metadata/_allmetadata.json`,
  JSON.stringify(data, null, 2)
);

console.log(`_allmetadata Updated baseUri  for images to ===> ${baseUri}`);
