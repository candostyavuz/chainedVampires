const { assert } = require("chai");
const { ethers } = require("hardhat");
describe("Chained Vampires contract", function () {

    let contract;
    let Contract;
    let owner;
    let baseUri = "ipfs://";
    const admin1 = "0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB"; // Mozilla-1, this is also the Owner
    const admin2 = "0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75"; // Mozilla-2

    describe("Tokenomics tests", function () {
        beforeEach(async () => {
            contract = await ethers.getContractFactory("ChainedVampires");
            [owner] = await ethers.getSigners();
            Contract = await contract.deploy(baseUri, admin1, admin2);
        });

        it("should distribute minting fees among holders", async () => {
            addr1 = await ethers.getSigner(1); 
            let initialEthBalance = await ethers.provider.getBalance(addr1.address);    // ETH balance of addr1 before it mints an NFT
            await Contract.connect(addr1).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
            let balanceAfterMint = await ethers.provider.getBalance(addr1.address);
            // get Minted tokenId for addr1:
            let addr1TokenID = await Contract.getAssetsOfWallet(addr1.address);
            let id = parseInt(addr1TokenID.toString());
            console.log(ethers.BigNumber.from(addr1TokenID.toString()));

            //addr2 is minting
            addr2 = await ethers.getSigner(2); 
            await Contract.connect(addr2).summonVampire(1, {value: ethers.utils.parseEther("1.0")});

            await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
            let lastBalance1 = await ethers.provider.getBalance(addr1.address);

            assert.isAbove(lastBalance1, balanceAfterMint);

            console.log({
                initial: ethers.utils.formatEther(initialEthBalance),
                afterMint: ethers.utils.formatEther(balanceAfterMint),
                last: ethers.utils.formatEther(lastBalance1)
            });

            // Continue earning that passive income boy!
            addr3 = await ethers.getSigner(3); 
            await Contract.connect(addr3).summonVampire(1, {value: ethers.utils.parseEther("1.0")});  
            let currentReward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
            console.log("After addr3: " + currentReward.toString());

            addr4 = await ethers.getSigner(4); 
            await Contract.connect(addr4).summonVampire(1, {value: ethers.utils.parseEther("1.0")});   
            currentReward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
            console.log("After addr4: " + currentReward.toString());

            await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
            let lastBalance2 = await ethers.provider.getBalance(addr1.address);

            assert.isAbove(lastBalance2, balanceAfterMint);
            assert.isAbove(lastBalance2, lastBalance1);

            console.log({
                initial: ethers.utils.formatEther(initialEthBalance),
                afterMint: ethers.utils.formatEther(balanceAfterMint),
                last1claimed: ethers.utils.formatEther(lastBalance1),
                last2claimed: ethers.utils.formatEther(lastBalance2)
            });

        });

    });

    // describe("Constructor tests", function() {
    //  before(async () => {
    //       contract = await ethers.getContractFactory("ChainedVampires");
    //       [owner] = await ethers.getSigners();
    //       Contract = await contract.deploy(baseUri, admin1, admin2);
    //  });

    //     it("should set saleActive to true", async () => {
    //         let saleStatus = await Contract.isSaleActive();
    //         assert.equal(saleStatus, true, "saleActive must be set to true");
    //     });

    //     it("should set base token URI", async () => {
    //         let uri = await Contract.baseTokenURI();
    //         assert.equal(uri, baseUri, "baseUri is set");
    //     })

    //     it("should set fee collector address", async () => {
    //         let collector = await Contract.getFeeCollector();
    //         console.log(collector);
    //         assert.equal(collector, owner.address, "owner must be the feeCollector");
    //     })

    //     it("should summon vampires for admin1, admin2 and deployer", async () => {
    //         let deployerBalanceBefore = await Contract.balanceOf(owner.address);
    //         let admin1BalanceBefore = await Contract.balanceOf(admin1);
    //         let admin2BalanceBefore = await Contract.balanceOf(admin2);
    //         assert.equal(ethers.utils.formatEther(admin1BalanceBefore), ethers.utils.formatEther(1), "Admin-1 must have 1 nft");
    //         assert.equal(ethers.utils.formatEther(admin2BalanceBefore), ethers.utils.formatEther(1), "Admin-2 must have 1 nft");
    //         assert.equal(ethers.utils.formatEther(deployerBalanceBefore), ethers.utils.formatEther(1), "Owner must have 1 nft");
    //     });
    // });

    // describe("Minting tests", function () {
    //     beforeEach(async () => {
    //         contract = await ethers.getContractFactory("ChainedVampires");
    //         [owner] = await ethers.getSigners();
    //         Contract = await contract.deploy(baseUri, admin1, admin2);
    //     });
    //     it("should be able to mint nfts", async() => {
    //         let deployerBalanceBefore = await Contract.balanceOf(owner.address);
    //         await Contract.summonVampire(1, {value: ethers.utils.parseEther("1.0")});
    //         let deployerBalanceAfter = await Contract.balanceOf(owner.address);
    //         console.log({
    //             before: deployerBalanceBefore,
    //             after: deployerBalanceAfter
    //         })
    //     });

    //     it("another account should be able to mint nfts", async() => {
    //         addr1 = await ethers.getSigner(1);
    //         let deployerBalanceBefore = await Contract.balanceOf(addr1.address);
    //         await Contract.connect(addr1).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
    //         let deployerBalanceAfter = await Contract.balanceOf(addr1.address);
    //         console.log({
    //             before: deployerBalanceBefore,
    //             after: deployerBalanceAfter
    //         })
    //     });

    //     it("shouldn't allow minting after MAX_VAMPIRES count reached", async () => {
    //         let cnt = await Contract.getRemainingSupply();
    //         console.log(cnt);
    //         for (let i = 0; i < cnt; i++) {
    //             await Contract.summonVampire(1, { value: ethers.utils.parseEther("1.0") });
    //         }
    //         console.log((await Contract.getRemainingSupply()).toString());
    //         assert.equal(await Contract.getRemainingSupply(), 0, "Remaining supply must be equal to zero");

    //         try {
    //             await Contract.summonVampire(1, { value: ethers.utils.parseEther("1.0") });
    //         } catch (error) {
    //             err = error
    //         }
    //         assert.ok(err instanceof Error);
    //     });
    // });


});
