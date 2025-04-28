'use client';

import { useState, useEffect } from 'react';
import { useContract } from '../contexts/ContractContext';

interface Trade {
  seller: string;
  buyer: string;
  energyAmount: number;
  timestamp: number;
}

export default function EnergyTraderCard() {
  const { energyTrader, account, isConnected } = useContract();
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [energyAmount, setEnergyAmount] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false);

  // Fetch recent trades
  const fetchTrades = async () => {
    if (!energyTrader) return;
    
    setIsLoadingTrades(true);
    try {
      const newTrades: Trade[] = [];
      let index = 0;
      let hasMore = true;
      
      // Fetch up to 10 most recent trades (this is a simplified way - in a real app you'd use events)
      while (hasMore && index < 10) {
        try {
          const [seller, buyer, amount, timestamp] = await energyTrader.getTrade(index);
          newTrades.push({
            seller,
            buyer,
            energyAmount: parseInt(amount.toString()),
            timestamp: parseInt(timestamp.toString())
          });
          index++;
        } catch (error) {
          hasMore = false;
        }
      }
      
      setTrades(newTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setIsLoadingTrades(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchTrades();
    }
  }, [energyTrader, isConnected]);

  const handleRecordTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!energyTrader || !buyerAddress || !energyAmount) return;
    
    setIsLoading(true);
    try {
      const tx = await energyTrader.recordTrade(account, buyerAddress, parseInt(energyAmount));
      await tx.wait();
      
      // Add to trades for immediate feedback (this would normally come from events)
      const newTrade = {
        seller: account,
        buyer: buyerAddress,
        energyAmount: parseInt(energyAmount),
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      setTrades(prevTrades => [newTrade, ...prevTrades]);
      setBuyerAddress('');
      setEnergyAmount('');
    } catch (error) {
      console.error('Error recording trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Energy Trading</h2>
      
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
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Recording...' : 'Record Trade (Sell Energy)'}
            </button>
          </form>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-700">Recent Trades</h3>
              <button 
                onClick={fetchTrades}
                disabled={isLoadingTrades}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                {isLoadingTrades ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {trades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                      <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                      <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
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
  );
} 