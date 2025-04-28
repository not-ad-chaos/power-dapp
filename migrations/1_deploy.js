const fs = require("fs")
const path = require("path")
const RenewableCertificate = artifacts.require("RenewableCertificate")
const EnergyLogger = artifacts.require("EnergyLogger")
const EnergyTradeLedger = artifacts.require("EnergyTradeLedger")

module.exports = async function (deployer, network, accounts) {
    // Deploy the certificate contract first
    await deployer.deploy(RenewableCertificate)
    const renewableCertificate = await RenewableCertificate.deployed()
    console.log(`RenewableCertificate deployed at: ${renewableCertificate.address}`)

    // Deploy the energy logger with certificate contract address
    await deployer.deploy(EnergyLogger, renewableCertificate.address)
    const energyLogger = await EnergyLogger.deployed()
    console.log(`EnergyLogger deployed at: ${energyLogger.address}`)

    // Deploy the trade ledger with both certificate and logger addresses
    await deployer.deploy(EnergyTradeLedger, renewableCertificate.address, energyLogger.address)
    const energyTradeLedger = await EnergyTradeLedger.deployed()
    console.log(`EnergyTradeLedger deployed at: ${energyTradeLedger.address}`)

    // Create contract addresses object
    const contractAddresses = {
        networkId: deployer.network_id.toString(),
        addresses: {
            ENERGY_LOGGER: energyLogger.address,
            RENEWABLE_CERTIFICATE: renewableCertificate.address,
            ENERGY_TRADER: energyTradeLedger.address,
        },
    }

    // Create frontend/src/constants directory if it doesn't exist
    const constantsDir = path.resolve(__dirname, "../frontend/src/constants")
    if (!fs.existsSync(constantsDir)) {
        fs.mkdirSync(constantsDir, { recursive: true })
    }

    // Write contracts.json to frontend/src/constants
    fs.writeFileSync(path.join(constantsDir, "contracts.json"), JSON.stringify(contractAddresses, null, 2))

    // Create frontend/src/artifacts directory if it doesn't exist
    const artifactsDir = path.resolve(__dirname, "../frontend/src/artifacts")
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true })
    }

    // Copy contract ABI files from build/contracts to frontend/src/artifacts
    const buildDir = path.resolve(__dirname, "../build/contracts")

    // Check if build directory exists
    if (fs.existsSync(buildDir)) {
        // Read all files in the build/contracts directory
        const files = fs.readdirSync(buildDir)

        // Copy each ABI file to the artifacts directory
        files.forEach((file) => {
            const filePath = path.join(buildDir, file)
            const destPath = path.join(artifactsDir, file)

            if (fs.statSync(filePath).isFile()) {
                fs.copyFileSync(filePath, destPath)
                console.log(`Copied ${file} to frontend/src/artifacts`)
            }
        })
    } else {
        console.error("build/contracts directory does not exist")
    }

    console.log("Contract addresses exported to frontend/src/constants/contracts.json")
    console.log("Contract ABIs copied to frontend/src/artifacts")
}
