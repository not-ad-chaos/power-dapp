// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract EnergyTradeLedger {
    struct Trade {
        address seller;
        address buyer;
        uint energyAmount; // in kWh
        uint timestamp;
    }

    Trade[] public trades;

    function recordTrade(address _seller, address _buyer, uint _energyAmount) external {
        trades.push(Trade(_seller, _buyer, _energyAmount, block.timestamp));
    }

    function getTrade(uint index) external view returns (address, address, uint, uint) {
        Trade memory t = trades[index];
        return (t.seller, t.buyer, t.energyAmount, t.timestamp);
    }
}
