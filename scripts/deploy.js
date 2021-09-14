
const hre = require("hardhat");

async function main() {

  let baseURI = "https://ipfs.io/ipfs/QmPC9U8XwumsRqYdF9ad8CJAHWPq7GSiEjTPNmnrW2P6XX";
  let member1 = "0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB";
  let member2 = "0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75";
  const ChainedVampires = await hre.ethers.getContractFactory("ChainedVampires");
  const chainedvampires = await ChainedVampires.deploy(baseURI, member1, member2);

  await chainedvampires.deployed();

  console.log("ChainedVampires deployed to:", chainedvampires.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
