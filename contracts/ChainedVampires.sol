// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ChainedVampires is ERC721, ERC721Enumerable, Pausable, Ownable {
    using SafeMath for uint256;

    // State Variables
    uint256 public constant MAX_VAMPIRES = 9999;
    uint256 private MAX_RESERVED = 99;
    uint256 private distributed = 0;

    string private baseURI;

    uint16[] availableVampireIDs; 

    bool private saleActive = false;
    uint256 private salePrice = 0.1 ether;
    
    address payable feeCollector;   // for marketplace

    /** 
    * @notice Team member's wallet addresses (Current Chain: Rinkeby) 
    *        - Important: Double check this before launching to Avalanche
    */ 
    address private member1 = 0x95c5bDD933BE67a9fF67a5DD9aE9dd440b2604dB; // Mozilla-1, this is also the Owner
    address private member2 = 0x9a8C9C02cB9f56bEEB2F20Fe88e615EB8553dC75; // Mozilla-2
    address private member3 = 0xfe8FD71D3e33B480930090b97DaDabd3935D836E; // Brave

   /**
   * @dev Contract constructor
   */
    constructor(string memory _baseNftURI) ERC721("ChainedVampires", "VAMP") {
        assignInitialVampireIDs();
        setBaseURI(_baseNftURI);
        feeCollector = payable(msg.sender);
        saleActive = true;
        summonForReserved(msg.sender);
        summonForReserved(member1);
        summonForReserved(member2);
        summonForReserved(member3);
    }

    /** 
    * @dev Mints a random generated vampire for caller address
    */
    function summonVampire(uint256 _amount) public payable whenNotPaused {
        /* Conditions for minting */
        require(saleActive == true, "Sale is not active at the moment.");
        require(_amount < 21, "Can only summon maximum of 20 vampires per transaction");

        uint256 currentSupply = totalSupply();
        require(currentSupply <= MAX_VAMPIRES, "All vampires have already been claimed");
        require(currentSupply <= MAX_VAMPIRES.sub(_amount), "Amount exceeds remaining supply");

        salePrice = calculateCurrentPrice(currentSupply);
        require(msg.value >= salePrice.mul(_amount), "Insufficient funds to fulfill the order");
        
        // Minting with random tokenId
        for(uint256 i = 0; i < _amount; i++){
            _safeMint(msg.sender, getAvailableVampire());
        }
    }

    /**
     * @dev Uses pseudo-RNG to select a tokenId from remaining vampires
     */
    function getAvailableVampire() private returns (uint256) {
        uint256 randGen = getPseudoRandomNumber(availableVampireIDs.length);
        uint256 generatedID = uint256(availableVampireIDs[randGen]);    // this will be used for minting

        availableVampireIDs[randGen] = availableVampireIDs[availableVampireIDs.length-1];
        availableVampireIDs.pop();
        return generatedID;
    }

    /** 
     * @dev Pseudo-Random Number Generator
     */
    function getPseudoRandomNumber(uint256 _upperLimit) private view returns(uint256) {
         uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp + block.difficulty +
            ((uint256(keccak256(abi.encodePacked(block.coinbase)))) / (block.timestamp)) +
            block.gaslimit + 
            ((uint256(keccak256(abi.encodePacked(msg.sender)))) / (block.timestamp)) +
            block.number +
            ((uint256(keccak256(
                    abi.encodePacked(
                        availableVampireIDs.length,
                        msg.sender
                    )
            ))))
        )));
        return seed % _upperLimit;
    }

    /** 
    * @dev Calculates current sale price according to remaining supply
    */
    function calculateCurrentPrice(uint256 _currentSupply) private pure returns (uint256) {
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

    /**
    * @dev Returns the array of tokenIds that particular wallet owner holds.
    */
    function getAssetsOfWallet(address _wallet) public view returns(uint256[] memory) {
        uint256 assetCount = balanceOf(_wallet);

        uint256[] memory assetsId = new uint256[](assetCount);
        for(uint256 i = 0; i < assetCount; i++) {
            assetsId[i] = tokenOfOwnerByIndex(_wallet, i);
        }
        return assetsId;
    }

    /**
    * @notice - ONLY OWNER FUNCTIONS -
    */  

    /** 
    * @dev Sets token id's to array for random selection
    */
    function assignInitialVampireIDs() internal onlyOwner {
        for(uint16 i = 0; i < 9999; i++){
            availableVampireIDs.push(i);
        }
    } 

    /** 
    * @dev This minting function is used for promotions 
    *      and distributing one vampire to each team member (total of 3)
    */
    function summonForReserved(address _to) public onlyOwner {
        require(saleActive == true, "Sale is not active at the moment.");
        require(totalSupply() <= MAX_VAMPIRES, "All vampires have already been claimed");
        require(distributed <= MAX_RESERVED, "All reserved vampires have been distributed!");
        
        _safeMint(_to, getAvailableVampire());
        distributed.add(1);
    }

    function transferContractOwnership(address _newOwner) external onlyOwner {
        transferOwnership(_newOwner);
    }

    function pause() public onlyOwner {
        saleActive = false;
        _pause();
    }
    function unpause() public onlyOwner {
        saleActive = true;
        _unpause();
    }
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

    /**
    * @notice - GETTERS -
    */

    /** 
    * @dev Returns current sale status.
    */
    function isSaleActive() public view returns(bool) {
        return saleActive;
    }

    /** 
    * @dev Returns current sale price.
    */
    function getCurrentPrice() public view returns(uint256) {
        return salePrice;
    }

    /** 
    * @dev Returns total number of remaining unclaimed vampires.
    */
    function getRemainingSupply() public view returns (uint256) {
        return availableVampireIDs.length;
    }

    /** 
    * @dev Returns total number of claimed vampires.
    */
    function getTotalClaimedCount() public view returns (uint256) {
        return totalSupply();
    }

    function baseTokenURI() external view returns (string memory) {
        return baseURI;
    }

    /** 
    * @dev See ERC-721 
    */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /** 
    * @notice - OPENZEPPELIN ZONE - Do Not Disturb!
    */
    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal whenNotPaused override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
