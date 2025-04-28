// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RenewableCertificate {
    uint public constant ENERGY_THRESHOLD = 100; // 100 kWh = 1 certificate

    mapping(address => uint) public certificates;

    function mintCertificate(address _generator, uint _energyProduced) external {
        uint certs = _energyProduced / ENERGY_THRESHOLD;
        certificates[_generator] += certs;
    }

    function getCertificates(address _owner) external view returns (uint) {
        return certificates[_owner];
    }
}
