
const hre = require("hardhat");

async function main() {

  let admin = "0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75";
  let baseURI = "ipfs://QmYdiBATiBFoLA6gmnn2RzzmRomm6L4qg6SBzftzsC9uZd/";

  const ChainedVampires = await hre.ethers.getContractFactory("ChainedVampires");
  const chainedvampires = await ChainedVampires.deploy(baseURI, admin);

  await chainedvampires.deployed();

  console.log("ChainedVampires deployed to:", chainedvampires.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
