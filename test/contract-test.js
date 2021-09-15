const { assert } = require("chai");
const { ethers } = require("hardhat");
const metadataFile = require('../demo-metadata.json'); //with path


describe("Chained Vampires contract", function () {
    let contract;
    let Contract;
    let owner;
    let baseUri = "https://ipfs.io/ipfs/";

    describe("Minting tests", function () {
        beforeEach(async () => {
            contract = await ethers.getContractFactory("ChainedVampires");
            [owner] = await ethers.getSigners();
            Contract = await contract.deploy(baseUri);
        });

        it("should set given tokenURI", async () => {
            addr1 = await ethers.getSigner(1);

            // setUri
            const tokenId = await Contract.getCurrentTokenId();
            const id = ethers.BigNumber.from(tokenId.toString());
            console.log(id);

            const tokenURI = metadataFile[tokenId];
            const uri = tokenURI.toString();
            console.log(uri);

            await Contract.connect(addr1).summonVampire(1, uri, { value: ethers.utils.parseEther("0.2") });

            const uriBefore = await Contract.tokenURI(id);
            await Contract.connect(owner).setTokenURI(id, uri);
            const uriAfter = await Contract.tokenURI(id);

            console.log({
                before: uriBefore,
                after: uriAfter
            })

        });

    //     it("should be able to mint nfts", async () => {
    //         let deployerBalanceBefore = await Contract.balanceOf(owner.address);
    //         await Contract.summonVampire(1, { value: ethers.utils.parseEther("1.0") });
    //         let deployerBalanceAfter = await Contract.balanceOf(owner.address);
    //         console.log({
    //             before: deployerBalanceBefore,
    //             after: deployerBalanceAfter
    //         })
    //     });

    //     it("another account should be able to mint nfts", async () => {
    //         addr1 = await ethers.getSigner(1);
    //         let deployerBalanceBefore = await Contract.balanceOf(addr1.address);
    //         await Contract.connect(addr1).summonVampire(1, { value: ethers.utils.parseEther("1.0") });
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


    // describe("Constructor tests", function() {
    //  before(async () => {
    //       contract = await ethers.getContractFactory("ChainedVampires");
    //       [owner] = await ethers.getSigners();
    //       Contract = await contract.deploy(baseUri);
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



    // describe("Tokenomics tests", function () {
    //     beforeEach(async () => {
    //         contract = await ethers.getContractFactory("ChainedVampires");
    //         [owner] = await ethers.getSigners();
    //         Contract = await contract.deploy(baseUri, admin1, admin2);
    //     });

    //     // it("the contract should collect %90 of minting fees", async() => {

    //     // })

    //     it("shouldn't allow infinite claiming of rewards", async () => {
    //         addr1 = await ethers.getSigner(1);
    //         await Contract.connect(addr1).summonVampire(1, { value: ethers.utils.parseEther("1.0") });
    //         let balanceAfterMint = await ethers.provider.getBalance(addr1.address);
    //         // get Minted tokenId for addr1:
    //         let addr1TokenID = await Contract.getAssetsOfWallet(addr1.address);
    //         console.log(ethers.BigNumber.from(addr1TokenID.toString()));

    //         //addr2 is minting
    //         addr2 = await ethers.getSigner(2);
    //         await Contract.connect(addr2).summonVampire(19, { value: ethers.utils.parseEther("50.0") });

    //         let reward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
    //         //addr1 claiming
    //         await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
    //         let claimed1 = await ethers.provider.getBalance(addr1.address);
    //         let rewardAfterClaim = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));

    //         //addr1 claiming again
    //         // should revert because there should be no reward left to claim
    //         try {
    //             await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
    //         } catch (error) {
    //             err = error
    //         }
    //         assert.ok(err instanceof Error);

    //         // check balances
    //         let claimed2 = await ethers.provider.getBalance(addr1.address);
    //         let rewardAfterClaim2 = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));

    //         assert.equal(ethers.utils.formatEther(rewardAfterClaim), ethers.utils.formatEther(rewardAfterClaim2), "Consequtive claims should not increase minter balance!");

    //         console.log({
    //             initial: ethers.utils.formatEther(balanceAfterMint),
    //             reward: ethers.utils.formatEther(reward),
    //             firstClaim: ethers.utils.formatEther(claimed1),
    //             rewardAfterClaim: ethers.utils.formatEther(rewardAfterClaim),
    //             secondClaim: ethers.utils.formatEther(claimed2),
    //             rewardAfterClaim2: ethers.utils.formatEther(rewardAfterClaim2)
    //         });
    //     });

    //     it("should distribute minting fees among holders", async () => {
    //         addr1 = await ethers.getSigner(1); 
    //         let initialEthBalance = await ethers.provider.getBalance(addr1.address);    // ETH balance of addr1 before it mints an NFT
    //         await Contract.connect(addr1).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
    //         let balanceAfterMint = await ethers.provider.getBalance(addr1.address);
    //         // get Minted tokenId for addr1:
    //         let addr1TokenID = await Contract.getAssetsOfWallet(addr1.address);
    //         console.log(ethers.BigNumber.from(addr1TokenID.toString()));

    //         //addr2 is minting
    //         addr2 = await ethers.getSigner(2); 
    //         await Contract.connect(addr2).summonVampire(19, {value: ethers.utils.parseEther("50.0")});

    //         await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
    //         let lastBalance1 = await ethers.provider.getBalance(addr1.address);

    //         assert.isAbove(lastBalance1, balanceAfterMint);

    //         console.log({
    //             initial: ethers.utils.formatEther(initialEthBalance),
    //             afterMint: ethers.utils.formatEther(balanceAfterMint),
    //             last: ethers.utils.formatEther(lastBalance1)
    //         });

    //         // Continue earning that passive income boy!
    //         addr3 = await ethers.getSigner(3); 
    //         await Contract.connect(addr3).summonVampire(20, {value: ethers.utils.parseEther("50.0")});  
    //         let currentReward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
    //         console.log("After addr3: " + currentReward.toString());

    //         addr4 = await ethers.getSigner(4); 
    //         await Contract.connect(addr4).summonVampire(20, {value: ethers.utils.parseEther("50.0")});   
    //         currentReward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
    //         console.log("After addr4: " + currentReward.toString());

    //         await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
    //         let lastBalance2 = await ethers.provider.getBalance(addr1.address);

    //         assert.isAbove(lastBalance2, balanceAfterMint);
    //         assert.isAbove(lastBalance2, lastBalance1);

    //         console.log({
    //             initial: ethers.utils.formatEther(initialEthBalance),
    //             afterMint: ethers.utils.formatEther(balanceAfterMint),
    //             last1claimed: ethers.utils.formatEther(lastBalance1),
    //             last2claimed: ethers.utils.formatEther(lastBalance2)
    //         });

    //         // Also check the NFT balances to ensure everything worked fine
    //         let ownerNFTCount = await Contract.balanceOf(owner.address);
    //         let addr1NFTCount = await Contract.balanceOf(addr1.address); 
    //         let addr2NFTCount = await Contract.balanceOf(addr2.address); 
    //         let addr3NFTCount = await Contract.balanceOf(addr3.address); 
    //         let addr4NFTCount = await Contract.balanceOf(addr4.address); 
    //         console.log({
    //             owner: ownerNFTCount,
    //             addr1: addr1NFTCount,
    //             addr2: addr2NFTCount,
    //             addr3: addr3NFTCount,
    //             addr4: addr4NFTCount
    //         });
    //     });


     });

});
