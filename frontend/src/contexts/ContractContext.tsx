"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { ethers } from "ethers"
import contractsData from "../constants/contracts.json"
import EnergyLogger from "../artifacts/EnergyLogger.json"
import RenewableCertificate from "../artifacts/RenewableCertificate.json"
import EnergyTradeLedger from "../artifacts/EnergyTradeLedger.json"

interface ContractContextType {
    account: string
    chainId: string
    energyLogger: ethers.Contract | null
    renewableCertificate: ethers.Contract | null
    energyTrader: ethers.Contract | null
    provider: ethers.providers.Web3Provider | null
    connectWallet: () => Promise<void>
    isConnected: boolean
    userRegion: string
    setUserRegion: (region: string) => void
    refreshCertificateData: () => Promise<void>
    certificateCount: number
    ownedCertificates: any[]
    marketOffers: any[]
    isLoading: boolean
}

const ContractContext = createContext<ContractContextType>({
    account: "",
    chainId: "",
    energyLogger: null,
    renewableCertificate: null,
    energyTrader: null,
    provider: null,
    connectWallet: async () => {},
    isConnected: false,
    userRegion: "",
    setUserRegion: () => {},
    refreshCertificateData: async () => {},
    certificateCount: 0,
    ownedCertificates: [],
    marketOffers: [],
    isLoading: false,
})

export const useContract = () => useContext(ContractContext)

