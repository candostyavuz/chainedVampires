
const hre = require("hardhat");

async function main() {

  let baseURI = "https://ipfs.io/ipfs/";

  const ChainedVampires = await hre.ethers.getContractFactory("ChainedVampires");
  const chainedvampires = await ChainedVampires.deploy(baseURI);

  await chainedvampires.deployed();

  console.log("ChainedVampires deployed to:", chainedvampires.address);
  // ChainedVampires deployed to: 0x511ea2C1098e2c578e3b861456ac9d949e0753f8
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
