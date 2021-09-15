require("dotenv").config();
const { create } = require("ipfs-http-client");
const ipfs = create("/ip4/127.0.0.1/tcp/5001");
// const ipfs = create("https://ipfs.infura.io:5001");
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET_KEY);
let pinataIdCnt = 1;

async function getImageCidLink(buffer) {
    const result = await ipfs.add((buffer));
    // return `https://gateway.ipfs.io/ipfs/${result.path}`;
    return `https://ipfs.io/ipfs/${result.path}`;
}

async function loadToIpfs(metadata) {
  const result = await ipfs.add(metadata);
  return result;
}

async function testPinataConnection(){
  await pinata.testAuthentication().then((result) => {
    console.log("Pinata connection is successfully extablished with authenticated property equal to: " + (result.authenticated).toString());
  }).catch((err) => {
    console.log(err);
  });
}

async function cidToPinata(cid, tempMetadata){
  const options = {
    pinataMetadata: {
        name: tempMetadata.name,
        keyvalues: {
            pinataId: pinataIdCnt
        }
    },
    pinataOptions: {
        cidVersion: 0
    }
};
  let pinataURI;
  await pinata.pinByHash(cid, options).then((result) => {
      console.log("pinByHash is successfull with ipfsHash: " + result.ipfsHash.toString());
      pinataIdCnt++;
      pinataURI = result.ipfsHash.toString()
  }).catch((err) => {
      console.log(err);
  });

  return pinataURI;
}

module.exports = {
  getImageCidLink,
  loadToIpfs,
  testPinataConnection,
  cidToPinata
}
