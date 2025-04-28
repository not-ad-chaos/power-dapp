"use client"

import { useState, useEffect } from "react"
import { useContract } from "../contexts/ContractContext"

export default function RenewableCertificateCard() {
    const {
        renewableCertificate,
        account,
        isConnected,
        certificateCount,
        ownedCertificates,
        refreshCertificateData,
        userRegion,
        isLoading,
    } = useContract()

    const [energyAmount, setEnergyAmount] = useState<string>("")
    const [generatorAddress, setGeneratorAddress] = useState<string>("")
    const [energySource, setEnergySource] = useState<string>("solar")
    const [location, setLocation] = useState<string>("")
    const [showDetails, setShowDetails] = useState<boolean>(false)
    const [selectedCertificate, setSelectedCertificate] = useState<any>(null)
    const [transferAddress, setTransferAddress] = useState<string>("")
    const [mintLoading, setMintLoading] = useState<boolean>(false)
    const [transferLoading, setTransferLoading] = useState<boolean>(false)
    const [redeemLoading, setRedeemLoading] = useState<boolean>(false)

    useEffect(() => {
        if (isConnected) {
            refreshCertificateData()
        }
    }, [isConnected, refreshCertificateData])

    useEffect(() => {
        if (userRegion) {
            setLocation(userRegion)
        }
    }, [userRegion])

    const handleMintCertificate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!renewableCertificate || !energyAmount || !generatorAddress || !energySource || !location) return

        setMintLoading(true)
        try {
            const tx = await renewableCertificate.mintCertificate(
                generatorAddress,
                parseInt(energyAmount),
                energySource,
                location
            )
            await tx.wait()

            setEnergyAmount("")
            setGeneratorAddress("")

            // Refresh certificate data
            await refreshCertificateData()
        } catch (error) {
            console.error("Error minting certificate:", error)
        } finally {
            setMintLoading(false)
        }
    }

    const handleCertificateSelect = (certificate: any) => {
        setSelectedCertificate(certificate)
        setShowDetails(true)
    }

    const handleTransferCertificate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!renewableCertificate || !selectedCertificate || !transferAddress) return

        setTransferLoading(true)
        try {
            const tx = await renewableCertificate.transferCertificate(transferAddress, selectedCertificate.id)
            await tx.wait()

            setTransferAddress("")
            setShowDetails(false)
            setSelectedCertificate(null)

            // Refresh certificate data
            await refreshCertificateData()
        } catch (error) {
            console.error("Error transferring certificate:", error)
        } finally {
            setTransferLoading(false)
        }
    }

    const handleRedeemCertificate = async () => {
        if (!renewableCertificate || !selectedCertificate) return

        setRedeemLoading(true)
        try {
            const tx = await renewableCertificate.redeemCertificate(selectedCertificate.id)
            await tx.wait()

            setShowDetails(false)
            setSelectedCertificate(null)

            // Refresh certificate data
            await refreshCertificateData()
        } catch (error) {
            console.error("Error redeeming certificate:", error)
        } finally {
            setRedeemLoading(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">Renewable Energy Certificates</h2>

            {isConnected ? (
                <>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Your Certificates</h3>
                        <div className="text-3xl font-bold text-blue-600">{certificateCount}</div>
                        <div className="text-sm text-gray-500 mt-1">
                            Each certificate represents renewable energy production
                        </div>
                    </div>

                    {!showDetails ? (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-2 text-gray-700">Your Certificate Portfolio</h3>
                                {isLoading ? (
                                    <p className="text-center py-4">Loading certificates...</p>
                                ) : ownedCertificates.length === 0 ? (
                                    <p className="text-center py-4 text-gray-500">You don't own any certificates yet</p>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {ownedCertificates.map((cert, index) => (
                                            <div
                                                key={index}
                                                className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                                onClick={() => handleCertificateSelect(cert)}>
                                                <div>
                                                    <span className="font-medium">{cert.energyAmount} kWh</span>
                                                    <span className="text-sm text-gray-500 ml-2">
                                                        ({cert.energySource})
                                                    </span>
                                                </div>
                                                <span className="text-sm text-gray-400">{cert.issuanceDate}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleMintCertificate} className="mb-4">
                                <h3 className="text-lg font-semibold mb-2 text-gray-700">Mint New Certificate</h3>
                                <div className="mb-4">
                                    <label htmlFor="generator-address" className="block text-gray-700 mb-2">
                                        Generator Address
                                    </label>
                                    <input
                                        id="generator-address"
                                        type="text"
                                        value={generatorAddress}
                                        onChange={(e) => setGeneratorAddress(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0x..."
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="energy-produced" className="block text-gray-700 mb-2">
                                        Energy Produced (kWh)
                                    </label>
                                    <input
                                        id="energy-produced"
                                        type="number"
                                        value={energyAmount}
                                        onChange={(e) => setEnergyAmount(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter amount in kWh"
                                        required
                                        min="100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minimum 100 kWh required</p>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="energy-source" className="block text-gray-700 mb-2">
                                        Energy Source
                                    </label>
                                    <select
                                        id="energy-source"
                                        value={energySource}
                                        onChange={(e) => setEnergySource(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required>
                                        <option value="solar">Solar</option>
                                        <option value="wind">Wind</option>
                                        <option value="hydro">Hydro</option>
                                        <option value="biomass">Biomass</option>
                                        <option value="geothermal">Geothermal</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="location" className="block text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        id="location"
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter location (e.g., California)"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={mintLoading}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                                    {mintLoading ? "Minting..." : "Mint Certificate"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">Certificate Details</h3>
                                <button
                                    onClick={() => {
                                        setShowDetails(false)
                                        setSelectedCertificate(null)
                                        setTransferAddress("")
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800">
                                    Back to List
                                </button>
                            </div>

                            {selectedCertificate && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-gray-600">Certificate ID:</div>
                                            <div className="font-medium">{selectedCertificate.id}</div>

                                            <div className="text-gray-600">Energy Amount:</div>
                                            <div className="font-medium">{selectedCertificate.energyAmount} kWh</div>

                                            <div className="text-gray-600">Energy Source:</div>
                                            <div className="font-medium">{selectedCertificate.energySource}</div>

                                            <div className="text-gray-600">Location:</div>
                                            <div className="font-medium">{selectedCertificate.location}</div>

                                            <div className="text-gray-600">Issuance Date:</div>
                                            <div className="font-medium">{selectedCertificate.issuanceDate}</div>

                                            <div className="text-gray-600">Status:</div>
                                            <div className="font-medium">
                                                {selectedCertificate.isValid ? "Valid" : "Redeemed"}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedCertificate.isValid && (
                                        <>
                                            <form onSubmit={handleTransferCertificate} className="space-y-4">
                                                <div>
                                                    <label
                                                        htmlFor="transfer-address"
                                                        className="block text-gray-700 mb-2">
                                                        Transfer to Address
                                                    </label>
                                                    <input
                                                        id="transfer-address"
                                                        type="text"
                                                        value={transferAddress}
                                                        onChange={(e) => setTransferAddress(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="0x..."
                                                        required
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={transferLoading}
                                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                                                    {transferLoading ? "Transferring..." : "Transfer Certificate"}
                                                </button>
                                            </form>

                                            <div className="border-t pt-4">
                                                <h4 className="font-medium mb-2">Redeem Certificate</h4>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Redeeming makes the certificate invalid. This action cannot be
                                                    undone.
                                                </p>
                                                <button
                                                    onClick={handleRedeemCertificate}
                                                    disabled={redeemLoading}
                                                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400">
                                                    {redeemLoading ? "Redeeming..." : "Redeem Certificate"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Connect your wallet to view and mint certificates</p>
                </div>
            )}
        </div>
    )
}
