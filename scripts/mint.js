const friends = [
    "0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB",
    "0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75"
];

const existingContractAddr = "0x686D8847774203BaFB9E2Dc970D301bA1734c952";

async function main() {
  const nft = await hre.ethers.getContractAt("ChainedVampires", existingContractAddr);

  const signer0 = await ethers.provider.getSigner(0);
  const nonce = await signer0.getTransactionCount();
  for(let i = 0; i < friends.length; i++) {
    const tokenURI = "ipfs://ipfs/QmYndekagu1tRbbPcxop1BhWz9BJ2kUgnXUEJbFu7G3ESE";
    await nft.mintVampire(friends[i], tokenURI,  {
      nonce: nonce + i
    });
  }

  console.log("Minting is complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
