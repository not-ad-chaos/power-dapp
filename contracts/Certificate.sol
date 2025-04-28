// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title RenewableCertificate
 * @dev Contract for managing Renewable Energy Certificates (RECs)
 * This contract allows for minting, transferring, and trading renewable energy certificates
 */
contract RenewableCertificate {
    uint public constant ENERGY_THRESHOLD = 100; // 100 kWh = 1 certificate
    
    struct Certificate {
        uint id;
        uint energyAmount;
        uint issuanceDate;
        string energySource; // e.g., "solar", "wind", "hydro"
        string location;
        bool isValid;
    }
    
    // Mapping from address to certificate count
    mapping(address => uint) public certificateCount;
    
    // Mapping from address to certificate IDs owned
    mapping(address => uint[]) public ownedCertificates;
    
    // Mapping from certificate ID to Certificate details
    mapping(uint => Certificate) public certificates;
    
    // Mapping from certificate ID to owner
    mapping(uint => address) public certificateToOwner;
    
    // Certificate ID counter
    uint private _nextCertificateId = 1;
    
    // Events
    event CertificateMinted(address indexed generator, uint indexed certificateId, uint energyAmount, string energySource);
    event CertificateTransferred(address indexed from, address indexed to, uint indexed certificateId);
    event CertificateRedeemed(address indexed redeemer, uint indexed certificateId);
    
    // Allowed energy sources
    mapping(string => bool) public validEnergySources;
    
    constructor() {
        // Initialize valid energy sources
        validEnergySources["solar"] = true;
        validEnergySources["wind"] = true;
        validEnergySources["hydro"] = true;
        validEnergySources["biomass"] = true;
        validEnergySources["geothermal"] = true;
    }
    
    /**
     * @dev Mint new renewable energy certificates
     */
    function mintCertificate(
        address _generator, 
        uint _energyProduced, 
        string memory _energySource,
        string memory _location
    ) external {
        require(validEnergySources[_energySource], "Invalid energy source");
        require(_energyProduced >= ENERGY_THRESHOLD, "Energy production below threshold");
        
        uint numCerts = _energyProduced / ENERGY_THRESHOLD;
        uint remainingEnergy = _energyProduced;
        
        for (uint i = 0; i < numCerts; i++) {
            uint energyAmountForCert = remainingEnergy >= ENERGY_THRESHOLD ? 
                                      ENERGY_THRESHOLD : 
                                      remainingEnergy;
            
            remainingEnergy -= energyAmountForCert;
            
            Certificate memory newCert = Certificate({
                id: _nextCertificateId,
                energyAmount: energyAmountForCert,
                issuanceDate: block.timestamp,
                energySource: _energySource,
                location: _location,
                isValid: true
            });
            
            certificates[_nextCertificateId] = newCert;
            certificateToOwner[_nextCertificateId] = _generator;
            ownedCertificates[_generator].push(_nextCertificateId);
            
            emit CertificateMinted(_generator, _nextCertificateId, energyAmountForCert, _energySource);
            
            _nextCertificateId++;
        }
        
        certificateCount[_generator] += numCerts;
    }
    
    /**
     * @dev Transfer a certificate from one address to another
     * @param _to Recipient address
     * @param _certificateId ID of the certificate to transfer
     */
    function transferCertificate(address _to, uint _certificateId) external {
        require(_to != address(0), "Invalid recipient address");
        require(certificateToOwner[_certificateId] == msg.sender, "You don't own this certificate");
        require(certificates[_certificateId].isValid, "Certificate is no longer valid");
        
        // Remove certificate from sender's owned certificates
        uint[] storage senderCerts = ownedCertificates[msg.sender];
        for (uint i = 0; i < senderCerts.length; i++) {
            if (senderCerts[i] == _certificateId) {
                // Replace with last element and pop
                senderCerts[i] = senderCerts[senderCerts.length - 1];
                senderCerts.pop();
                break;
            }
        }
        
        // Add certificate to recipient's owned certificates
        ownedCertificates[_to].push(_certificateId);
        
        // Update owner mapping
        certificateToOwner[_certificateId] = _to;
        
        // Update certificate counts
        certificateCount[msg.sender]--;
        certificateCount[_to]++;
        
        emit CertificateTransferred(msg.sender, _to, _certificateId);
    }
    
    /**
     * @dev Redeem a certificate (mark as used)
     * @param _certificateId ID of the certificate to redeem
     */
    function redeemCertificate(uint _certificateId) external {
        require(certificateToOwner[_certificateId] == msg.sender, "You don't own this certificate");
        require(certificates[_certificateId].isValid, "Certificate is already redeemed");
        
        certificates[_certificateId].isValid = false;
        certificateCount[msg.sender]--;
        
        emit CertificateRedeemed(msg.sender, _certificateId);
    }
    
    /**
     * @dev Get the number of valid certificates owned by an address
     * @param _owner Address to check
     * @return Number of valid certificates
     */
    function getCertificates(address _owner) external view returns (uint) {
        return certificateCount[_owner];
    }
    
    /**
     * @dev Get all certificate IDs owned by an address
     * @param _owner Address to check
     * @return Array of certificate IDs
     */
    function getOwnedCertificateIds(address _owner) external view returns (uint[] memory) {
        return ownedCertificates[_owner];
    }
    
    /**
     * @dev Get certificate details by ID
     * @param _certificateId Certificate ID
     */
    function getCertificateDetails(uint _certificateId) external view returns (
        uint id,
        uint energyAmount,
        uint issuanceDate,
        string memory energySource,
        string memory location,
        bool isValid,
        address owner
    ) {
        Certificate memory cert = certificates[_certificateId];

        id = cert.id;
        energyAmount = cert.energyAmount;
        issuanceDate = cert.issuanceDate;
        energySource = cert.energySource;
        location = cert.location;
        isValid = cert.isValid;
        owner = certificateToOwner[_certificateId];
    }
    
    /**
     * @dev Add a new valid energy source (admin function)
     * @param _energySource Energy source to add
     */
    function addEnergySource(string memory _energySource) external {
        // In a real implementation, this would have access control
        validEnergySources[_energySource] = true;
    }
    
    /**
     * @dev Remove a valid energy source (admin function)
     * @param _energySource Energy source to remove
     */
    function removeEnergySource(string memory _energySource) external {
        // In a real implementation, this would have access control
        validEnergySources[_energySource] = false;
    }
}
