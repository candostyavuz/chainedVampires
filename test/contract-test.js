const { assert } = require("chai");
const { ethers } = require("hardhat");
const metadataFile = require('../demo-metadata.json'); //with path


describe("Chained Vampires contract", function () {
    let contract;
    let Contract;
    let owner;
    let baseUri = "https://ipfs.io/ipfs/";

    let tokenId;
    let id;
    let tokenURI;
    let uri;


    describe("Minting tests", function () {
        beforeEach(async () => {
            contract = await ethers.getContractFactory("ChainedVampires");
            [owner] = await ethers.getSigners();
            Contract = await contract.deploy(baseUri);
             // setUri
            tokenId = await Contract.getCurrentTokenId();
            id = ethers.BigNumber.from(tokenId.toString());
            tokenURI = metadataFile[tokenId];
            uri = tokenURI.toString();
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

        it("should be able to mint nfts", async () => {
            let minterBalanceBefore = await Contract.balanceOf(owner.address);
            await Contract.summonVampire(1, uri, { value: ethers.utils.parseEther("0.2") });
            let minterBalanceAfter = await Contract.balanceOf(owner.address);
            console.log({
                before: minterBalanceBefore,
                after: minterBalanceAfter
            })
        });

        it("another account should be able to mint nfts", async () => {
            addr1 = await ethers.getSigner(1);

            let minterBalanceBefore = await Contract.balanceOf(addr1.address);
            await Contract.connect(addr1).summonVampire(1, uri, { value: ethers.utils.parseEther("0.2") });
            let minterBalanceAfter = await Contract.balanceOf(addr1.address);
            console.log({
                before: minterBalanceBefore,
                after: minterBalanceAfter
            })
        });

        it("shouldn't allow minting after MAX_VAMPIRES count reached", async () => {

            let currId ;
            let currUri;
            let max = await Contract.MAX_VAMPIRES();

            for (let i = 0; i < parseInt(max); i++) {
                currId = await Contract.getCurrentTokenId();
                currUri = (metadataFile[currId]).toString();
                await Contract.summonVampire(1, currUri, { value: ethers.utils.parseEther("0.2") });
            }
            console.log((await Contract.getCurrentTokenId()).toString());
            currId = await Contract.getCurrentTokenId();
            assert.equal(currId.toString(), parseInt(max).toString(), "Remaining supply must be equal to zero");

            try {
                await Contract.summonVampire(1, currUri, { value: ethers.utils.parseEther("1.0") });
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
            // setUri
            tokenId = await Contract.getCurrentTokenId();
            id = ethers.BigNumber.from(tokenId.toString());
            tokenURI = metadataFile[tokenId];
            uri = tokenURI.toString();
        });

        it("should distribute minting fees among holders", async () => {

            let currId = await Contract.getCurrentTokenId();
            let currUri = (metadataFile[currId]).toString();

            let addr1 = await ethers.getSigner(1); 
            let initialEthBalance = await ethers.provider.getBalance(addr1.address);    // ETH balance of addr1 before it mints an NFT
            // addr1 mints only 1 NFT:
            await Contract.connect(addr1).summonVampire(1, currUri, {value: ethers.utils.parseEther("1.0")});
            let balanceAfterMint = await ethers.provider.getBalance(addr1.address);
            // get Minted tokenId for addr1:
            let addr1TokenID = await Contract.getAssetsOfWallet(addr1.address);
            console.log(ethers.BigNumber.from(addr1TokenID.toString()));

            //addr2 is minting 19 editions!
            let addr2 = await ethers.getSigner(2); 

            for(let i = 0 ; i < 20; i++) {
                currId = await Contract.getCurrentTokenId();
                currUri = (metadataFile[currId]).toString();
                await Contract.connect(addr2).summonVampire(1, currUri, {value: ethers.utils.parseEther("1.0")});
            }

            // add1 claims her rewards!
            await Contract.connect(addr1).claimReward(ethers.BigNumber.from(addr1TokenID.toString()));
            let lastBalance1 = await ethers.provider.getBalance(addr1.address);

            assert.isAbove(lastBalance1, balanceAfterMint);

            console.log({
                initial: ethers.utils.formatEther(initialEthBalance),
                afterMint: ethers.utils.formatEther(balanceAfterMint),
                last: ethers.utils.formatEther(lastBalance1)
            });

            // Continue earning that passive income boy!

            // addr3 comes in
            addr3 = await ethers.getSigner(3); 

            for(let i = 0 ; i < 10; i++) {
                currId = await Contract.getCurrentTokenId();
                currUri = (metadataFile[currId]).toString();
                await Contract.connect(addr3).summonVampire(1, currUri, {value: ethers.utils.parseEther("1.0")});
            }
            // check current reward of addr1 minter
            let currentAddr1Reward = await Contract.connect(addr1).getEarnedAmount(ethers.BigNumber.from(addr1TokenID.toString()));
            console.log("After addr3: " + ethers.utils.formatEther(currentAddr1Reward).toString());

            // addr4 comes in
            addr4 = await ethers.getSigner(4); 

            for(let i = 0 ; i < 10; i++) {
                currId = await Contract.getCurrentTokenId();
                currUri = (metadataFile[currId]).toString();
                await Contract.connect(addr4).summonVampire(1, currUri, {value: ethers.utils.parseEther("1.0")});
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
            let currId = await Contract.getCurrentTokenId();
            let currUri = (metadataFile[currId]).toString();

            addr1 = await ethers.getSigner(1);
            await Contract.connect(addr1).summonVampire(1, currUri, { value: ethers.utils.parseEther("1.0") });
            let balanceAfterMint = await ethers.provider.getBalance(addr1.address);
            // get Minted tokenId for addr1:
            let addr1TokenID = await Contract.getAssetsOfWallet(addr1.address);
            console.log(ethers.BigNumber.from(addr1TokenID.toString()));

             //addr2 is minting 19 editions!
             addr2 = await ethers.getSigner(2); 

             for(let i = 0 ; i < 20; i++) {
                 currId = await Contract.getCurrentTokenId();
                 currUri = (metadataFile[currId]).toString();
                 await Contract.connect(addr2).summonVampire(1, currUri, {value: ethers.utils.parseEther("1.0")});
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
