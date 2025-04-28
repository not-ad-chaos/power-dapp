// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract EnergyLogger {
    struct Reading {
        uint amount; // in kWh
        uint timestamp;
    }

    mapping(address => Reading[]) public consumptionLogs;

    function logConsumption(uint _amount) external {
        consumptionLogs[msg.sender].push(Reading(_amount, block.timestamp));
    }

    function getConsumptionLog(address _user, uint _index) external view returns (uint, uint) {
        Reading memory r = consumptionLogs[_user][_index];
        return (r.amount, r.timestamp);
    }
}
