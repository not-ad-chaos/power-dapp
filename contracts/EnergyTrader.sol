// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Certificate.sol";
import "./EnergyLogger.sol";

/**
 * @title EnergyTradeLedger
 * @dev Advanced smart contract for peer-to-peer energy trading
 * with built-in market mechanisms, pricing, and renewable energy certificate integration
 */
contract EnergyTradeLedger {
    // Trade status enum
    enum TradeStatus { Open, Completed, Cancelled }
    
    // Trade struct with expanded details
    struct Trade {
        uint id;
        address seller;
        address buyer;
        uint energyAmount; // in kWh
        uint pricePerUnit; // price in wei per kWh
        uint totalPrice; // total price in wei
        uint timestamp;
        uint deliveryTime; // when energy will be delivered
        string region; // geographic region where trade occurs
        TradeStatus status;
        bool isCertified; // whether this trade includes renewable certificates
        uint certificateId; // ID of the associated certificate, if any
    }
    
    // Energy offer struct for the marketplace
    struct EnergyOffer {
        uint id;
        address seller;
        uint energyAmount;
        uint pricePerUnit;
        uint minPurchaseAmount;
        uint expirationTime;
        string region;
        bool isCertified;
        bool isActive;
    }
    
    // Marketplace activity tracking
    struct MarketMetrics {
        uint totalTrades;
        uint totalVolumeTraded;
        uint totalValueTraded;
        uint averagePrice;
        mapping(string => uint) regionVolumes;
        mapping(string => uint) regionValues;
        mapping(string => uint) regionPrices;
    }
    
    // All trades that have occurred
    Trade[] public trades;
    
    // Active energy offers
    EnergyOffer[] public offers;
    
    // Mapping from address to trades as seller
    mapping(address => uint[]) public sellerTrades;
    
    // Mapping from address to trades as buyer
    mapping(address => uint[]) public buyerTrades;
    
    // Mapping from address to offers
    mapping(address => uint[]) public sellerOffers;
    
    // Mapping from region to active offers
    mapping(string => uint[]) public regionOffers;
    
    // Market metrics
    MarketMetrics private marketMetrics;
    
    // References to other contracts
    RenewableCertificate private certificateContract;
    EnergyLogger private loggerContract;
    
    // Contract owner
    address public owner;
    
    // Platform fee percentage (in basis points, 100 = 1%)
    uint public platformFeeRate = 250; // 2.5% by default
    
    // Platform fee recipient
    address public feeRecipient;
    
    // Events
    event TradeCreated(uint indexed tradeId, address indexed seller, address indexed buyer, uint energyAmount, uint totalPrice);
    event TradeCompleted(uint indexed tradeId);
    event TradeCancelled(uint indexed tradeId);
    event OfferCreated(uint indexed offerId, address indexed seller, uint energyAmount, uint pricePerUnit, string region);
    event OfferUpdated(uint indexed offerId, uint energyAmount, uint pricePerUnit);
    event OfferCancelled(uint indexed offerId);
    event OfferAccepted(uint indexed offerId, address indexed buyer, uint energyAmount, uint totalPrice);
    event PlatformFeeCollected(uint amount, address recipient);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Constructor sets the contract owner and references to other contracts
     * @param _certificateContract Address of the RenewableCertificate contract
     * @param _loggerContract Address of the EnergyLogger contract
     */
    constructor(address _certificateContract, address _loggerContract) {
        owner = msg.sender;
        feeRecipient = msg.sender;
        certificateContract = RenewableCertificate(_certificateContract);
        loggerContract = EnergyLogger(_loggerContract);
    }
    
    /**
     * @dev Create a new energy offer for the marketplace
     * @param _energyAmount Amount of energy being offered (kWh)
     * @param _pricePerUnit Price per kWh in wei
     * @param _minPurchaseAmount Minimum amount that can be purchased (kWh)
     * @param _expirationTime Time when offer expires (Unix timestamp)
     * @param _region Geographic region where energy is available
     * @param _isCertified Whether the energy comes with renewable certificates
     * @return Offer ID
     */
    function createOffer(
        uint _energyAmount,
        uint _pricePerUnit,
        uint _minPurchaseAmount,
        uint _expirationTime,
        string memory _region,
        bool _isCertified
    ) external returns (uint) {
        require(_energyAmount > 0, "Energy amount must be positive");
        require(_pricePerUnit > 0, "Price must be positive");
        require(_minPurchaseAmount > 0 && _minPurchaseAmount <= _energyAmount, "Invalid minimum purchase amount");
        require(_expirationTime > block.timestamp, "Expiration time must be in the future");
        
        // Check if seller has certificates if offering certified energy
        if (_isCertified) {
            uint certificateCount = certificateContract.getCertificates(msg.sender);
            require(certificateCount * 100 >= _energyAmount, "Insufficient certificates for certified energy offer");
        }
        
        uint offerId = offers.length;
        
        EnergyOffer memory newOffer = EnergyOffer({
            id: offerId,
            seller: msg.sender,
            energyAmount: _energyAmount,
            pricePerUnit: _pricePerUnit,
            minPurchaseAmount: _minPurchaseAmount,
            expirationTime: _expirationTime,
            region: _region,
            isCertified: _isCertified,
            isActive: true
        });
        
        offers.push(newOffer);
        sellerOffers[msg.sender].push(offerId);
        regionOffers[_region].push(offerId);
        
        emit OfferCreated(offerId, msg.sender, _energyAmount, _pricePerUnit, _region);
        
        return offerId;
    }
    
    /**
     * @dev Update an existing energy offer
     * @param _offerId ID of the offer to update
     * @param _energyAmount New energy amount
     * @param _pricePerUnit New price per unit
     * @param _minPurchaseAmount New minimum purchase amount
     * @param _expirationTime New expiration time
     */
    function updateOffer(
        uint _offerId,
        uint _energyAmount,
        uint _pricePerUnit,
        uint _minPurchaseAmount,
        uint _expirationTime
    ) external {
        require(_offerId < offers.length, "Offer does not exist");
        EnergyOffer storage offer = offers[_offerId];
        
        require(offer.seller == msg.sender, "Only seller can update offer");
        require(offer.isActive, "Offer is not active");
        require(_energyAmount > 0, "Energy amount must be positive");
        require(_pricePerUnit > 0, "Price must be positive");
        require(_minPurchaseAmount > 0 && _minPurchaseAmount <= _energyAmount, "Invalid minimum purchase amount");
        require(_expirationTime > block.timestamp, "Expiration time must be in the future");
        
        // Update offer details
        offer.energyAmount = _energyAmount;
        offer.pricePerUnit = _pricePerUnit;
        offer.minPurchaseAmount = _minPurchaseAmount;
        offer.expirationTime = _expirationTime;
        
        emit OfferUpdated(_offerId, _energyAmount, _pricePerUnit);
    }
    
    /**
     * @dev Cancel an existing energy offer
     * @param _offerId ID of the offer to cancel
     */
    function cancelOffer(uint _offerId) external {
        require(_offerId < offers.length, "Offer does not exist");
        EnergyOffer storage offer = offers[_offerId];
        
        require(offer.seller == msg.sender, "Only seller can cancel offer");
        require(offer.isActive, "Offer is not active");
        
        offer.isActive = false;
        
        emit OfferCancelled(_offerId);
    }
    
    /**
     * @dev Accept an energy offer and create a trade
     * @param _offerId ID of the offer to accept
     * @param _energyAmount Amount of energy to purchase
     */
    function acceptOffer(uint _offerId, uint _energyAmount) external payable {
        require(_offerId < offers.length, "Offer does not exist");
        EnergyOffer storage offer = offers[_offerId];
        
        require(offer.isActive, "Offer is not active");
        require(block.timestamp < offer.expirationTime, "Offer has expired");
        require(_energyAmount >= offer.minPurchaseAmount, "Purchase amount below minimum");
        require(_energyAmount <= offer.energyAmount, "Purchase amount exceeds available energy");
        
        // Calculate total price
        uint totalPrice = _energyAmount * offer.pricePerUnit;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Determine if certificates are involved
        uint certificateId = 0;
        if (offer.isCertified) {
            // Logic would be here to select a specific certificate
            // This is simplified for now
        }
        
        // Create trade record
        uint tradeId = trades.length;
        
        Trade memory newTrade = Trade({
            id: tradeId,
            seller: offer.seller,
            buyer: msg.sender,
            energyAmount: _energyAmount,
            pricePerUnit: offer.pricePerUnit,
            totalPrice: totalPrice,
            timestamp: block.timestamp,
            deliveryTime: block.timestamp + 1 days, // Arbitrary delivery time
            region: offer.region,
            status: TradeStatus.Open,
            isCertified: offer.isCertified,
            certificateId: certificateId
        });
        
        trades.push(newTrade);
        sellerTrades[offer.seller].push(tradeId);
        buyerTrades[msg.sender].push(tradeId);
        
        // Update offer
        offer.energyAmount -= _energyAmount;
        if (offer.energyAmount < offer.minPurchaseAmount) {
            offer.isActive = false;
        }
        
        // Update market metrics
        marketMetrics.totalTrades++;
        marketMetrics.totalVolumeTraded += _energyAmount;
        marketMetrics.totalValueTraded += totalPrice;
        marketMetrics.averagePrice = marketMetrics.totalValueTraded / marketMetrics.totalVolumeTraded;
        marketMetrics.regionVolumes[offer.region] += _energyAmount;
        marketMetrics.regionValues[offer.region] += totalPrice;
        
        if (marketMetrics.regionVolumes[offer.region] > 0) {
            marketMetrics.regionPrices[offer.region] = marketMetrics.regionValues[offer.region] / marketMetrics.regionVolumes[offer.region];
        }
        
        // Calculate and transfer platform fee
        uint feeAmount = (totalPrice * platformFeeRate) / 10000;
        uint sellerAmount = totalPrice - feeAmount;
        
        // Transfer fee to fee recipient
        if (feeAmount > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
            emit PlatformFeeCollected(feeAmount, feeRecipient);
        }
        
        // Transfer remaining amount to seller
        (bool sellerSuccess, ) = offer.seller.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller transfer failed");
        
        // Refund excess payment to buyer
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalPrice}("");
            require(refundSuccess, "Refund transfer failed");
        }
        
        emit OfferAccepted(_offerId, msg.sender, _energyAmount, totalPrice);
        emit TradeCreated(tradeId, offer.seller, msg.sender, _energyAmount, totalPrice);
    }
    
    /**
     * @dev Complete a trade (confirm energy delivery)
     * @param _tradeId ID of the trade to complete
     */
    function completeTrade(uint _tradeId) external {
        require(_tradeId < trades.length, "Trade does not exist");
        Trade storage trade = trades[_tradeId];
        
        require(trade.buyer == msg.sender, "Only buyer can complete trade");
        require(trade.status == TradeStatus.Open, "Trade is not open");
        
        trade.status = TradeStatus.Completed;
        
        // If the trade involves certificates, transfer them
        if (trade.isCertified && trade.certificateId > 0) {
            // Logic to transfer certificates would be here
        }
        
        emit TradeCompleted(_tradeId);
    }
    
    /**
     * @dev Cancel a trade
     * @param _tradeId ID of the trade to cancel
     */
    function cancelTrade(uint _tradeId) external {
        require(_tradeId < trades.length, "Trade does not exist");
        Trade storage trade = trades[_tradeId];
        
        require(trade.status == TradeStatus.Open, "Trade is not open");
        require(msg.sender == trade.seller || msg.sender == trade.buyer || msg.sender == owner, "Unauthorized");
        
        trade.status = TradeStatus.Cancelled;
        
        // In a real implementation, this would include refund logic
        
        emit TradeCancelled(_tradeId);
    }
    
    /**
     * @dev Record a direct trade between buyer and seller
     * @param _seller Address of the seller
     * @param _buyer Address of the buyer
     * @param _energyAmount Amount of energy traded
     * @param _pricePerUnit Price per unit
     * @param _region Region where trade occurred
     * @return Trade ID
     */
    function recordTrade(
        address _seller,
        address _buyer,
        uint _energyAmount,
        uint _pricePerUnit,
        string memory _region
    ) external returns (uint) {
        require(_seller != address(0) && _buyer != address(0), "Invalid addresses");
        require(_energyAmount > 0, "Energy amount must be positive");
        
        uint totalPrice = _energyAmount * _pricePerUnit;
        uint tradeId = trades.length;
        
        Trade memory newTrade = Trade({
            id: tradeId,
            seller: _seller,
            buyer: _buyer,
            energyAmount: _energyAmount,
            pricePerUnit: _pricePerUnit,
            totalPrice: totalPrice,
            timestamp: block.timestamp,
            deliveryTime: block.timestamp, // Immediate delivery for recorded trades
            region: _region,
            status: TradeStatus.Completed, // Already completed
            isCertified: false,
            certificateId: 0
        });
        
        trades.push(newTrade);
        sellerTrades[_seller].push(tradeId);
        buyerTrades[_buyer].push(tradeId);
        
        // Update market metrics
        marketMetrics.totalTrades++;
        marketMetrics.totalVolumeTraded += _energyAmount;
        marketMetrics.totalValueTraded += totalPrice;
        marketMetrics.averagePrice = marketMetrics.totalValueTraded / marketMetrics.totalVolumeTraded;
        marketMetrics.regionVolumes[_region] += _energyAmount;
        marketMetrics.regionValues[_region] += totalPrice;
        
        if (marketMetrics.regionVolumes[_region] > 0) {
            marketMetrics.regionPrices[_region] = marketMetrics.regionValues[_region] / marketMetrics.regionVolumes[_region];
        }
        
        emit TradeCreated(tradeId, _seller, _buyer, _energyAmount, totalPrice);
        emit TradeCompleted(tradeId);
        
        return tradeId;
    }
    
    /**
     * @dev Get a trade by ID
     * @param _tradeId ID of the trade
     */
    function getTrade(uint _tradeId) external view returns (
        uint id,
        address seller,
        address buyer,
        uint energyAmount,
        uint pricePerUnit,
        uint totalPrice,
        uint timestamp,
        uint deliveryTime,
        string memory region,
        uint status,
        bool isCertified,
        uint certificateId
    ) {
        require(_tradeId < trades.length, "Trade does not exist");
        
        Trade memory trade = trades[_tradeId];
        return (
            trade.id,
            trade.seller,
            trade.buyer,
            trade.energyAmount,
            trade.pricePerUnit,
            trade.totalPrice,
            trade.timestamp,
            trade.deliveryTime,
            trade.region,
            uint(trade.status),
            trade.isCertified,
            trade.certificateId
        );
    }
    
    /**
     * @dev Get an offer by ID
     * @param _offerId ID of the offer
     */
    function getOffer(uint _offerId) external view returns (
        uint id,
        address seller,
        uint energyAmount,
        uint pricePerUnit,
        uint minPurchaseAmount,
        uint expirationTime,
        string memory region,
        bool isCertified,
        bool isActive
    ) {
        require(_offerId < offers.length, "Offer does not exist");
        
        EnergyOffer memory offer = offers[_offerId];
        return (
            offer.id,
            offer.seller,
            offer.energyAmount,
            offer.pricePerUnit,
            offer.minPurchaseAmount,
            offer.expirationTime,
            offer.region,
            offer.isCertified,
            offer.isActive
        );
    }
    
    /**
     * @dev Get all offers in a specific region
     * @param _region Region to query
     * @return Array of offer IDs
     */
    function getRegionOffers(string memory _region) external view returns (uint[] memory) {
        return regionOffers[_region];
    }
    
    /**
     * @dev Get all offers from a specific seller
     * @param _seller Seller address
     * @return Array of offer IDs
     */
    function getSellerOffers(address _seller) external view returns (uint[] memory) {
        return sellerOffers[_seller];
    }
    
    /**
     * @dev Get trades where address is the seller
     * @param _seller Seller address
     * @return Array of trade IDs
     */
    function getSellerTrades(address _seller) external view returns (uint[] memory) {
        return sellerTrades[_seller];
    }
    
    /**
     * @dev Get trades where address is the buyer
     * @param _buyer Buyer address
     * @return Array of trade IDs
     */
    function getBuyerTrades(address _buyer) external view returns (uint[] memory) {
        return buyerTrades[_buyer];
    }
    
    /**
     * @dev Get market metrics
     * @return totalTrades Total number of trades
     * @return totalVolumeTraded Total energy volume traded
     * @return totalValueTraded Total value traded
     * @return averagePrice Average price per kWh
     */
    function getMarketMetrics() external view returns (
        uint totalTrades,
        uint totalVolumeTraded,
        uint totalValueTraded,
        uint averagePrice
    ) {
        return (
            marketMetrics.totalTrades,
            marketMetrics.totalVolumeTraded,
            marketMetrics.totalValueTraded,
            marketMetrics.averagePrice
        );
    }
    
    /**
     * @dev Get market metrics for a specific region
     * @param _region Region to query
     * @return volume Total energy volume traded in the region
     * @return value Total value traded in the region
     * @return averagePrice Average price per kWh in the region
     */
    function getRegionMarketMetrics(string memory _region) external view returns (
        uint volume,
        uint value,
        uint averagePrice
    ) {
        uint vol = marketMetrics.regionVolumes[_region];
        uint val = marketMetrics.regionValues[_region];
        uint price = marketMetrics.regionPrices[_region];
        
        return (vol, val, price);
    }
    
    /**
     * @dev Set the platform fee rate
     * @param _newFeeRate New fee rate in basis points (100 = 1%)
     */
    function setPlatformFeeRate(uint _newFeeRate) external onlyOwner {
        require(_newFeeRate <= 1000, "Fee rate cannot exceed 10%");
        platformFeeRate = _newFeeRate;
    }
    
    /**
     * @dev Set the fee recipient address
     * @param _newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid address");
        feeRecipient = _newFeeRecipient;
    }
    
    /**
     * @dev Set the certificate contract address
     * @param _certificateContract New certificate contract address
     */
    function setCertificateContract(address _certificateContract) external onlyOwner {
        require(_certificateContract != address(0), "Invalid certificate contract address");
        certificateContract = RenewableCertificate(_certificateContract);
    }
    
    /**
     * @dev Set the logger contract address
     * @param _loggerContract New logger contract address
     */
    function setLoggerContract(address _loggerContract) external onlyOwner {
        require(_loggerContract != address(0), "Invalid logger contract address");
        loggerContract = EnergyLogger(_loggerContract);
    }
    
    /**
     * @dev Withdraw any ETH accidentally sent to the contract
     */
    function withdrawETH() external onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}
