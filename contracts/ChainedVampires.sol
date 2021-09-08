// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ChainedVampires is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    Counters.Counter private _tokenIdCounter;

    // State Variables
    uint256 public constant MAX_VAMPIRES = 9999;

    uint16[] availableVampires; 

    bool public saleActive = false;

    string private baseURI;
    uint256 private salePrice = 0.1 ether;
    address payable feeCollector;   // for marketplace

    /* Team member's wallet addresses (Current Chain: Rinkeby) 
        - Important: Double check this before launching to Avalanche
    */
    address private member1 = 0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB; // Mozilla-1, this is also the Owner
    address private member2 = 0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75; // Mozilla-2
    address private member3 = 0xfe8FD71D3e33B480930090b97DaDabd3935D836E; // Brave

    /* Contract constructor 
       - Sets base URI
       - Allocates first three vampires to team members
    */
    constructor(string memory _baseNftURI) ERC721("ChainedVampires", "VAMP") {
        setBaseURI(_baseNftURI);
        feeCollector = payable(msg.sender);
        saleActive = true;
        // Deployer and team gets the first 4 vampires (with random rarity, of course!)
        _safeMint(msg.sender, 0);
        _safeMint(member1, 1);
        _safeMint(member2, 2);
        _safeMint(member3, 3);
    }

    function summonVampire(uint256 _amount) public payable whenNotPaused {
        /* Conditions for minting */
        require(saleActive == true, "Sale is not active at the moment.");
        require(_amount < 21, "Can only summon maximum of 20 vampires per transaction");

        uint256 currentSupply = totalSupply();
        require(currentSupply <= MAX_VAMPIRES, "All vampires have already been claimed");
        require(currentSupply <= MAX_VAMPIRES.sub(_amount), "Amount exceeds remaining supply");

        salePrice = calculateCurrentPrice(currentSupply);
        require(msg.value >= salePrice.mul(_amount), "Insufficient funds to fulfill the order");
        
        // Minting allowed
        for(uint256 i = 0; i < _amount; i++){
            _tokenIdCounter.increment();
            _safeMint(msg.sender, _tokenIdCounter.current());
        }
    }

    function calculateCurrentPrice(uint256 _currentSupply) public pure returns (uint256) {
        if(_currentSupply == MAX_VAMPIRES) {
            return 66 ether;
        } else if(_currentSupply >= 9990){
            return 10 ether;
        } else if(_currentSupply >= 9900){
            return 5 ether;
        } else if(_currentSupply >= 8500){
            return 3 ether;
        } else if(_currentSupply >= 5000){
            return 2.5 ether;
        } else if(_currentSupply >= 3000){
            return 2 ether;
        } else if(_currentSupply >= 1000){
            return 1.5 ether;
        } else if(_currentSupply >= 500){
            return 1 ether;
        } else if(_currentSupply >= 250){
            return 0.75 ether;
        } else {
            return 0.5 ether;
        }  
    }

    function assetsOfOwner(address _owner) public view returns(uint256[] memory) {
        uint256 assetCount = balanceOf(_owner);

        uint256[] memory assetsId = new uint256[](assetCount);
        for(uint256 i = 0; i < assetCount; i++) {
            assetsId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return assetsId;
    }

    /* ONLY OWNER OPERATIONS */

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // function setPrice(uint256 _salePrice) public onlyOwner() {
    //     salePrice = _salePrice;
    // }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawTeam() public payable onlyOwner {
        uint256 distribution = (address(this).balance).div(4);
        payable(msg.sender).transfer(distribution);
        payable(member1).transfer(distribution);
        payable(member2).transfer(distribution);
        payable(member3).transfer(distribution);
    }

    function setBaseURI(string memory _baseNftURI) public onlyOwner {
        baseURI = _baseNftURI;
    }

    /* GETTERS */

    function getPrice() public view returns(uint256) {
        return salePrice;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /* OpenSea Zone - DO NOT DISTURB! */
    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal whenNotPaused override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
