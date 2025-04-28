const fs = require('fs');
const path = require('path');
const RenewableCertificate = artifacts.require("RenewableCertificate");
const EnergyLogger = artifacts.require("EnergyLogger");
const EnergyTradeLedger = artifacts.require("EnergyTradeLedger");

module.exports = async function (deployer, network, accounts) {
  // Deploy contracts
  await deployer.deploy(RenewableCertificate);
  await deployer.deploy(EnergyLogger);
  await deployer.deploy(EnergyTradeLedger);
  
  // Get deployed contract instances
  const renewableCertificate = await RenewableCertificate.deployed();
  const energyLogger = await EnergyLogger.deployed();
  const energyTradeLedger = await EnergyTradeLedger.deployed();
  
  // Create contract addresses object
  const contractAddresses = {
    networkId: deployer.network_id.toString(),
    addresses: {
      ENERGY_LOGGER: energyLogger.address,
      RENEWABLE_CERTIFICATE: renewableCertificate.address,
      ENERGY_TRADER: energyTradeLedger.address
    },
    abi: {
      ENERGY_LOGGER: EnergyLogger.abi,
      RENEWABLE_CERTIFICATE: RenewableCertificate.abi,
      ENERGY_TRADER: EnergyTradeLedger.abi
    }
  };
  
  // Create frontend/src/contracts directory if it doesn't exist
  const contractsDir = path.resolve(__dirname, '../build/');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  // Write contracts.json to frontend/src/contracts
  fs.writeFileSync(
    path.join(contractsDir, 'contracts.json'),
    JSON.stringify(contractAddresses, null, 2)
  );

  console.log('Contract addresses exported');
}; 

