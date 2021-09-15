require("dotenv").config();
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getImageCidLink, loadToIpfs, testPinataConnection, cidToPinata } = require("./upload.js");
const {
  layers,
  width,
  height,
  description,
  baseImageUri,
  startEditionFrom,
  endEditionAt,
  rarityWeights,
} = require("./config.js");
const console = require("console");
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
var dnaList = [];
const enableIPFS = true;

const saveImage = async (_editionCount) => {
  let imgLink = `./generative-art/output/${_editionCount}.png`;
  fs.writeFileSync(
    imgLink,
    canvas.toBuffer("image/png")
  );
  let cidLink;
  console.log("here");
  if (enableIPFS) {
    cidLink = await (getImageCidLink(canvas.toBuffer("image/png")));
  } else {
    cidLink = baseImageUri;
  }
  console.log("out");
  console.log("Image is uploaded to IPFS with CID: " + cidLink.toString());
  return cidLink;
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, 85%)`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = genColor();
  ctx.fillRect(0, 0, width, height);
};

const addMetadata = async (_dna, _edition, _rarity, _cidLink) => {
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

  attributesList.push(
    {
      "display_type": "date",
      "trait_type": "Birthday",
      "value": dateTime
    });
  attributesList.push(
    {
      "trait_type": "rarity",
      "value": _rarity
    });
  attributesList.push(
    {
      "trait_type": "DNA",
      "value": _dna.map(String)
    });
  attributesList.push(
    {
      "display_type": "number",
      "trait_type": "Identity Number",
      "value": _edition
    });
  let tempMetadata = {
    description: description,
    external_url: "https://chainedvampires.com",
    name: `${clanString} #${_edition}`,
    image: _cidLink,
    attributes: attributesList,
  };
  writeMetaData(tempMetadata, _edition);
  await testPinataConnection();
  let ipfsCid = await (loadToIpfs(JSON.stringify(tempMetadata)));
  console.log(ipfsCid);
  let pinataCid = await (cidToPinata(ipfsCid.path, tempMetadata));
  metadataList.push(pinataCid.toString());
  attributesList = [];
};

const writeMetaData = (_data, _edition) => {
  fs.writeFileSync(`./generative-art/output/${_edition}.json`, JSON.stringify(_data));
};

const writeAllMetaData = (_data) => {
  fs.writeFileSync("./generative-art/output/_allmetadata.json", _data);
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
  rarityWeights.forEach((rarityWeight) => {
    if (
      _editionCount >= rarityWeight.from &&
      _editionCount <= rarityWeight.to
    ) {
      rarity = rarityWeight.value;
    }
  });
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
  await testPinataConnection();
  writeAllMetaData("");
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
      // signImage(`#${editionCount}`);
      let cidLink = await saveImage(editionCount);
      const res = await addMetadata(newDna, editionCount, rarity, cidLink);

      dnaList.push(newDna);
      editionCount++;
    } else {
      console.log("DNA exists!");
    }
  }
  writeAllMetaData(JSON.stringify(metadataList));
};

startCreating();
