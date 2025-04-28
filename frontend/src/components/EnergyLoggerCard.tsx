'use client';

import { useState } from 'react';
import { useContract } from '../contexts/ContractContext';

export default function EnergyLoggerCard() {
  const { energyLogger, account, isConnected } = useContract();
  const [energyAmount, setEnergyAmount] = useState<string>('');
  const [logs, setLogs] = useState<Array<{ amount: number; timestamp: number }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!energyLogger || !energyAmount) return;
    
    setIsLoading(true);
    try {
      const tx = await energyLogger.logConsumption(parseInt(energyAmount));
      await tx.wait();
      
      // Add to logs for immediate feedback
      const newLog = {
        amount: parseInt(energyAmount),
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      setLogs(prevLogs => [newLog, ...prevLogs]);
      setEnergyAmount('');
    } catch (error) {
      console.error('Error logging consumption:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Energy Logger</h2>
      
      {isConnected ? (
        <>
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Logging...' : 'Log Consumption'}
            </button>
          </form>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Recent Logs</h3>
            {logs.length > 0 ? (
              <ul className="space-y-2">
                {logs.map((log, index) => (
                  <li key={index} className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{log.amount} kWh</span>
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
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Connect your wallet to log energy consumption</p>
        </div>
      )}
    </div>
  );
} 