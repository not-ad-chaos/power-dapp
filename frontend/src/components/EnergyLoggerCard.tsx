"use client"

import { useState } from "react"
import { useContract } from "../contexts/ContractContext"

export default function EnergyLoggerCard() {
    const { energyLogger, account, isConnected, userRegion, setUserRegion } = useContract()
    const [energyAmount, setEnergyAmount] = useState<string>("")
    const [consumptionSource, setConsumptionSource] = useState<string>("household")
    const [logs, setLogs] = useState<Array<{ amount: number; source: string; timestamp: number }>>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [regionInput, setRegionInput] = useState<string>("")
    const [registeringRegion, setRegisteringRegion] = useState<boolean>(false)

    const handleLogConsumption = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!energyLogger || !energyAmount) return

        setIsLoading(true)
        try {
            const tx = await energyLogger.logConsumption(parseInt(energyAmount), consumptionSource)
            await tx.wait()

            const newLog = {
                amount: parseInt(energyAmount),
                source: consumptionSource,
                timestamp: Math.floor(Date.now() / 1000),
            }

            setLogs((prevLogs) => [newLog, ...prevLogs])
            setEnergyAmount("")

            // Show success message
            alert("Energy consumption logged successfully!")
        } catch (error) {
            console.error("Error logging consumption:", error)

            // Check if the error is about region registration
            if (error.message && error.message.includes("User must be registered to a region")) {
                alert(
                    "You must register to a region before logging consumption. Please use the form below to register."
                )
            } else {
                alert("Failed to log consumption. See console for details.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegisterRegion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!energyLogger || !regionInput) return

        setRegisteringRegion(true)
        try {
            const tx = await energyLogger.registerUser(regionInput)
            await tx.wait()

            setUserRegion(regionInput)
            setRegionInput("")

            alert("Region registered successfully!")
        } catch (error) {
            console.error("Error registering region:", error)
            alert("Failed to register region. See console for details.")
        } finally {
            setRegisteringRegion(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Energy Logger</h2>

            {isConnected ? (
                <>
                    {!userRegion ? (
                        // Show region registration form if user has no region
                        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Register Your Region</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                You need to register to a region before logging energy consumption.
                            </p>

                            <form onSubmit={handleRegisterRegion}>
                                <div className="mb-4">
                                    <label htmlFor="region" className="block text-gray-700 mb-2">
                                        Your Region
                                    </label>
                                    <input
                                        id="region"
                                        type="text"
                                        value={regionInput}
                                        onChange={(e) => setRegionInput(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        // Show consumption logging form if user has registered a region
                        <>
                            <div className="mb-6 p-4 bg-green-50 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800">Your Region</h3>
                                <div className="text-xl font-bold text-green-600">{userRegion}</div>
                                <div className="text-sm text-gray-700 mt-1">
                                    All your energy consumption will be logged in this region
                                </div>
                            </div>

                            <form onSubmit={handleLogConsumption} className="mb-6">
                                <div className="mb-4">
                                    <label htmlFor="energy-amount" className="block text-gray-700 mb-2">
                                        Energy Consumption (kWh)
                                    </label>
                                    <input
                                        id="energy-amount"
                                        type="number"
                                        value={energyAmount}
                                        onChange={(e) => setEnergyAmount(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter amount in kWh"
                                        required
                                        min="1"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="consumption-source" className="block text-gray-700 mb-2">
                                        Consumption Source
                                    </label>
                                    <select
                                        id="consumption-source"
                                        value={consumptionSource}
                                        onChange={(e) => setConsumptionSource(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required>
                                        <option value="household">Household</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="industrial">Industrial</option>
                                        <option value="transportation">Transportation</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400">
                                    {isLoading ? "Logging..." : "Log Consumption"}
                                </button>
                            </form>

                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-700">Recent Logs</h3>
                                {logs.length > 0 ? (
                                    <ul className="space-y-2">
                                        {logs.map((log, index) => (
                                            <li key={index} className="border-b border-gray-200 pb-2">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <span className="font-medium">{log.amount} kWh</span>
                                                        <span className="text-gray-500 text-sm ml-2">
                                                            ({log.source})
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-500 text-sm">
                                                        {new Date(log.timestamp * 1000).toLocaleString()}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">No consumption logs yet</p>
                                )}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Connect your wallet to log energy consumption</p>
                </div>
            )}
        </div>
    )
}
