"use client"

import Navbar from "../components/Navbar"
import EnergyLoggerCard from "../components/EnergyLoggerCard"
import RenewableCertificateCard from "../components/RenewableCertificateCard"
import EnergyTraderCard from "../components/EnergyTraderCard"
import EnergyMarketplace from "../components/EnergyMarketplace"
import { ContractProvider } from "../contexts/ContractContext"

export default function Home() {
    return (
        <ContractProvider>
            <main className="min-h-screen bg-gray-100">
                <Navbar />

                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Decentralized Energy Platform</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Energy Management</h2>
                            <div className="space-y-6">
                                <EnergyLoggerCard />
                                <RenewableCertificateCard />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Energy Trading</h2>
                            <div className="space-y-6">
                                <EnergyMarketplace />
                                <EnergyTraderCard />
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 text-center text-gray-700">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">About This Platform</h3>
                        <p className="max-w-3xl mx-auto">
                            This decentralized application enables users to log energy production and consumption, earn
                            renewable energy certificates, and participate in peer-to-peer energy trading. Built on
                            blockchain technology, it ensures transparency, security, and efficiency in the energy
                            marketplace.
                        </p>
                    </div>
                </div>
            </main>
        </ContractProvider>
    )
}
