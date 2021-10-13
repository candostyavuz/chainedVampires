require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

const {
  layers,
  width,
  height,
  description,
  baseImageUri,
  startEditionFrom,
  endEditionAt,
  rarityWeights,
} = require("./config_male.js");

const {
  layers_female,
  startEditionFrom_female,
  endEditionAt_female,
  rarityWeights_female,
} = require("./config_female.js");

let genderStr;  // Determines the gender of current creation

const console = require("console");
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

const HASH_BASE = "mokar";

var attributesList = [];
var dnaList = [];
var dnaListFemale = [];

var nftBuffer = [];
let metadataArr = [];

const saveNFT = async (_metadata, _dna) => {
  let NFTobj = {
    image: canvas.toBuffer("image/png"),
    metadata: _metadata
  };
  nftBuffer.push(NFTobj);
  console.log("New nft object has been added with DNA: " + _dna);
};

const shuffleAll = () => {
  let currIdx = nftBuffer.length;
  let randIdx;
  let temp;
  while (currIdx != 0) {
    randIdx = Math.floor(Math.random() * currIdx);
    currIdx--;

    temp = nftBuffer[currIdx].metadata.edition;
    nftBuffer[currIdx].metadata.edition = nftBuffer[randIdx].metadata.edition;
    nftBuffer[randIdx].metadata.edition = temp;

    [nftBuffer[currIdx], nftBuffer[randIdx]] = [nftBuffer[randIdx], nftBuffer[currIdx]];
  }
  return nftBuffer;
};

const saveAll = async () => {
  let imgDir = "";
  let metaDir = "";
  for (let i = 0; i < nftBuffer.length; i++) {
    // let the chaos begin
    let hashInput = ethers.utils.toUtf8Bytes(HASH_BASE + nftBuffer[i].metadata.edition.toString());
    let intHash = BigInt(ethers.utils.keccak256(hashInput));
    let hash = (intHash.toString());

    //
    console.log("Saving Image no: " + nftBuffer[i].metadata.edition);
    imgDir = `./generative-art/output/image/${hash}.png`;
    fs.writeFileSync(imgDir, (nftBuffer[i].image));

    console.log("Saving Metadata: " + nftBuffer[i].metadata.edition);
    metaDir = `./generative-art/output/metadata/${hash}.json`;
    nftBuffer[i].metadata.name += ` #${nftBuffer[i].metadata.edition}`;
    fs.writeFileSync(metaDir, JSON.stringify(nftBuffer[i].metadata));

    metadataArr.push(nftBuffer[i].metadata);

    // //
    // console.log("Saving Image no: " + nftBuffer[i].metadata.edition);
    // imgDir = `./generative-art/output/image/${nftBuffer[i].metadata.edition}.png`;
    // fs.writeFileSync(imgDir, (nftBuffer[i].image));

    // console.log("Saving Metadata: " + nftBuffer[i].metadata.edition);
    // metaDir = `./generative-art/output/metadata/${nftBuffer[i].metadata.edition}.json`;
    // nftBuffer[i].metadata.name += ` #${nftBuffer[i].metadata.edition}`;
    // fs.writeFileSync(metaDir, JSON.stringify(nftBuffer[i].metadata));

    // metadataArr.push(nftBuffer[i].metadata);
  };
  console.log("NFT's have been generated and saved successfully!");
}

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, 85%)`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = genColor();
  ctx.fillRect(0, 0, width, height);
};

const addMetadata = async (_dna, _edition, _rarity) => {
  let dateTime = Date.now();

  let clanString = "";
  if (_rarity == "tier_0") {
    clanString = "Elder Vampire";
  } else if (_rarity == "tier_1") {
    clanString = "Nosferatu";
  } else if (_rarity == "tier_2") {
    clanString = "Predator";
  } else if (_rarity == "tier_3") {
    clanString = "Scavenger";
  } else {
    clanString = "Forgotten One";
  }

  // attributesList.push(
  //   {
  //     "display_type": "number",
  //     "trait_type": "Identity Number",
  //     "value": _edition
  //   });
  attributesList.push(
    {
      "display_type": "date",
      "trait_type": "Birthday",
      "value": dateTime
    });
  attributesList.push(
    {
      "trait_type": "Gender",
      "value": genderStr.toString()
    });
  attributesList.push(
    {
      "trait_type": "Rarity",
      "value": _rarity
    });
  attributesList.push(
    {
      "trait_type": "DNA",
      "value": _dna.map(String)
    });

  let tempMetadata = {
    description: description,
    external_url: "https://chainedvampires.com",
    // name: `${clanString} #${_edition}`,
    name: `${clanString}`,
    image: `${baseImageUri}`,
    edition: `${_edition}`,
    attributes: attributesList,
  };
  // writeMetaData(tempMetadata, _edition);
  await saveNFT(tempMetadata, _dna.map(String));
  attributesList = [];
};

