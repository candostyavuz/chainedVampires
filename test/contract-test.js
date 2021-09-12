const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("Chained Vampires contract", function () {

    let contract;
    let Contract;
    let owner;
    let baseUri = "ipfs://";
    const admin1 = "0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB"; // Mozilla-1, this is also the Owner
    const admin2 = "0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75"; // Mozilla-2

    before(async () => {
        contract = await ethers.getContractFactory("ChainedVampires");
        [owner] = await ethers.getSigners();
        Contract = await contract.deploy(baseUri, admin1, admin2);
    });

    describe("Minting tests", function () {

        // it("should be able to mint nfts", async() => {
        //     let deployerBalanceBefore = await Contract.balanceOf(owner.address);
        //     await Contract.summonVampire(1, {value: ethers.utils.parseEther("1.0")});
        //     let deployerBalanceAfter = await Contract.balanceOf(owner.address);
        //     console.log({
        //         before: deployerBalanceBefore,
        //         after: deployerBalanceAfter
        //     })
        // });

        it("shouldn't allow minting after MAX_VAMPIRES count reached", async () => {
            let cnt = await Contract.getRemainingSupply();
            console.log(cnt);
            for (let i = 0; i < cnt; i++) {
                await Contract.summonVampire(1, { value: ethers.utils.parseEther("1.0") });
            }
            console.log((await Contract.getRemainingSupply()).toString());
            assert.equal(await Contract.getRemainingSupply(), 0, "Remaining supply must be equal to zero");

            try {
                await Contract.summonVampire(1, { value: ethers.utils.parseEther("1.0") });
            } catch (error) {
                err = error
            }
            assert.ok(err instanceof Error);
        });



    });

    // describe("Constructor tests", function() {
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



});
