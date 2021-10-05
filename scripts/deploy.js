
const hre = require("hardhat");

async function main() {

  let baseURI = "ipfs://QmZZ5vJ8f2TeMaicR7By4SJBWAVtj5cpoR8F6NsV5aotBz/";

  const ChainedVampires = await hre.ethers.getContractFactory("ChainedVampires");
  const chainedvampires = await ChainedVampires.deploy(baseURI);

  await chainedvampires.deployed();

  console.log("ChainedVampires deployed to:", chainedvampires.address);
  // ChainedVampires deployed to: 0x684C5474c803389DEaec00f014d8D9F4540166F0
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
