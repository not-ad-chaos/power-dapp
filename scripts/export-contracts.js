const fs = require('fs');
const path = require('path');

// Function to export contract addresses
async function exportContracts() {
  try {
    // Path to contract artifacts
    const buildPath = path.resolve(__dirname, '../build/contracts');
    
    // Path to output file in frontend directory
    const outputPath = path.resolve(__dirname, '../frontend/src/contracts/contracts.json');
    
    // Check if build/contracts directory exists
    if (!fs.existsSync(buildPath)) {
      console.error('Error: build/contracts directory not found. Make sure contracts are compiled.');
      process.exit(1);
    }
    
    // Create contracts directory in frontend if it doesn't exist
    const frontendContractsDir = path.resolve(__dirname, '../frontend/src/contracts');
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
    }
    
    // Read contract artifacts
    const energyLoggerArtifact = JSON.parse(fs.readFileSync(path.join(buildPath, 'EnergyLogger.json')));
    const certificateArtifact = JSON.parse(fs.readFileSync(path.join(buildPath, 'RenewableCertificate.json')));
    const energyTraderArtifact = JSON.parse(fs.readFileSync(path.join(buildPath, 'EnergyTradeLedger.json')));
    
    // Extract networks data
    const networks = {};
    
    // Iterate through all network IDs in the artifacts
    for (const networkId in energyLoggerArtifact.networks) {
      networks[networkId] = {
        ENERGY_LOGGER: energyLoggerArtifact.networks[networkId]?.address || null,
        RENEWABLE_CERTIFICATE: certificateArtifact.networks[networkId]?.address || null,
        ENERGY_TRADER: energyTraderArtifact.networks[networkId]?.address || null
      };
    }
    
    // Create contracts data object
    const contractsData = {
      networks,
      // Also include ABIs for easy access in frontend
      abi: {
        ENERGY_LOGGER: energyLoggerArtifact.abi,
        RENEWABLE_CERTIFICATE: certificateArtifact.abi,
        ENERGY_TRADER: energyTraderArtifact.abi
      }
    };
    
    // Write to frontend directory
    fs.writeFileSync(outputPath, JSON.stringify(contractsData, null, 2));
    
    // Copy the individual contract files as well for reference
    fs.copyFileSync(
      path.join(buildPath, 'EnergyLogger.json'),
      path.join(frontendContractsDir, 'EnergyLogger.json')
    );
    
    fs.copyFileSync(
      path.join(buildPath, 'RenewableCertificate.json'),
      path.join(frontendContractsDir, 'RenewableCertificate.json')
    );
    
    fs.copyFileSync(
      path.join(buildPath, 'EnergyTradeLedger.json'),
      path.join(frontendContractsDir, 'EnergyTradeLedger.json')
    );
    
    console.log('Contract data successfully exported to frontend/src/contracts/contracts.json');
  } catch (error) {
    console.error('Error exporting contract data:', error);
    process.exit(1);
  }
}

// Run the export function
exportContracts(); 