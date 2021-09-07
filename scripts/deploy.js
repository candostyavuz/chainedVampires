
const hre = require("hardhat");

async function main() {

  const ChainedVampires = await hre.ethers.getContractFactory("ChainedVampires");
  const chainedvampires = await ChainedVampires.deploy();

  await chainedvampires.deployed();

  console.log("ChainedVampires deployed to:", chainedvampires.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
