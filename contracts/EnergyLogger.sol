// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Certificate.sol";

/**
 * @title EnergyLogger
 * @dev Contract for logging energy production and consumption with advanced metrics
 */
contract EnergyLogger {
    // Reading struct to store energy data
    struct Reading {
        uint amount; // in kWh
        uint timestamp;
        string readingType; // "production" or "consumption"
        string source; // For production: "solar", "wind", etc. For consumption: "household", "commercial", etc.
        uint carbonOffset; // Estimated carbon offset in kg of CO2
        address reporter; // Who reported this data
        bool verified; // Whether this reading has been verified
    }
    
    // User Metrics for aggregated data
    struct UserMetrics {
        uint totalProduction;
        uint totalConsumption;
        uint totalCarbonOffset;
        uint lastUpdateTimestamp;
    }
    
    // Grid Metrics for regional data
    struct GridMetrics {
        string region;
        uint totalProduction;
        uint totalConsumption;
        uint participantCount;
        uint lastUpdateTimestamp;
    }
    
    // Mapping from address to consumption readings
    mapping(address => Reading[]) public consumptionLogs;
    
    // Mapping from address to production readings
    mapping(address => Reading[]) public productionLogs;
    
    // Mapping from address to user metrics
    mapping(address => UserMetrics) public userMetrics;
    
    // Mapping from region to grid metrics
    mapping(string => GridMetrics) public gridMetrics;
    
    // Mapping of users by region
    mapping(string => address[]) public regionUsers;
    
    // User's region mapping
    mapping(address => string) public userRegion;
    
    // Reference to the RenewableCertificate contract
    RenewableCertificate private certificateContract;
    
    // Trusted verifiers that can validate readings
    mapping(address => bool) public verifiers;
    
    // Owner of the contract
    address public owner;
    
    // Events
    event ConsumptionLogged(address indexed user, uint amount, uint timestamp);
    event ProductionLogged(address indexed user, uint amount, string source, uint timestamp);
    event ReadingVerified(address indexed verifier, address indexed user, uint readingIndex, bool isProduction);
    event UserRegistered(address indexed user, string region);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Only verifiers can call this function");
        _;
    }
    
    /**
     * @dev Constructor sets the contract owner and certificate contract address
     * @param _certificateContract Address of the RenewableCertificate contract
     */
    constructor(address _certificateContract) {
        owner = msg.sender;
        verifiers[msg.sender] = true;
        certificateContract = RenewableCertificate(_certificateContract);
    }
    
    /**
     * @dev Registers a user to a specific region
     * @param _region Geographic region of the user
     */
    function registerUser(string memory _region) external {
        // If user already has a region, remove them from that region's list
        if (bytes(userRegion[msg.sender]).length > 0) {
            string memory oldRegion = userRegion[msg.sender];
            
            // Find and remove user from old region
            address[] storage oldUsers = regionUsers[oldRegion];
            for (uint i = 0; i < oldUsers.length; i++) {
                if (oldUsers[i] == msg.sender) {
                    oldUsers[i] = oldUsers[oldUsers.length - 1];
                    oldUsers.pop();
                    break;
                }
            }
            
            // Decrement participant count in old region
            gridMetrics[oldRegion].participantCount--;
        }
        
        // Set user's new region
        userRegion[msg.sender] = _region;
        
        // Add user to new region's list
        regionUsers[_region].push(msg.sender);
        
        // Initialize or update grid metrics for this region
        GridMetrics storage metrics = gridMetrics[_region];
        if (metrics.participantCount == 0) {
            // First user in this region
            metrics.region = _region;
            metrics.participantCount = 1;
            metrics.lastUpdateTimestamp = block.timestamp;
        } else {
            // Increment participant count
            metrics.participantCount++;
            metrics.lastUpdateTimestamp = block.timestamp;
        }
        
        emit UserRegistered(msg.sender, _region);
    }
    
    /**
     * @dev Log energy consumption
     * @param _amount Energy consumed in kWh
     * @param _source Source of consumption (e.g., "household", "commercial")
     */
    function logConsumption(uint _amount, string memory _source) external {
        require(bytes(userRegion[msg.sender]).length > 0, "User must be registered to a region");
        
        Reading memory reading = Reading({
            amount: _amount,
            timestamp: block.timestamp,
            readingType: "consumption",
            source: _source,
            carbonOffset: 0, // No carbon offset for consumption
            reporter: msg.sender,
            verified: false
        });
        
        consumptionLogs[msg.sender].push(reading);
        
        // Update user metrics
        UserMetrics storage metrics = userMetrics[msg.sender];
        metrics.totalConsumption += _amount;
        metrics.lastUpdateTimestamp = block.timestamp;
        
        // Update grid metrics
        string memory region = userRegion[msg.sender];
        gridMetrics[region].totalConsumption += _amount;
        gridMetrics[region].lastUpdateTimestamp = block.timestamp;
        
        emit ConsumptionLogged(msg.sender, _amount, block.timestamp);
    }
    
    /**
     * @dev Log energy production
     * @param _amount Energy produced in kWh
     * @param _source Source of production (e.g., "solar", "wind")
     * @param _estimatedCarbonOffset Estimated carbon offset in kg of CO2
     */
    function logProduction(uint _amount, string memory _source, uint _estimatedCarbonOffset) external {
        require(bytes(userRegion[msg.sender]).length > 0, "User must be registered to a region");
        
        Reading memory reading = Reading({
            amount: _amount,
            timestamp: block.timestamp,
            readingType: "production",
            source: _source,
            carbonOffset: _estimatedCarbonOffset,
            reporter: msg.sender,
            verified: false
        });
        
        productionLogs[msg.sender].push(reading);
        
        // Update user metrics
        UserMetrics storage metrics = userMetrics[msg.sender];
        metrics.totalProduction += _amount;
        metrics.totalCarbonOffset += _estimatedCarbonOffset;
        metrics.lastUpdateTimestamp = block.timestamp;
        
        // Update grid metrics
        string memory region = userRegion[msg.sender];
        gridMetrics[region].totalProduction += _amount;
        gridMetrics[region].lastUpdateTimestamp = block.timestamp;
        
        emit ProductionLogged(msg.sender, _amount, _source, block.timestamp);
    }
    
    /**
     * @dev Verify a production reading and mint certificates
     * @param _user Address of the user
     * @param _readingIndex Index of the reading to verify
     */
    function verifyProductionAndMintCertificate(address _user, uint _readingIndex) external onlyVerifier {
        require(_readingIndex < productionLogs[_user].length, "Reading index out of bounds");
        
        Reading storage reading = productionLogs[_user][_readingIndex];
        require(!reading.verified, "Reading already verified");
        
        // Mark reading as verified
        reading.verified = true;
        
        // Mint renewable certificates
        if (reading.amount >= 100) {
            certificateContract.mintCertificate(
                _user,
                reading.amount,
                reading.source,
                userRegion[_user]
            );
        }
        
        emit ReadingVerified(msg.sender, _user, _readingIndex, true);
    }
    
    /**
     * @dev Verify a consumption reading
     * @param _user Address of the user
     * @param _readingIndex Index of the reading to verify
     */
    function verifyConsumption(address _user, uint _readingIndex) external onlyVerifier {
        require(_readingIndex < consumptionLogs[_user].length, "Reading index out of bounds");
        
        Reading storage reading = consumptionLogs[_user][_readingIndex];
        require(!reading.verified, "Reading already verified");
        
        // Mark reading as verified
        reading.verified = true;
        
        emit ReadingVerified(msg.sender, _user, _readingIndex, false);
    }
    
    /**
     * @dev Add a new verifier
     * @param _verifier Address of the new verifier
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        require(!verifiers[_verifier], "Address is already a verifier");
        
        verifiers[_verifier] = true;
        
        emit VerifierAdded(_verifier);
    }
    
    /**
     * @dev Remove a verifier
     * @param _verifier Address of the verifier to remove
     */
    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier], "Address is not a verifier");
        require(_verifier != owner, "Cannot remove owner as verifier");
        
        verifiers[_verifier] = false;
        
        emit VerifierRemoved(_verifier);
    }
    
    /**
     * @dev Get consumption log details
     * @param _user Address of the user
     * @param _index Index of the reading
     */
    function getConsumptionLog(address _user, uint _index) external view returns (
        uint amount,
        uint timestamp,
        string memory readingType,
        string memory source,
        uint carbonOffset,
        address reporter,
        bool verified
    ) {
        require(_index < consumptionLogs[_user].length, "Reading index out of bounds");
        
        Reading memory reading = consumptionLogs[_user][_index];
        return (
            reading.amount,
            reading.timestamp,
            reading.readingType,
            reading.source,
            reading.carbonOffset,
            reading.reporter,
            reading.verified
        );
    }
    
    /**
     * @dev Get production log details
     * @param _user Address of the user
     * @param _index Index of the reading
     */
    function getProductionLog(address _user, uint _index) external view returns (
        uint amount,
        uint timestamp,
        string memory readingType,
        string memory source,
        uint carbonOffset,
        address reporter,
        bool verified
    ) {
        require(_index < productionLogs[_user].length, "Reading index out of bounds");
        
        Reading memory reading = productionLogs[_user][_index];
        return (
            reading.amount,
            reading.timestamp,
            reading.readingType,
            reading.source,
            reading.carbonOffset,
            reading.reporter,
            reading.verified
        );
    }
    
    /**
     * @dev Get the number of consumption logs for a user
     * @param _user Address of the user
     * @return Number of consumption logs
     */
    function getConsumptionLogsCount(address _user) external view returns (uint) {
        return consumptionLogs[_user].length;
    }
    
    /**
     * @dev Get the number of production logs for a user
     * @param _user Address of the user
     * @return Number of production logs
     */
    function getProductionLogsCount(address _user) external view returns (uint) {
        return productionLogs[_user].length;
    }
    
    /**
     * @dev Get region metrics
     * @param _region Region name
     */
    function getRegionMetrics(string memory _region) external view returns (
        string memory region,
        uint totalProduction,
        uint totalConsumption,
        uint participantCount,
        uint lastUpdateTimestamp
    ) {
        GridMetrics memory metrics = gridMetrics[_region];
        return (
            metrics.region,
            metrics.totalProduction,
            metrics.totalConsumption,
            metrics.participantCount,
            metrics.lastUpdateTimestamp
        );
    }
    
    /**
     * @dev Set the certificate contract address
     * @param _certificateContract New certificate contract address
     */
    function setCertificateContract(address _certificateContract) external onlyOwner {
        require(_certificateContract != address(0), "Invalid certificate contract address");
        certificateContract = RenewableCertificate(_certificateContract);
    }
}
