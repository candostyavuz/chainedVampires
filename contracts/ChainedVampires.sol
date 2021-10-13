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
    uint256 public constant MAX_VAMPIRES = 40;
    string public baseURI;
    string public baseExtension = ".json";
    bool public paused = false;
    uint256 private salePrice = 0.2 ether; // 0.2 AVAX
    address payable private _admin;
    //
    string private HASH_BASE;
    // Tokenomic State Variables
    uint256 public totalHolderBalance = 0; // Total profit to be distributed to nft holders
    uint256 public currentDividendPerHolder = 0; // Current dividend obtained from minting of a new NFT
    mapping(uint256 => uint256) public lastDividendAt; // tokenId to deserved profit for its owner
    mapping(uint256 => address) public minter; // tokenId to minter address

    // Market State Variables  
    enum SaleState {ForSale, Sold, Idle}

    struct Item {
        uint256 price;
        SaleState state;
    }
    mapping(uint256 => Item) public MarketItem;

    event Sold(uint256 indexed tokenId, uint256 price);
    event MarketItemCreated (
        uint256 indexed tokenId,
        uint256 price,
        SaleState state
    );

    // 
    constructor(string memory _initBaseURI, address admin, string memory _initHashBase) ERC721("ChainedVampires", "CVAMP") {
        setBaseURI(_initBaseURI);
        setHashBase(_initHashBase);
        _admin = payable(admin);
    }

    function summonVampire(uint256 _amount) public payable {
        require(!paused, "Sale must be active!");
        require(msg.value >= salePrice * _amount, "Insufficient funds!");
        require(_amount > 0, "Amount must be bigger than zero!");
        require(_amount < 21, "Max 20 vamps can be minted in one order!");
        require(
            _tokenIdCounter.current() + _amount <= MAX_VAMPIRES,
            "Amount exceeds remaining supply!"
        );
        for (uint256 i = 0; i < _amount; i++) {
            _mint(msg.sender, _tokenIdCounter.current());
            minter[_tokenIdCounter.current()] = msg.sender;
            lastDividendAt[_tokenIdCounter.current()] = currentDividendPerHolder;
            _tokenIdCounter.increment();
            distributeMintFee(salePrice);
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
        
        return bytes(currentBaseURI).length > 0
                ? string(abi.encodePacked(currentBaseURI, idHashInt.toString(), baseExtension))
                : "";
    }

    // Tokenomics
    function distributeMintFee(uint256 _revenue) private {
        uint256 holderShare = _revenue / 10; // 10% is distributed among holders
        uint256 contractShare = _revenue - holderShare;
        (_admin).transfer(contractShare);

        totalHolderBalance += holderShare; // Updatede total distributed revenue
        currentDividendPerHolder += holderShare / totalSupply(); // Dividend for current holders
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

    // Market
    function putToSale(uint256 _tokenId, uint256 _price) external {
        require(msg.sender == ownerOf(_tokenId));
        require(_price > 0 , "Sale price cannot be zero!");
        MarketItem[_tokenId].price = _price;
        MarketItem[_tokenId].state = SaleState.ForSale;
        emit MarketItemCreated(
            _tokenId,
            MarketItem[_tokenId].price, 
            MarketItem[_tokenId].state );
        }
    
    function cancelSale(uint256 _tokenId) external {
        require(msg.sender == ownerOf(_tokenId));
        delete MarketItem[_tokenId].price;
        MarketItem[_tokenId].state = SaleState.Idle;
    }

    function buyItem(uint256 _tokenId) external payable {
        address payable seller = payable(ownerOf(_tokenId));

        require(msg.value >= MarketItem[_tokenId].price, "Can't buy. Price issue");
        require(MarketItem[_tokenId].state == SaleState.ForSale, "Item is not for sale");

        uint256 fee = marketFee(msg.value);
        uint256 toSeller = msg.value - fee;

        seller.transfer(toSeller);
        (_admin).transfer(fee);

        _transfer(seller, msg.sender, _tokenId);
        MarketItem[_tokenId].state = SaleState.Sold;
        emit Sold(_tokenId, msg.value);
    }

    function marketFee(uint256 _value) internal pure returns (uint256) {
        uint256 fee = (_value * 3) / 100;
        return fee;
    }

    // Only Owner
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }
    
    function setHashBase(string memory _newHashBase) public onlyOwner {
        HASH_BASE = _newHashBase;
    }

    function pause(bool _state) public onlyOwner {
        paused = _state;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success);
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