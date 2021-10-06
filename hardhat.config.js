require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

module.exports = {
  solidity: "0.8.2",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.PRIVATE_KEY]
      // timeout: 120000
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
};
