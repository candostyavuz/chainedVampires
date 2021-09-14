
const hre = require("hardhat");

async function main() {

  let baseURI = "https://ipfs.io/ipfs/QmPC9U8XwumsRqYdF9ad8CJAHWPq7GSiEjTPNmnrW2P6XX";

  const ChainedVampires = await hre.ethers.getContractFactory("ChainedVampires");
  const chainedvampires = await ChainedVampires.deploy(baseURI);
  // {maxFeePerGas: '0x' + (1000000255).toString(16)} 

  await chainedvampires.deployed();

  console.log("ChainedVampires deployed to:", chainedvampires.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
