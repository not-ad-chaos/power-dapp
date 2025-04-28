const fs = require("fs")
const path = require("path")

/**
 * This script copies the contract artifacts from build/contracts to frontend/src/artifacts
 * and saves contract addresses to frontend/src/constants/contracts.json
 */
async function main() {
    const buildDir = path.resolve(__dirname, "../build/contracts")
    const artifactsDir = path.resolve(__dirname, "../frontend/src/artifacts")
    const constantsDir = path.resolve(__dirname, "../frontend/src/constants")

    // Ensure the directories exist
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true })
    }

    if (!fs.existsSync(constantsDir)) {
        fs.mkdirSync(constantsDir, { recursive: true })
    }

    // Check if build directory exists
    if (!fs.existsSync(buildDir)) {
        console.error("Error: build/contracts directory does not exist. Please run truffle compile first.")
        process.exit(1)
    }

    // Copy contract ABI files from build/contracts to frontend/src/artifacts
    const files = fs.readdirSync(buildDir)

    // Initialize contract addresses object
    const contractAddresses = {
        networkId: "development", // Default network
        addresses: {},
    }

    // Copy each ABI file to the artifacts directory
    files.forEach((file) => {
        const filePath = path.join(buildDir, file)
        const destPath = path.join(artifactsDir, file)

        if (fs.statSync(filePath).isFile()) {
            // Copy the file
            fs.copyFileSync(filePath, destPath)
            console.log(`Copied ${file} to frontend/src/artifacts`)

            // Extract contract name and address from the file
            try {
                const contractData = JSON.parse(fs.readFileSync(filePath, "utf8"))
                const contractName = contractData.contractName

                // Get the most recent network deployment
                const networks = contractData.networks
                if (networks && Object.keys(networks).length > 0) {
                    const latestNetworkId = Object.keys(networks)[Object.keys(networks).length - 1]
                    const address = networks[latestNetworkId].address

                    // Add to contractAddresses
                    if (contractName && address) {
                        contractAddresses.addresses[contractName.toUpperCase()] = address
                        contractAddresses.networkId = latestNetworkId
                    }
                }
            } catch (err) {
                console.error(`Error processing ${file}: ${err.message}`)
            }
        }
    })

    // Write contracts.json to frontend/src/constants
    fs.writeFileSync(path.join(constantsDir, "contracts.json"), JSON.stringify(contractAddresses, null, 2))

    console.log("Contract addresses exported to frontend/src/constants/contracts.json")
    console.log("Contract ABIs copied to frontend/src/artifacts")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