const writeMetaData = (_data, _edition) => {
  fs.writeFileSync(`./generative-art/output/metadata/${_edition}.json`, JSON.stringify(_data));
};

const writeAllMetaData = () => {
  fs.writeFileSync("./generative-art/output/metadata/_allmetadata.json", JSON.stringify(metadataArr));
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.selectedElement.layername,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_element) => {
  ctx.drawImage(
    _element.loadedImage,
    _element.layer.position.x,
    _element.layer.position.y,
    _element.layer.size.width,
    _element.layer.size.height
  );
  addAttributes(_element);
};

const constructLayerToDna = (_dna = [], _layers = [], _rarity) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement;
    if (layer.name === "circle" || layer.name === "clothes" || layer.name === "hair") {
      selectedElement = layer.elements[_rarity][_dna[index]];
      selectedElement.layername = layer.name;
    } else {
      selectedElement = layer.elements[_dna[index]];
      selectedElement.layername = layer.name;
    }
    return {
      location: layer.location,
      position: layer.position,
      size: layer.size,
      selectedElement: selectedElement,
    };
  });

  return mappedDnaToLayers;
};

const getRarity = (_editionCount) => {
  let rarity = "";
  if (genderStr === "male") {
    rarityWeights.forEach((rarityWeight) => {
      if (
        _editionCount >= rarityWeight.from &&
        _editionCount <= rarityWeight.to
      ) {
        rarity = rarityWeight.value;
      }
    });
  } else {
    rarityWeights_female.forEach((rarityWeight) => {
      if (
        _editionCount >= rarityWeight.from &&
        _editionCount <= rarityWeight.to
      ) {
        rarity = rarityWeight.value;
      }
    });
  }

  return rarity;
};

const isDnaUnique = (_DnaList = [], _dna = []) => {
  let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
  return foundDna == undefined ? true : false;
};

const createDna = (_layers, _rarity) => {
  let randNum = [];
  _layers.forEach((layer) => {
    let num = 0;
    if (layer.name === "circle" || layer.name === "clothes" || layer.name === "hair") {
      num = Math.floor(Math.random() * layer.elements[_rarity].length);
    } else {
      num = Math.floor(Math.random() * layer.elements.length);
    }
    randNum.push(num);
  });
  return randNum;
};

const startCreating = async () => {
  // Male Vampire Creation
  genderStr = "male";
  let editionCount = startEditionFrom;
  while (editionCount <= endEditionAt) {
    let rarity = getRarity(editionCount);
    let newDna = createDna(layers, rarity);

    if (isDnaUnique(dnaList, newDna)) {
      let results = constructLayerToDna(newDna, layers, rarity);
      let loadedElements = []; //promise array

      results.forEach((layer) => {
        loadedElements.push(loadLayerImg(layer));
      });

      await Promise.all(loadedElements).then((elementArray) => {
        ctx.clearRect(0, 0, width, height);
        drawBackground();
        elementArray.forEach((element) => {
          drawElement(element);
        });
      });
      const res = await addMetadata(newDna, editionCount, rarity);

      dnaList.push(newDna);
      editionCount++;
    } else {
      console.log("DNA exists!");
    }
  }

  // Female Vampire Creation:
  genderStr = "female";
  let editionCountFemale = startEditionFrom_female;
  while (editionCountFemale <= endEditionAt_female) {
    let rarity = getRarity(editionCountFemale);
    let newDna = createDna(layers_female, rarity);

    if (isDnaUnique(dnaListFemale, newDna)) {
      let results = constructLayerToDna(newDna, layers_female, rarity);
      let loadedElements = []; //promise array

      results.forEach((layer) => {
        loadedElements.push(loadLayerImg(layer));
      });

      await Promise.all(loadedElements).then((elementArray) => {
        ctx.clearRect(0, 0, width, height);
        drawBackground();
        elementArray.forEach((element) => {
          drawElement(element);
        });
      });
      const res = await addMetadata(newDna, editionCount, rarity);

      dnaListFemale.push(newDna);
      editionCountFemale++;
      editionCount++;
    } else {
      console.log("DNA exists!");
    }
  }
  shuffleAll();
  await saveAll();

  writeAllMetaData();
};

startCreating();
