// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// import "hardhat/console.sol";

contract ChainedVampires is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;    
    Counters.Counter private _tokenIdCounter;

    // Chained Vampires ERC-721 State Variables:
    uint256 public constant MAX_VAMPIRES = 9999;
    string private baseURI;
    uint256 private salePrice = 0.1 ether;

    // Tokenomic State Variables:
    uint256 public totalHolderBalance = 0; // Total profit to be distributed to nft holders
    uint256 public currentDividendPerHolder = 0; // Current dividend obtained from minting of a new NFT
    mapping(uint256 => uint256) public lastDividendAt; // tokenId to deserved profit for its owner
    mapping(uint256 => address) public minter; // tokenId to minter address

    receive() external payable {}

    constructor(string memory _baseNftURI) ERC721("ChainedVampires", "VAMP") {
        setBaseURI(_baseNftURI);  // Summon first vampire to deployer address
    }

    function summonVampire(uint256 _amount) public payable whenNotPaused {
        require(msg.value >= salePrice.mul(_amount), "Insufficient funds to fulfill the order");
        require(_amount < 21, "Can only summon maximum of 20 vampires per transaction");
        require((_tokenIdCounter.current()).add(_amount) <= MAX_VAMPIRES, "Amount exceeds remaining supply");
        for (uint256 i = 0; i < _amount; i++) {
            _safeMint(msg.sender, _tokenIdCounter.current());
            minter[_tokenIdCounter.current()] = msg.sender;
            lastDividendAt[_tokenIdCounter.current()] = currentDividendPerHolder;
            _tokenIdCounter.increment();
            distributeMintFee(salePrice);
        }
    }

    //////////////////////////////////////////////////////////////////
    /**
     * @dev TOKENOMICS FUNCTIONS
     */

    function distributeMintFee(uint256 _revenue) private {
        uint256 toHolders = _revenue.div(10); // 10% is distributed among holders
        uint256 toContract = _revenue.sub(toHolders);
        payable(address(this)).transfer(toContract);

        totalHolderBalance += toHolders; // Updatede total distributed revenue
        currentDividendPerHolder += toHolders.div(totalSupply()); // Dividend for current holders
    }

    function getEarnedAmount(uint256 _tokenId) public view returns (uint256) {
        return currentDividendPerHolder.sub(lastDividendAt[_tokenId]);
    }

    function claimReward(uint256 _tokenId) public {
        require(
            ownerOf(_tokenId) == msg.sender ||
                getApproved(_tokenId) == msg.sender,
            "Only the owner can claim rewards."
        );
        require(
            getEarnedAmount(_tokenId) != 0,
            "There is no reward to claim for this token"
        );
        uint256 rewardBalance = getEarnedAmount(_tokenId);
        payable(ownerOf(_tokenId)).transfer(rewardBalance);
        lastDividendAt[_tokenId] = currentDividendPerHolder;
    }

    /**
     * @dev Returns the total reward balance for all NFTs that caller owns
     */
    function getEarnedAmountAll() public view returns (uint256) {
        uint256 tokenCount = balanceOf(msg.sender);
        uint256 totalReward = 0;
        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i); // index is enumarated by balanceOf
            totalReward += getEarnedAmount(tokenId);
        }
        return totalReward;
    }

    function claimRewardAll() public {
        uint256 tokenCount = balanceOf(msg.sender);
        uint256 totalReward = 0;
        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i); // index is enumarated by balanceOf
            totalReward += getEarnedAmount(tokenId);
            lastDividendAt[tokenId] = currentDividendPerHolder;
        }
        payable(msg.sender).transfer(totalReward);
    }

    //////////////////////////////////////////////////////////////////
    /**
    * @dev ONLY OWNER FUNCTIONS
    */

    // ERC721URIStorage
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        _setTokenURI(tokenId, _tokenURI);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function setBaseURI(string memory _baseNftURI) public onlyOwner {
        baseURI = _baseNftURI;
    }

    //////////////////////////////////////////////////////////////////
    /**
    * @dev GETTER FUNCTIONS
    */

    function getAssetsOfWallet(address _walletAddr) public view returns (uint256[] memory)
    {
        uint256 assetCount = balanceOf(_walletAddr);

        uint256[] memory assetsId = new uint256[](assetCount);
        for (uint256 i = 0; i < assetCount; i++) {
            assetsId[i] = tokenOfOwnerByIndex(_walletAddr, i);
        }
        return assetsId;
    }

    function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(_tokenId);
    }

    function getCurrentPrice() public view returns (uint256) {
        return salePrice;
    }

    function getOriginalMinter(uint256 _tokenId) public view returns (address) {
        return minter[_tokenId];
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @notice - OPENZEPPELIN ZONE - Do Not Disturb!
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }
 
    // See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

}
