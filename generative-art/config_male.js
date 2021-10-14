const fs = require("fs");
const width = 1000;
const height = 1000;
const dir = "./generative-art/vampireParts";
const description = "Vampire legion of the metaverse, combining unique NFT collector experience with passive income dynamics. Total of 7000 algorithmically generated Chained Vampires are available only on Avalanche. Fees are reflected and rewards can be claimed anytime, distributed as $AVAX.";
const baseImageUri = "ipfs://";
const startEditionFrom = 0;
// const endEditionAt = 3490;
const endEditionAt = 2;

const vampGender_male = "male"; 

const rarityWeights = [
  {
    value: "tier_0",
    from: 0,
    to: 210,
  },
  {
    value: "tier_1",
    from: 211,
    to: 838,
  },
  {
    value: "tier_2",
    from: 839,
    to: 2024,
  },
  {
    value: "tier_3",
    from: 2025,
    to: endEditionAt,
  },
];

const cleanName = (_str) => {
  let name = _str.slice(0, -4);
  return name;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i) => {
      return {
        name: cleanName(i),
        path: `${path}/${i}`,
      };
    });
};

const layers = [
  {
    id: 1,
    name: "background",
    elements: getElements(`${dir}/${vampGender_male}/1-background/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 2,
    name: "circle",
    elements: {
      tier_3: getElements(`${dir}/${vampGender_male}/2-circle/tier-3/`),
      tier_2: getElements(`${dir}/${vampGender_male}/2-circle/tier-2/`),
      tier_1: getElements(`${dir}/${vampGender_male}/2-circle/tier-1/`),
      tier_0: getElements(`${dir}/${vampGender_male}/2-circle/tier-0/`),
    },
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 3,
    name: "body",
    elements: getElements(`${dir}/${vampGender_male}/3-body/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 4,
    name: "eye",
    elements: getElements(`${dir}/${vampGender_male}/4-eye/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 5,
    name: "forehead",
    elements: getElements(`${dir}/${vampGender_male}/4-forehead/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 6,
    name: "mouth",
    elements: getElements(`${dir}/${vampGender_male}/4-mouth/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 7,
    name: "nose",
    elements: getElements(`${dir}/${vampGender_male}/4-nose/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 8,
    name: "clothes",
    elements: {
      tier_3: getElements(`${dir}/${vampGender_male}/5-clothes/tier-3/`),
      tier_2: getElements(`${dir}/${vampGender_male}/5-clothes/tier-2/`),
      tier_1: getElements(`${dir}/${vampGender_male}/5-clothes/tier-1/`),
      tier_0: getElements(`${dir}/${vampGender_male}/5-clothes/tier-0/`),
    },
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 9,
    name: "accessory",
    elements: getElements(`${dir}/${vampGender_male}/5-earring/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 10,
    name: "accessorytwo",
    elements: getElements(`${dir}/${vampGender_male}/5-glasses/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 11,
    name: "accessorytwo",
    elements: getElements(`${dir}/${vampGender_male}/5-necklace/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 12,
    name: "hair",
    elements: {
      tier_3: getElements(`${dir}/${vampGender_male}/6-hair/tier-3/`),
      tier_2: getElements(`${dir}/${vampGender_male}/6-hair/tier-2/`),
      tier_1: getElements(`${dir}/${vampGender_male}/6-hair/tier-1/`),
      tier_0: getElements(`${dir}/${vampGender_male}/6-hair/tier-0/`),
    },
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
];

module.exports = {
  layers,
  width,
  height,
  description,
  baseImageUri,
  startEditionFrom,
  endEditionAt,
  rarityWeights,
};
