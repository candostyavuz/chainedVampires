const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("Chained Vampires contract", function () {
    let contract;
    let Contract;
    let owner;
    let baseUri = "ipfs://QmPreJGWmxLj54uvPm7fuNH12ENCjKvUs6m2o2YwtN46oj/"; // don't ever putting forget backslash at the end

    let tokenId;
    let id;
    let uri;

    describe("Minting tests", function () {
        beforeEach(async () => {
            contract = await ethers.getContractFactory("ChainedVampires");
            [owner] = await ethers.getSigners();
            Contract = await contract.deploy(baseUri);
        });

        it("should console log uri", async () => {
            let baseuri = await Contract.baseURI();
            console.log(baseuri);
        });

        it("should be able to mint nfts", async () => {
            let minterBalanceBefore = await Contract.balanceOf(owner.address);
            await Contract.summonVampire(1, { value: ethers.utils.parseEther("0.2") });
            let minterBalanceAfter = await Contract.balanceOf(owner.address);
            console.log({
                before: minterBalanceBefore,
                after: minterBalanceAfter
            })
        });

        it("another account should be able to mint nfts", async () => {
            addr1 = await ethers.getSigner(1);

            let minterBalanceBefore = await Contract.balanceOf(addr1.address);
            await Contract.connect(addr1).summonVampire(1, { value: ethers.utils.parseEther("0.2") });
            let minterBalanceAfter = await Contract.balanceOf(addr1.address);
            console.log({
                before: minterBalanceBefore,
                after: minterBalanceAfter
            })
        });

        it("shouldn't allow minting after MAX_VAMPIRES count reached", async () => {

            let currId ;
            let max = await Contract.MAX_VAMPIRES();

            for (let i = 0; i < parseInt(max); i++) {
                currId = await Contract.getCurrentTokenId();
                await Contract.summonVampire(1, { value: ethers.utils.parseEther("0.2") });
            }
            console.log((await Contract.getCurrentTokenId()).toString());
            currId = await Contract.getCurrentTokenId();
            assert.equal(currId.toString(), parseInt(max).toString(), "Remaining supply must be equal to zero");

            try {
                await Contract.summonVampire(1, { value: ethers.utils.parseEther("1.0") });
            } catch (error) {
                err = error
            }
            assert.ok(err instanceof Error, "Shouldn't allow this try block to work!");
        });

    }); // end of minting tests

    describe("Tokenomics tests", function () {
        beforeEach(async () => {
            contract = await ethers.getContractFactory("ChainedVampires");
            [owner] = await ethers.getSigners();
            Contract = await contract.deploy(baseUri);
        });

        it("should distribute minting fees among holders", async () => {
            // FIRST MINTER IS ADDR-1:
            let addr1 = await ethers.getSigner(1); 
            let initialEthBalance = await ethers.provider.getBalance(addr1.address);    // ETH balance of addr1 before it mints an NFT
            // addr1 mints only 1 NFT:
            await Contract.connect(addr1).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
            let balanceAfterMint = await ethers.provider.getBalance(addr1.address);
            // get Minted tokenId for addr1:
            let addr1TokenID = await Contract.walletOfOwner(addr1.address);
            console.log(ethers.BigNumber.from(addr1TokenID.toString()));

            // ADDR-2 IS MINTING 19 NFTS,
            // WHICH SHOULD PAYS 10% TO ADDR1:
            let addr2 = await ethers.getSigner(2); 
            for(let i = 0 ; i < 2; i++) {
                await Contract.connect(addr2).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
            }

            // ADDR-1 CLAIMS HIS REWARDS!
            await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
            let lastBalance1 = await ethers.provider.getBalance(addr1.address);

            assert.isAbove(lastBalance1, balanceAfterMint);

            console.log({
                afterMintBalance: ethers.utils.formatEther(balanceAfterMint),
                claimedBalance: ethers.utils.formatEther(lastBalance1)
            });

            // Continue earning that passive income!

            // addr3 comes in
            let addr3 = await ethers.getSigner(3); 

            for(let i = 0 ; i < 5; i++) {
                await Contract.connect(addr3).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
            }
            // check current reward of addr1 minter
            let currentAddr1Reward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
            console.log("After addr3: " + ethers.utils.formatEther(currentAddr1Reward).toString());

            // addr4 comes in
            let addr4 = await ethers.getSigner(4); 

            for(let i = 0 ; i < 5; i++) {
                await Contract.connect(addr4).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
            }
            // check current reward of addr1 minter
            currentAddr1Reward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
            console.log("After addr4: " + ethers.utils.formatEther(currentAddr1Reward).toString());

            // addr1 finaly claims her rewards!
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

            // Also check the NFT balances to ensure everything worked fine
            let ownerNFTCount = await Contract.balanceOf(owner.address);
            let addr1NFTCount = await Contract.balanceOf(addr1.address); 
            let addr2NFTCount = await Contract.balanceOf(addr2.address); 
            let addr3NFTCount = await Contract.balanceOf(addr3.address); 
            let addr4NFTCount = await Contract.balanceOf(addr4.address); 
            console.log({
                owner: ownerNFTCount.toString(),
                addr1: addr1NFTCount.toString(),
                addr2: addr2NFTCount.toString(),
                addr3: addr3NFTCount.toString(),
                addr4: addr4NFTCount.toString(),
            });
        });

        it("shouldn't allow infinite claiming of rewards", async () => {
            addr1 = await ethers.getSigner(1);
            await Contract.connect(addr1).summonVampire(1, { value: ethers.utils.parseEther("1.0") });
            let balanceAfterMint = await ethers.provider.getBalance(addr1.address);
            // get Minted tokenId for addr1:
            let addr1TokenID = await Contract.walletOfOwner(addr1.address);
            console.log(ethers.BigNumber.from(addr1TokenID.toString()));

             //addr2 is minting 19 editions!
             addr2 = await ethers.getSigner(2); 

             for(let i = 0 ; i < 20; i++) {
                 await Contract.connect(addr2).summonVampire(1, {value: ethers.utils.parseEther("1.0")});
             }
            // addr1 claiming
            let reward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
            await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
            let claimed1 = await ethers.provider.getBalance(addr1.address);
            let rewardAfterClaim = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));

            //addr1 claiming again
            // should revert because there should be no reward left to claim
            try {
                await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
            } catch (error) {
                err = error
            }
            assert.ok(err instanceof Error);

            // check balances
            let claimed2 = await ethers.provider.getBalance(addr1.address);
            let rewardAfterClaim2 = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));

            assert.equal(ethers.utils.formatEther(rewardAfterClaim), ethers.utils.formatEther(rewardAfterClaim2), "Consequtive claims should not increase minter balance!");

            console.log({
                initial: ethers.utils.formatEther(balanceAfterMint),
                reward: ethers.utils.formatEther(reward),
                firstClaim: ethers.utils.formatEther(claimed1),
                rewardAfterClaim: ethers.utils.formatEther(rewardAfterClaim),
                secondClaim: ethers.utils.formatEther(claimed2),
                rewardAfterClaim2: ethers.utils.formatEther(rewardAfterClaim2)
            });

        });
     }); // end of tokenomics tests
}); // end of Unit Tests
