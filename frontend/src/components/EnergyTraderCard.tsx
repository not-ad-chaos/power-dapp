"use client"

import { useState, useEffect } from "react"
import { useContract } from "../contexts/ContractContext"

interface Trade {
    seller: string
    buyer: string
    energyAmount: number
    timestamp: number
}

export default function EnergyTraderCard() {
    const { energyTrader, account, isConnected, userRegion } = useContract()
    const [buyerAddress, setBuyerAddress] = useState<string>("")
    const [energyAmount, setEnergyAmount] = useState<string>("")
    const [pricePerUnit, setPricePerUnit] = useState<string>("")
    const [trades, setTrades] = useState<Trade[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false)

    // Fetch recent trades
    const fetchTrades = async () => {
        if (!energyTrader) return

        setIsLoadingTrades(true)
        try {
            const newTrades: Trade[] = []
            let index = 0
            let hasMore = true

            // Fetch up to 10 most recent trades (this is a simplified way - in a real app you'd use events)
            while (hasMore && index < 10) {
                try {
                    const tradeData = await energyTrader.getTrade(index)
                    newTrades.push({
                        seller: tradeData.seller,
                        buyer: tradeData.buyer,
                        energyAmount: parseInt(tradeData.energyAmount.toString()),
                        timestamp: parseInt(tradeData.timestamp.toString()),
                    })
                    index++
                } catch (error) {
                    hasMore = false
                }
            }

            setTrades(newTrades)
        } catch (error) {
            console.error("Error fetching trades:", error)
        } finally {
            setIsLoadingTrades(false)
        }
    }

    useEffect(() => {
        if (isConnected) {
            fetchTrades()
        }
    }, [energyTrader, isConnected])

    const handleRecordTrade = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!energyTrader || !buyerAddress || !energyAmount || !pricePerUnit || !userRegion) {
            if (!userRegion) {
                alert("You must register a region in the Energy Marketplace before recording trades.")
            }
            return
        }

        setIsLoading(true)
        try {
            // Convert price to an integer (Wei/Gwei)
            const pricePerUnitInt = parseInt(pricePerUnit)

            // Call the recordTrade function with all required arguments
            const tx = await energyTrader.recordTrade(
                account, // seller
                buyerAddress, // buyer
                parseInt(energyAmount), // energyAmount
                pricePerUnitInt, // pricePerUnit
                userRegion // region
            )
            await tx.wait()

            // Add to trades for immediate feedback
            const newTrade = {
                seller: account,
                buyer: buyerAddress,
                energyAmount: parseInt(energyAmount),
                timestamp: Math.floor(Date.now() / 1000),
            }

            setTrades((prevTrades) => [newTrade, ...prevTrades])
            setBuyerAddress("")
            setEnergyAmount("")
            setPricePerUnit("")

            alert("Trade recorded successfully!")
        } catch (error) {
            console.error("Error recording trade:", error)
            alert("Failed to record trade. See console for details.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-purple-700">Direct Energy Trading</h2>

            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">What is Direct Energy Trading?</h3>
                <p className="text-sm text-gray-700">
                    This tool lets you record private, off-platform energy trades that have already been agreed upon
                    between you and a buyer. Unlike the Energy Marketplace, which handles the entire transaction flow,
                    this section is for recording trades that were negotiated outside the platform but need to be
                    tracked on the blockchain for transparency and verification.
                </p>
                <p className="text-sm text-gray-700 mt-2">
                    <strong>Use this when:</strong> You already have an agreement with another party and just need to
                    record the transaction.
                </p>
            </div>

            {isConnected ? (
                <>
                    <form onSubmit={handleRecordTrade} className="mb-6">
                        <div className="mb-4">
                            <label htmlFor="buyer-address" className="block text-gray-700 mb-2">
                                Buyer Address
                            </label>
                            <input
                                id="buyer-address"
                                type="text"
                                value={buyerAddress}
                                onChange={(e) => setBuyerAddress(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="0x..."
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="trade-amount" className="block text-gray-700 mb-2">
                                Energy Amount (kWh)
                            </label>
                            <input
                                id="trade-amount"
                                type="number"
                                value={energyAmount}
                                onChange={(e) => setEnergyAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter amount in kWh"
                                required
                                min="1"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="price-per-unit" className="block text-gray-700 mb-2">
                                Price per kWh (in smallest currency unit)
                            </label>
                            <input
                                id="price-per-unit"
                                type="number"
                                value={pricePerUnit}
                                onChange={(e) => setPricePerUnit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter price per kWh"
                                required
                                min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This is used for record-keeping only and won't trigger payments
                            </p>
                        </div>

                        {!userRegion && (
                            <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                Please register your region in the Energy Marketplace section before recording trades.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !userRegion}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400">
                            {isLoading ? "Recording..." : "Record Trade (Sell Energy)"}
                        </button>
                    </form>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-700">Recent Trades</h3>
                            <button
                                onClick={fetchTrades}
                                disabled={isLoadingTrades}
                                className="text-sm text-purple-600 hover:text-purple-800">
                                {isLoadingTrades ? "Loading..." : "Refresh"}
                            </button>
                        </div>

                        {trades.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Seller
                                            </th>
                                            <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Buyer
                                            </th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trades.map((trade, index) => (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-2 text-sm">
                                                    <div className="truncate max-w-[80px]" title={trade.seller}>
                                                        {trade.seller.slice(0, 6)}...{trade.seller.slice(-4)}
                                                    </div>
                                                </td>
                                                <td className="py-2 text-sm">
                                                    <div className="truncate max-w-[80px]" title={trade.buyer}>
                                                        {trade.buyer.slice(0, 6)}...{trade.buyer.slice(-4)}
                                                    </div>
                                                </td>
                                                <td className="py-2 text-sm text-right">{trade.energyAmount} kWh</td>
                                                <td className="py-2 text-xs text-right text-gray-500">
                                                    {new Date(trade.timestamp * 1000).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">No trades recorded yet</p>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Connect your wallet to record energy trades</p>
                </div>
            )}
        </div>
    )
}
