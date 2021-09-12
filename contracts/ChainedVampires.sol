// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ChainedVampires is ERC721, ERC721Enumerable, Pausable, Ownable {
    using SafeMath for uint256;

    // Chained Vampires ERC-721 State Variables
    uint256 public constant MAX_VAMPIRES = 9; //9999;
    uint256 private MAX_RESERVED = 99;
    uint256 private reservedCounter = 0;

    string private baseURI;

    uint16[] availableVampireIDs;

    bool private saleActive = false;
    uint256 private salePrice = 0.1 ether;

    /** 
    * @dev Default callback function for receiving ether
    */
    receive() external payable {}

    // Marketplace State Variables:
    enum ItemState {
        ForSale,
        Sold,
        Neutral,
        Transferred
    }
    struct MarketElement {
        uint256 tokenId;
        uint256 price;
        ItemState state;
    }
    address payable feeCollector;
    mapping(uint256 => MarketElement) public Catacomb;

    event NewSale(uint256 _tokenId, uint256 _salePrice);
    event ItemBought(uint256 _tokenId, uint256 _price);

    /**
     * @dev Tokenomics State Variables
     * RewardClaims are done according to owner of NFT with specified tokenId
     */

    uint256 public totalHolderBalance = 0; // Total profit to be distributed to nft holders
    uint256 public currentDividendPerHolder = 0; // Current dividend obtained from minting of a new NFT
    mapping(uint256 => uint256) public lastDividendAt; // tokenId to deserved profit for its owner
    mapping(uint256 => address) public minter; // tokenId to minter address

    /* Team member's wallet addresses (Current Chain: Rinkeby) 
       - Important: Double check this before launching to Avalanche
    */

    /**
     * @dev Contract constructor
     */
    constructor(string memory _baseNftURI, address member1, address member2) ERC721("ChainedVampires", "VAMP") {
        assignInitialVampireIDs();
        setBaseURI(_baseNftURI);
        feeCollector = payable(msg.sender);
        saleActive = true;
        summonForReserved(msg.sender);
        summonForReserved(member1);
        summonForReserved(member2);
    }

    /**
     * @dev Mints a random generated vampire for caller address
     */
    function summonVampire(uint256 _amount) public payable {
        /* Conditions for minting */
        require(saleActive == true, "Sale is not active at the moment.");
        require(
            _amount < 21,
            "Can only summon maximum of 20 vampires per transaction"
        );

        uint256 currentSupply = totalSupply();
        require(
            currentSupply <= MAX_VAMPIRES,
            "All vampires have already been claimed"
        );
        require(
            currentSupply <= MAX_VAMPIRES.sub(_amount),
            "Amount exceeds remaining supply"
        );

        salePrice = calculateCurrentPrice(currentSupply); // price for 1 vampire
        require(
            msg.value >= salePrice.mul(_amount),
            "Insufficient funds to fulfill the order"
        );

        // Minting with random tokenId
        for (uint256 i = 0; i < _amount; i++) {
            uint256 generatedId = getAvailableVampire();
            _safeMint(msg.sender, generatedId);
            minter[generatedId] = msg.sender;
            lastDividendAt[generatedId] = currentDividendPerHolder;
            distributeMintFee(salePrice);
        }
    }

    //////////////////////////////////////////////////////////////////
    /**
     * @dev TOKENOMICS FUNCTIONS
     */

    function distributeMintFee(uint256 _revenue) private {
        uint256 toHolders = _revenue.div(10); // 10% is distributed among holders
        uint256 toContract = _revenue - toHolders;
        payable(address(this)).transfer(toContract);

        totalHolderBalance += toHolders; // Updatede total distributed revenue
        currentDividendPerHolder += toHolders.div(totalSupply()); // Dividend for current holders
    }

    function getEarnedAmount(uint256 _tokenId) public view returns (uint256) {
        return currentDividendPerHolder - lastDividendAt[_tokenId];
    }

    function claimReward(uint256 _tokenId) public {
        require(
            ownerOf(_tokenId) == msg.sender ||
                getApproved(_tokenId) == msg.sender
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

    /**
     * @dev Uses pseudo-RNG to select a tokenId from remaining vampires
     */
    function getAvailableVampire() private returns (uint256) {
        uint256 randGen = getPseudoRandomNumber(availableVampireIDs.length);
        uint256 generatedID = uint256(availableVampireIDs[randGen]); // this will be used for minting

        availableVampireIDs[randGen] = availableVampireIDs[
            availableVampireIDs.length - 1
        ];
        availableVampireIDs.pop();
        return generatedID;
    }

    /**
     * @dev Pseudo-Random Number Generator
     */
    function getPseudoRandomNumber(uint256 _upperLimit)
        private
        view
        returns (uint256)
    {
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp + block.difficulty + block.gaslimit +
                        ((uint256(keccak256(abi.encodePacked(msg.sender)))) / (block.timestamp)) +
                        block.number +
                        ((uint256(keccak256(abi.encodePacked(availableVampireIDs.length,msg.sender)))))
                )
            )
        );
        return seed % _upperLimit;
    }

    /**
     * @dev Calculates current sale price according to remaining supply
     */
    function calculateCurrentPrice(uint256 _currentSupply)
        private
        pure
        returns (uint256)
    {
        if (_currentSupply == MAX_VAMPIRES) {
            return 66 ether;
        } else if (_currentSupply >= 9990) {
            return 10 ether;
        } else if (_currentSupply >= 9900) {
            return 5 ether;
        } else if (_currentSupply >= 8500) {
            return 4 ether;
        } else if (_currentSupply >= 5000) {
            return 3.5 ether;
        } else if (_currentSupply >= 3000) {
            return 3 ether;
        } else if (_currentSupply >= 1000) {
            return 2.5 ether;
        } else if (_currentSupply >= 500) {
            return 2 ether;
        } else if (_currentSupply >= 250) {
            return 1.5 ether;
        } else {
            return 1 ether;
        }
    }

    /**
     * @dev Returns the array of tokenIds that particular wallet owner holds.
     */
    function getAssetsOfWallet(address _wallet)
        public
        view
        returns (uint256[] memory)
    {
        uint256 assetCount = balanceOf(_wallet);

        uint256[] memory assetsId = new uint256[](assetCount);
        for (uint256 i = 0; i < assetCount; i++) {
            assetsId[i] = tokenOfOwnerByIndex(_wallet, i);
        }
        return assetsId;
    }

    //////////////////////////////////////////////////////////////////
    /**
     * @dev ONLY OWNER FUNCTIONS
     */

    /**
     * @dev Sets token id's to array for random selection
     */
    function assignInitialVampireIDs() internal onlyOwner {
        for (uint16 i = 0; i < MAX_VAMPIRES; i++) {
            availableVampireIDs.push(i);
        }
    }

    /**
     * @dev This minting function is used for promotions
     *      and distributing one vampire to each team member (total of 3)
     */
    function summonForReserved(address _to) public onlyOwner {
        require(saleActive == true, "Sale is not active at the moment.");
        require(
            totalSupply() <= MAX_VAMPIRES,
            "All vampires have already been claimed"
        );
        require(
            reservedCounter <= MAX_RESERVED,
            "All reserved vampires have been distributed!"
        );

        uint256 generatedId = getAvailableVampire();
        _safeMint(_to, generatedId);
        minter[generatedId] = _to;
        reservedCounter.add(1);
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

    function setBaseURI(string memory _baseNftURI) public onlyOwner {
        baseURI = _baseNftURI;
    }

    //////////////////////////////////////////////////////////////////
    /**
     * @dev GETTER FUNCTIONS
     */

    /**
     * @dev Returns current sale status.
     */

    function getFeeCollector() external view returns (address) {
        return feeCollector;
    }

    function isSaleActive() public view returns (bool) {
        return saleActive;
    }

    /**
     * @dev Returns current sale price.
     */
    function getCurrentPrice() public view returns (uint256) {
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

    /**
     * @dev Returns original minter address for given tokenId
     */
    function getOriginalMinter(uint256 _tokenId) public view returns (address) {
        return minter[_tokenId];
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

    //////////////////////////////////////////////////////////////////
    /**
     * @dev MARKETPLACE FUNCTIONS
     */

    function putToSale(uint256 _tokenId, uint256 _salePrice) public {
        require(msg.sender == ownerOf(_tokenId));
        require(_salePrice > 0, "Sale price must be greater than zero!");
        Catacomb[_tokenId].price = _salePrice;
        Catacomb[_tokenId].state = ItemState.ForSale;

        emit NewSale(_tokenId, _salePrice);
    }

    function cancelSale(uint256 _tokenId) public {
        require(msg.sender == ownerOf(_tokenId));
        Catacomb[_tokenId].state = ItemState.Neutral;
        delete Catacomb[_tokenId].price;
    }

    function buyItem(uint256 _tokenId) public payable {
        address payable seller = payable(ownerOf(_tokenId));

        require(
            Catacomb[_tokenId].state == ItemState.ForSale,
            "Item is not for sale!"
        );
        require(
            msg.value >= Catacomb[_tokenId].price,
            "Not enough balance to buy the item."
        );

        uint256 serviceFee = calcServiceFee(Catacomb[_tokenId].price);
        uint256 minterFee = calcMinterFee(Catacomb[_tokenId].price);
        uint256 netAmountToSeller = (Catacomb[_tokenId].price).sub(
            serviceFee.add(minterFee)
        );

        // Money transfer
        feeCollector.transfer(serviceFee); // market share
        payable(getOriginalMinter(_tokenId)).transfer(minterFee); // minter share
        seller.transfer(netAmountToSeller); // seller share

        // Vampire transfer
        safeTransferFrom(ownerOf(_tokenId), msg.sender, _tokenId);
        Catacomb[_tokenId].state = ItemState.Sold;

        emit ItemBought(_tokenId, Catacomb[_tokenId].price);
    }

    /**
     * @dev Calculate commission fee for the market (Currently = %2)
     */
    function calcServiceFee(uint256 _salePrice)
        internal
        pure
        returns (uint256)
    {
        uint256 serviceFee = _salePrice.mul(2);
        return serviceFee.div(100);
    }

    /**
     * @dev Calculate minter fee of market sale (Currently = %2)
     */
    function calcMinterFee(uint256 _salePrice) internal pure returns (uint256) {
        uint256 minterFee = _salePrice.mul(2);
        return minterFee.div(100);
    }

    //////////////////////////////////////////////////////////////////

    /**
     * @notice - OPENZEPPELIN ZONE - Do Not Disturb!
     */
    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
