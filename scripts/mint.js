const metadataFile = require('../demo-metadata.json'); //with path
const { ethers } = require("hardhat");

const friends = [
  "0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB",  // also the deployer address - contract Owner
  "0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75",  // Account-2 on Mozilla
  "0x46977CAceD60610ee6a5444d428aC2B11F24c099",  // Account-3 on Mozilla
  "0xE724756FF4CE329630d6bf3Fb6e3F258ED41D420",  // Account-4 on Mozilla
  "0x8Fbbe7B6741e3E9Ab7C8545f42Fa0830A8A4C9D8"   // Account-5 on Mozilla
];

const existingContractAddr = "0x684C5474c803389DEaec00f014d8D9F4540166F0";
let uriIdx = 0;

async function main() {
  const chainedVampiresContract = await hre.ethers.getContractAt("ChainedVampires", existingContractAddr);
  const owner = await ethers.provider.getSigner("0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB");
  //const signer0 = await ethers.provider.getSigner(friends[2]);

  await chainedVampiresContract.connect(owner).summonVampire(1, { value: ethers.utils.parseEther("0.2") });

  let currId = await chainedVampiresContract.connect(owner).getCurrentTokenId();
  console.log(currId.toString());
  let intID = parseInt(currId) - 1;
  console.log("Int ID: " + intID.toString());
  let uri = await chainedVampiresContract.connect(owner).tokenURI(ethers.BigNumber.from(intID.toString()));
  
  console.log("Minting is complete with URI:" + uri.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
