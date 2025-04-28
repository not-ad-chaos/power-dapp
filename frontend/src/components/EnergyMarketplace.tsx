"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useContract } from "../contexts/ContractContext"

export default function EnergyMarketplace() {
    const {
        energyTrader,
        account,
        isConnected,
        userRegion,
        setUserRegion,
        marketOffers,
        refreshCertificateData,
        isLoading,
    } = useContract()

    const [createOfferView, setCreateOfferView] = useState<boolean>(false)
    const [regionInput, setRegionInput] = useState<string>("")

    // Create offer form state
    const [energyAmount, setEnergyAmount] = useState<string>("")
    const [pricePerUnit, setPricePerUnit] = useState<string>("")
    const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>("")
    const [expirationTime, setExpirationTime] = useState<string>("")
    const [isCertified, setIsCertified] = useState<boolean>(false)

    // Purchase state
    const [selectedOffer, setSelectedOffer] = useState<any>(null)
    const [purchaseAmount, setPurchaseAmount] = useState<string>("")
    const [purchaseModalOpen, setPurchaseModalOpen] = useState<boolean>(false)

    // Loading states
    const [creatingOffer, setCreatingOffer] = useState<boolean>(false)
    const [registeringRegion, setRegisteringRegion] = useState<boolean>(false)
    const [purchasingEnergy, setPurchasingEnergy] = useState<boolean>(false)

    const inputClasses =
        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
    const labelClasses = "block text-gray-800 mb-2"

    const handleRegisterRegion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!energyTrader || !regionInput) return

        console.log("Registering region:", energyTrader.address)

        setRegisteringRegion(true)
        try {
            // Assuming EnergyLogger has a registerUser function
            const tx = await energyTrader.registerUser(regionInput)
            await tx.wait()

            setUserRegion(regionInput)
            setRegionInput("")
        } catch (error) {
            console.error("Error registering region:", error)
        } finally {
            setRegisteringRegion(false)
        }
    }

    const handleCreateOffer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!energyTrader || !energyAmount || !pricePerUnit || !minPurchaseAmount || !expirationTime) return

        setCreatingOffer(true)
        try {
            // Convert price to wei
            const priceInWei = ethers.utils.parseEther(pricePerUnit)

            // Calculate expiration timestamp (current time + hours)
            const hoursFromNow = parseInt(expirationTime)
            const expirationTimestamp = Math.floor(Date.now() / 1000) + hoursFromNow * 60 * 60

            const tx = await energyTrader.createOffer(
                parseInt(energyAmount),
                priceInWei,
                parseInt(minPurchaseAmount),
                expirationTimestamp,
                userRegion,
                isCertified
            )
            await tx.wait()

            // Reset form
            setEnergyAmount("")
            setPricePerUnit("")
            setMinPurchaseAmount("")
            setExpirationTime("")
            setIsCertified(false)
            setCreateOfferView(false)

            // Refresh market offers
            await refreshCertificateData()
        } catch (error) {
            console.error("Error creating offer:", error)
        } finally {
            setCreatingOffer(false)
        }
    }

    const handleSelectOffer = (offer: any) => {
        setSelectedOffer(offer)
        setPurchaseAmount(offer.minPurchaseAmount)
        setPurchaseModalOpen(true)
    }

    const handlePurchaseEnergy = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!energyTrader || !selectedOffer || !purchaseAmount) return

        setPurchasingEnergy(true)
        try {
            const amountToPurchase = parseInt(purchaseAmount)
            const totalPrice = ethers.utils.parseEther(
                (parseFloat(selectedOffer.pricePerUnit) * amountToPurchase).toString()
            )

            const tx = await energyTrader.acceptOffer(selectedOffer.id, amountToPurchase, { value: totalPrice })
            await tx.wait()

            // Close modal and reset
            setPurchaseModalOpen(false)
            setSelectedOffer(null)
            setPurchaseAmount("")

            // Refresh market offers
            await refreshCertificateData()
        } catch (error) {
            console.error("Error purchasing energy:", error)
        } finally {
            setPurchasingEnergy(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Energy Marketplace</h2>

            {isConnected ? (
                <>
                    {!userRegion ? (
                        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Register Your Region</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                You need to register to a region before trading energy.
                            </p>

                            <form onSubmit={handleRegisterRegion}>
                                <div className="mb-4">
                                    <label htmlFor="region" className={labelClasses}>
                                        Your Region
                                    </label>
                                    <input
                                        id="region"
                                        type="text"
                                        value={regionInput}
                                        onChange={(e) => setRegionInput(e.target.value)}
                                        className={inputClasses}
                                        placeholder="e.g., California"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={registeringRegion}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400">
                                    {registeringRegion ? "Registering..." : "Register"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 p-4 bg-green-50 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800">Your Trading Region</h3>
                                <div className="text-xl font-bold text-green-600">{userRegion}</div>
                                <div className="text-sm text-gray-700 mt-1">
                                    You can trade energy within this region
                                </div>
                            </div>

                            {!createOfferView ? (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Available Energy Offers</h3>
                                        <button
                                            onClick={() => setCreateOfferView(true)}
                                            className="bg-green-600 text-white py-1 px-4 rounded-md hover:bg-green-700 transition-colors text-sm">
                                            Create Offer
                                        </button>
                                    </div>

                                    {isLoading ? (
                                        <p className="text-center py-8">Loading market offers...</p>
                                    ) : marketOffers.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-700">No active energy offers in your region</p>
                                            <button
                                                onClick={() => setCreateOfferView(true)}
                                                className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                                                Be the First to Create an Offer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {marketOffers.map((offer, index) => (
                                                <div
                                                    key={index}
                                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-medium text-lg">
                                                            {offer.energyAmount} kWh
                                                        </span>
                                                        <span className="text-green-600 font-bold">
                                                            {offer.pricePerUnit} ETH/kWh
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
                                                        <div>Seller:</div>
                                                        <div className="truncate">{offer.seller}</div>

                                                        <div>Min Purchase:</div>
                                                        <div>{offer.minPurchaseAmount} kWh</div>

                                                        <div>Expires:</div>
                                                        <div>{formatDate(offer.expirationTime)}</div>

                                                        <div>Certified:</div>
                                                        <div>{offer.isCertified ? "Yes" : "No"}</div>
                                                    </div>

                                                    {offer.seller.toLowerCase() !== account.toLowerCase() && (
                                                        <button
                                                            onClick={() => handleSelectOffer(offer)}
                                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                                                            Purchase Energy
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Create Energy Offer</h3>
                                        <button
                                            onClick={() => setCreateOfferView(false)}
                                            className="text-green-600 hover:text-green-800">
                                            Back to Offers
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateOffer} className="space-y-4">
                                        <div>
                                            <label htmlFor="energy-amount" className={labelClasses}>
                                                Energy Amount (kWh)
                                            </label>
                                            <input
                                                id="energy-amount"
                                                type="number"
                                                value={energyAmount}
                                                onChange={(e) => setEnergyAmount(e.target.value)}
                                                className={inputClasses}
                                                placeholder="Enter amount to sell"
                                                required
                                                min="1"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="price-per-unit" className={labelClasses}>
                                                Price per kWh (ETH)
                                            </label>
                                            <input
                                                id="price-per-unit"
                                                type="text"
                                                value={pricePerUnit}
                                                onChange={(e) => setPricePerUnit(e.target.value)}
                                                className={inputClasses}
                                                placeholder="e.g., 0.001"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="min-purchase" className={labelClasses}>
                                                Minimum Purchase Amount (kWh)
                                            </label>
                                            <input
                                                id="min-purchase"
                                                type="number"
                                                value={minPurchaseAmount}
                                                onChange={(e) => setMinPurchaseAmount(e.target.value)}
                                                className={inputClasses}
                                                placeholder="Minimum kWh per purchase"
                                                required
                                                min="1"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="expiration" className={labelClasses}>
                                                Expiration Time (hours from now)
                                            </label>
                                            <input
                                                id="expiration"
                                                type="number"
                                                value={expirationTime}
                                                onChange={(e) => setExpirationTime(e.target.value)}
                                                className={inputClasses}
                                                placeholder="e.g., 24"
                                                required
                                                min="1"
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                id="certified"
                                                type="checkbox"
                                                checked={isCertified}
                                                onChange={(e) => setIsCertified(e.target.checked)}
                                                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="certified" className={labelClasses}>
                                                Include renewable energy certificate
                                            </label>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={creatingOffer}
                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400">
                                            {creatingOffer ? "Creating Offer..." : "Create Offer"}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Purchase Modal */}
                            {purchaseModalOpen && selectedOffer && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                                        <h3 className="text-xl font-bold mb-4">Purchase Energy</h3>

                                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-gray-700">Seller:</div>
                                                <div className="truncate">{selectedOffer.seller}</div>

                                                <div className="text-gray-700">Available Energy:</div>
                                                <div>{selectedOffer.energyAmount} kWh</div>

                                                <div className="text-gray-700">Price per kWh:</div>
                                                <div className="text-green-600 font-bold">
                                                    {selectedOffer.pricePerUnit} ETH
                                                </div>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePurchaseEnergy}>
                                            <div className="mb-4">
                                                <label htmlFor="purchase-amount" className={labelClasses}>
                                                    Purchase Amount (kWh)
                                                </label>
                                                <input
                                                    id="purchase-amount"
                                                    type="number"
                                                    value={purchaseAmount}
                                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                                    className={inputClasses}
                                                    min={selectedOffer.minPurchaseAmount}
                                                    max={selectedOffer.energyAmount}
                                                    required
                                                />
                                                <p className="text-xs text-gray-700 mt-1">
                                                    Min: {selectedOffer.minPurchaseAmount} kWh, Max:{" "}
                                                    {selectedOffer.energyAmount} kWh
                                                </p>
                                            </div>

                                            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Total Cost:</span>
                                                    <span className="font-bold">
                                                        {(
                                                            parseFloat(selectedOffer.pricePerUnit) *
                                                            (purchaseAmount ? parseInt(purchaseAmount) : 0)
                                                        ).toFixed(6)}{" "}
                                                        ETH
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPurchaseModalOpen(false)
                                                        setSelectedOffer(null)
                                                    }}
                                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={purchasingEnergy}
                                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400">
                                                    {purchasingEnergy ? "Processing..." : "Confirm Purchase"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-700 mb-4">Connect your wallet to access the energy marketplace</p>
                </div>
            )}
        </div>
    )
}
