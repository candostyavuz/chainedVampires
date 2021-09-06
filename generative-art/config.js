const fs = require("fs");
const width = 1000;
const height = 1000;
const dir = "./generative-art/vampireParts";
const description = "ChainBite Vampires";
const baseImageUri = "https://chainbite.io/";
const startEditionFrom = 1;
const endEditionAt = 5;
const rarityWeights = [
  {
    value: "tier_0",
    from: 1,
    to: 2,
  },
  {
    value: "tier_1",
    from: 3,
    to: 5,
  },
  {
    value: "tier_2",
    from: 6,
    to: 7,
  },
  {
    value: "tier_3",
    from: 8,
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
    elements: getElements(`${dir}/1-background/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 2,
    name: "circle",
    elements: {
      tier_3: getElements(`${dir}/2-circle/tier-3/`),
      tier_2: getElements(`${dir}/2-circle/tier-2/`),
      tier_1: getElements(`${dir}/2-circle/tier-1/`),
      tier_0: getElements(`${dir}/2-circle/tier-0/`),
    },
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 3,
    name: "body",
    elements: getElements(`${dir}/3-body/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 4,
    name: "eye",
    elements: getElements(`${dir}/4-eye/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 5,
    name: "forehead",
    elements: getElements(`${dir}/4-forehead/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 6,
    name: "mouth",
    elements: getElements(`${dir}/4-mouth/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 7,
    name: "nose",
    elements: getElements(`${dir}/4-nose/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 8,
    name: "accessory",
    elements: getElements(`${dir}/5-accessory/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 9,
    name: "clothes",
    elements: {
      tier_3: getElements(`${dir}/5-clothes/tier-3/`),
      tier_2: getElements(`${dir}/5-clothes/tier-2/`),
      tier_1: getElements(`${dir}/5-clothes/tier-1/`),
      tier_0: getElements(`${dir}/5-clothes/tier-0/`),
    },
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 10,
    name: "accessorytwo",
    elements: getElements(`${dir}/6-accessory/`),
    position: { x: 0, y: 0 },
    size: { width: width, height: height },
  },
  {
    id: 11,
    name: "hair",
    elements: {
      tier_3: getElements(`${dir}/6-hair/tier-3/`),
      tier_2: getElements(`${dir}/6-hair/tier-2/`),
      tier_1: getElements(`${dir}/6-hair/tier-1/`),
      tier_0: getElements(`${dir}/6-hair/tier-0/`),
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
