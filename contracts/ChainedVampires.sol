// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ChainedVampires is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    // State variables
    uint256 public constant MAX_VAMPIRES = 7000;
    uint256 private RESERVED = 30;
    address payable private feeCollector;

    string public baseURI;
    string public baseExtension = ".json";
    bool public paused = false;
    uint256 public mintPrice = 1 ether; // 1 AVAX
    //
    string private HASH_BASE;
    // Tokenomic State Variables
    uint256 public totalDistributedRewaords = 0; // Total profit to be distributed to nft holders
    uint256 public currentDividendPerHolder = 0; // Current dividend obtained from minting of a new NFT
    mapping(uint256 => uint256) public lastDividendAt; // tokenId to deserved profit for its owner
    mapping(uint256 => address) public minter; // tokenId to minter address

    // Market State Variables
    enum SaleState {
        ForSale,
        Sold,
        Idle
    }

    struct Item {
        uint256 price;
        SaleState state;
    }
    mapping(uint256 => Item) public MarketItem;

    event Sold(uint256 indexed tokenId, uint256 price);
    event MarketItemCreated(
        uint256 indexed tokenId,
        uint256 price,
        SaleState state
    );

    //
    constructor(
        string memory _initBaseURI,
        address _feeCollector,
        string memory _initHashBase
    ) ERC721("ChainedVampires", "CVAMP") {
        setBaseURI(_initBaseURI);
        setHashBase(_initHashBase);
        feeCollector = payable(_feeCollector);
    }

    function summonVampire(uint256 _amount) public payable {
        require(!paused, "Sale must be active!");
        require(_amount > 0, "Amount must be bigger than zero!");
        require(_amount < 21, "Max 20 vamps can be minted in one order!");
        require(msg.value >= mintPrice * _amount, "Insufficient funds!");

        uint256 mintAmount;
        if(_amount == 20) {
            mintAmount = _amount + 6;
        } else if(_amount >= 15) {
            mintAmount = _amount + 4;
        } else if(_amount >= 10) {
            mintAmount = _amount + 2; 
        } else if(_amount >= 5) {
             mintAmount = _amount + 1;
        } else {
            mintAmount = _amount;
        }

        require(
            _tokenIdCounter.current() + mintAmount <= MAX_VAMPIRES - RESERVED,
            "Amount exceeds remaining supply!"
        );

        for (uint256 i = 0; i < mintAmount; i++) {
            _safeMint(msg.sender, _tokenIdCounter.current());
            minter[_tokenIdCounter.current()] = msg.sender;
            lastDividendAt[_tokenIdCounter.current()] = currentDividendPerHolder;
            _tokenIdCounter.increment();
            if(i < _amount){             // don't reflect for promotion mints
                distributeMintFee(mintPrice);  
            }
        }
    }

    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory currentBaseURI = _baseURI();
        // bytes32 idHash = keccak256(abi.encodePacked(HASH_BASE, tokenId.toString()));
        uint256 idHashInt = uint256(
            keccak256(abi.encodePacked(HASH_BASE, tokenId.toString()))
        );

        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        idHashInt.toString(),
                        baseExtension
                    )
                )
                : "";
    }

    // Tokenomics
    function distributeMintFee(uint256 _revenue) private {
        uint256 holderShare = _revenue / 5; // 20% is distributed among holders
        uint256 contractShare = _revenue - holderShare;
        (feeCollector).transfer(contractShare);

        reflectDivident(holderShare);
    }

    function getEarnedAmount(uint256 _tokenId) public view returns (uint256) {
        return currentDividendPerHolder - lastDividendAt[_tokenId];
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

    function reflectToOwners() public payable {
        reflectDivident(msg.value);
    }

    // Market
    function putToSale(uint256 _tokenId, uint256 _price) external {
        require(msg.sender == ownerOf(_tokenId));
        require(_price > 0, "Sale price cannot be zero!");
        MarketItem[_tokenId].price = _price;
        MarketItem[_tokenId].state = SaleState.ForSale;
        emit MarketItemCreated(
            _tokenId,
            MarketItem[_tokenId].price,
            MarketItem[_tokenId].state
        );
    }

    function cancelSale(uint256 _tokenId) external {
        require(msg.sender == ownerOf(_tokenId));
        delete MarketItem[_tokenId].price;
        MarketItem[_tokenId].state = SaleState.Idle;
    }

    function buyItem(uint256 _tokenId) external payable {
        address payable seller = payable(ownerOf(_tokenId));

        require(
            msg.value >= MarketItem[_tokenId].price,
            "Can't buy. Price issue"
        );
        require(
            MarketItem[_tokenId].state == SaleState.ForSale,
            "Item is not for sale"
        );

        uint256 fee = marketFee(msg.value); // marketplace fee
        uint256 royalty = royaltyFee(msg.value); // minter royality
        uint256 reflection = reflectionFee(msg.value); // reflection to all holders

        uint256 toSeller = msg.value - (fee + royalty + reflection); // seller share

        payable(minter[_tokenId]).transfer(royalty);
        (feeCollector).transfer(fee);
        reflectDivident(reflection);
        seller.transfer(toSeller);

        _transfer(seller, msg.sender, _tokenId);
        MarketItem[_tokenId].state = SaleState.Sold;
        emit Sold(_tokenId, msg.value);
    }

    function reflectionFee(uint256 _value) internal pure returns (uint256) {
        uint256 reflection = _value / 25;   // %4 market sale reflection
        return reflection;
    }

    function marketFee(uint256 _value) internal pure returns (uint256) {
        uint256 fee = (_value * 3) / 100;   // %3 service fee
        return fee;
    }

    function royaltyFee(uint256 _value) internal pure returns (uint256) {
        uint256 royalty = (_value ) / 20;   // %5 royalty
        return royalty;
    }

    function reflectDivident(uint256 _reflection) private {
        totalDistributedRewaords += _reflection; // Updatede total distributed revenue
        currentDividendPerHolder += _reflection / totalSupply(); // Dividend for current holders
    }

    // Only Owner
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setPrice(uint _newPrice) external onlyOwner {
        mintPrice = _newPrice;
    }

    function setHashBase(string memory _newHashBase) public onlyOwner {
        HASH_BASE = _newHashBase;
    }

    function pause(bool _state) public onlyOwner {
        paused = _state;
    }

    function giveAway(address _to, uint256 _amount) external onlyOwner {
        require(
            _amount <= RESERVED,
            "Amount exceeds reserved giveaway supply!"
        );
        for (uint256 i = 0; i < _amount; i++) {
            _safeMint(_to, _tokenIdCounter.current());
            minter[_tokenIdCounter.current()] = _to; // Full ownership is given to rewarded address
            lastDividendAt[
                _tokenIdCounter.current()
            ] = currentDividendPerHolder;
            _tokenIdCounter.increment();
        }
        RESERVED -= _amount;
    }

    // Getters
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function getOriginalMinter(uint256 _tokenId) public view returns (address) {
        return minter[_tokenId];
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
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