export const ContractProvider = ({ children }: { children: ReactNode }) => {
    const [account, setAccount] = useState<string>("")
    const [chainId, setChainId] = useState<string>("")
    const [energyLogger, setEnergyLogger] = useState<ethers.Contract | null>(null)
    const [renewableCertificate, setRenewableCertificate] = useState<ethers.Contract | null>(null)
    const [energyTrader, setEnergyTrader] = useState<ethers.Contract | null>(null)
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [userRegion, setUserRegion] = useState<string>("")
    const [certificateCount, setCertificateCount] = useState<number>(0)
    const [ownedCertificates, setOwnedCertificates] = useState<any[]>([])
    const [marketOffers, setMarketOffers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [lastRefreshTime, setLastRefreshTime] = useState<number>(0)

    // Get certificate data for the current user - using useCallback to stabilize the function reference
    const refreshCertificateData = useCallback(async () => {
        if (!renewableCertificate || !account) {
            return
        }

        // Prevent multiple rapid refreshes
        const now = Date.now()
        if (now - lastRefreshTime < 3000) {
            // 3 second cooldown
            return
        }
        setLastRefreshTime(now)

        // Don't set loading if we're already loading
        if (!isLoading) {
            setIsLoading(true)
        }

        try {
            // Get basic certificate count
            const count = await renewableCertificate.getCertificates(account)
            setCertificateCount(parseInt(count.toString()))

            // Get owned certificate IDs
            const certificateIds = await renewableCertificate.getOwnedCertificateIds(account)

            if (certificateIds && certificateIds.length > 0) {
                // Get details for each certificate
                const certificatesDetails = await Promise.all(
                    certificateIds.map(async (id: any) => {
                        try {
                            const details = await renewableCertificate.getCertificateDetails(id)
                            return {
                                id: id.toString(),
                                energyAmount: details.energyAmount.toString(),
                                issuanceDate: new Date(details.issuanceDate.toNumber() * 1000).toLocaleDateString(),
                                energySource: details.energySource,
                                location: details.location,
                                isValid: details.isValid,
                                owner: details.owner,
                            }
                        } catch (error) {
                            console.error("Error fetching certificate details:", error)
                            return null
                        }
                    })
                )

                // Filter out any null values from failed detail fetches
                setOwnedCertificates(certificatesDetails.filter((cert) => cert !== null))
            } else {
                // Clear certificates if none found
                setOwnedCertificates([])
            }

            // Get active market offers if user region is set and trader contract is available
            if (userRegion && energyTrader) {
                try {
                    const regionOfferIds = await energyTrader.getRegionOffers(userRegion)

                    if (regionOfferIds && regionOfferIds.length > 0) {
                        const activeOffers = await Promise.all(
                            regionOfferIds.map(async (id: any) => {
                                try {
                                    const offerDetails = await energyTrader.getOffer(id)
                                    // Only return active offers
                                    if (offerDetails.isActive) {
                                        return {
                                            id: offerDetails.id.toString(),
                                            seller: offerDetails.seller,
                                            energyAmount: offerDetails.energyAmount.toString(),
                                            pricePerUnit: ethers.utils.formatEther(offerDetails.pricePerUnit),
                                            minPurchaseAmount: offerDetails.minPurchaseAmount.toString(),
                                            expirationTime: new Date(
                                                offerDetails.expirationTime.toNumber() * 1000
                                            ).toLocaleDateString(),
                                            region: offerDetails.region,
                                            isCertified: offerDetails.isCertified,
                                        }
                                    }
                                } catch (error) {
                                    console.error("Error fetching offer details:", error)
                                }
                                return null
                            })
                        )

                        // Filter out null values (inactive offers)
                        setMarketOffers(activeOffers.filter((offer) => offer !== null))
                    } else {
                        setMarketOffers([])
                    }
                } catch (error) {
                    console.error("Error fetching region offers:", error)
                    setMarketOffers([])
                }
            }
        } catch (error) {
            console.error("Error refreshing certificate data:", error)
            // In case of error, clear the collections to avoid partial data
            setCertificateCount(0)
            setOwnedCertificates([])
        } finally {
            setIsLoading(false)
        }
    }, [renewableCertificate, account, energyTrader, userRegion, isLoading, lastRefreshTime])

    const connectWallet = async () => {
        try {
            if (window.ethereum) {
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
                await window.ethereum.request({ method: "eth_requestAccounts" })
                const signer = web3Provider.getSigner()
                const userAddress = await signer.getAddress()

                // Get network ID to use the correct contract addresses
                const network = await web3Provider.getNetwork()
                setChainId(network.chainId.toString())

                const loggerContract = new ethers.Contract(
                    contractsData.addresses.ENERGY_LOGGER,
                    EnergyLogger.abi,
                    signer
                )

                const certificateContract = new ethers.Contract(
                    contractsData.addresses.RENEWABLE_CERTIFICATE,
                    RenewableCertificate.abi,
                    signer
                )

                const traderContract = new ethers.Contract(
                    contractsData.addresses.ENERGY_TRADER,
                    EnergyTradeLedger.abi,
                    signer
                )

                setAccount(userAddress)
                setEnergyLogger(loggerContract)
                setRenewableCertificate(certificateContract)
                setEnergyTrader(traderContract)
                setProvider(web3Provider)
                setIsConnected(true)

                // Try to get user region
                try {
                    const region = await loggerContract.userRegion(userAddress)
                    if (region) setUserRegion(region)
                } catch (error) {
                    console.log("User has no region set yet")
                }

                // Load certificate data
                await refreshCertificateData()
            } else {
                alert("MetaMask is not installed. Please install it to use this dApp.")
            }
        } catch (error) {
            console.error("Error connecting to wallet:", error)
            alert("Error connecting to wallet. Please make sure contracts are deployed to your current network.")
        }
    }

    // Listen for account and chain changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0])
                    // Refresh data when account changes
                    refreshCertificateData()
                } else {
                    setAccount("")
                    setIsConnected(false)
                    setCertificateCount(0)
                    setOwnedCertificates([])
                    setMarketOffers([])
                }
            })

            window.ethereum.on("chainChanged", () => {
                window.location.reload()
            })
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners("accountsChanged")
                window.ethereum.removeAllListeners("chainChanged")
            }
        }
    }, [])

    // Refresh certificate data periodically
    useEffect(() => {
        if (isConnected) {
            refreshCertificateData()

            // Refresh every minute
            const interval = setInterval(refreshCertificateData, 60000)
            return () => clearInterval(interval)
        }
    }, [isConnected, account, userRegion])

    return (
        <ContractContext.Provider
            value={{
                account,
                chainId,
                energyLogger,
                renewableCertificate,
                energyTrader,
                provider,
                connectWallet,
                isConnected,
                userRegion,
                setUserRegion,
                refreshCertificateData,
                certificateCount,
                ownedCertificates,
                marketOffers,
                isLoading,
            }}>
            {children}
        </ContractContext.Provider>
    )
}
