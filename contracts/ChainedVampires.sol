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
    string private baseNftURI;
    uint256 private salePrice = 0.05 ether;
    address payable feeCollector;

    /* Team member's wallet addresses (Current Chain: Rinkeby) 
        - Important: Double check this before launching to Avalanche
    */
    address private member1 = 0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB; // Mozilla-1
    address private member2 = 0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75; // Mozilla-2
    address private member3 = 0xfe8FD71D3e33B480930090b97DaDabd3935D836E; // Brave

    /* Contract constructor 
       - Sets base URI
       - Allocates first three vampires to team members
    */
    constructor(string memory _baseNftURI) ERC721("ChainedVampires", "VAMP") {
        setBaseURI(_baseNftURI);
        feeCollector = payable(msg.sender);
        // Deployer and team gets the first 4 vampires (with random rarity, of course!)
        _safeMint(msg.sender, 0);
        _safeMint(member1, 1);
        _safeMint(member2, 2);
        _safeMint(member3, 3);
    }

    function summonVampire(uint256 amount) public payable whenNotPaused {
        uint256 currentSupply = totalSupply();
        require(currentSupply < MAX_VAMPIRES, "All vampires have already been claimed");
        require(currentSupply <= MAX_VAMPIRES.sub(amount), "Amount exceeds remaining supply");
        require(amount < 21, "You can summon maximum 20 vampires");
        require(msg.value >= salePrice.mul(amount), "Insufficient funds to fulfill the order");
    
        for(uint256 i = 0; i < amount; i++){
            _tokenIdCounter.increment();
            _safeMint(msg.sender, _tokenIdCounter.current());
        }
    }

    /* ONLY OWNER OPERATIONS */

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setPrice(uint256 _salePrice) public onlyOwner() {
        salePrice = _salePrice;
    }

    function setBaseURI(string memory _baseNftURI) public onlyOwner {
        baseNftURI = _baseNftURI;
    }

    /* GETTERS */

    function getPrice() public view returns(uint256) {
        return salePrice;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseNftURI;
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
