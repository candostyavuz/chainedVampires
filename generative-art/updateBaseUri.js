const fs = require("fs");
const baseUri = "ipfs://QmU3Kjx33vw98pV7g3QBKi44E6HUQgDdPvDZQ3gMAaahEp";

// read json data
let rawdata = fs.readFileSync(`generative-art/output/metadata/_allmetadata.json`);
let data = JSON.parse(rawdata);

data.forEach((item) => {
  item.image = `${baseUri}/${item.edition}.png`;
  fs.writeFileSync(
    `./generative-art/output/metadata/${item.edition}.json`,
    JSON.stringify(item, null, 2)
  );
});

fs.writeFileSync(
  `generative-art/output/metadata/_allmetadata.json`,
  JSON.stringify(data, null, 2)
);

console.log(`Updated baseUri for images to ===> ${baseUri}`);
