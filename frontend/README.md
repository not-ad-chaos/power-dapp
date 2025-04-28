# Energy Blockchain dApp Frontend

This is a Next.js application that interfaces with three Ethereum smart contracts:

1. **Energy Logger** - Allows users to log their energy consumption
2. **Renewable Certificate** - Manages renewable energy certificates
3. **Energy Trader** - Records energy trading transactions between users

## Getting Started

First, make sure you have MetaMask installed and connected to your local blockchain (like Ganache or Hardhat).

Then run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Connect to MetaMask wallet
- Log energy consumption
- Mint renewable energy certificates
- Record energy trades between addresses
- View transaction history

## Smart Contracts

The app interfaces with the following contracts:

- `EnergyLogger.sol` - Track energy consumption readings
- `Certificate.sol` - Issue certificates for renewable energy production
- `EnergyTrader.sol` - Record peer-to-peer energy trading

## Note on Contract Addresses

Currently, the app uses hardcoded contract addresses in the ContractContext component. In a real-world scenario, you would:

1. Deploy the contracts to your desired network
2. Update the contract addresses in the app configuration
3. Possibly use environment variables to manage different deployment environments

## Technologies Used

- Next.js 14
- React
- TypeScript
- ethers.js 5.7
- Tailwind CSS

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
