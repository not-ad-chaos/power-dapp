'use client';

import Navbar from '../components/Navbar';
import EnergyLoggerCard from '../components/EnergyLoggerCard';
import RenewableCertificateCard from '../components/RenewableCertificateCard';
import EnergyTraderCard from '../components/EnergyTraderCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Decentralized Energy Platform</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EnergyLoggerCard />
          <RenewableCertificateCard />
          <EnergyTraderCard />
        </div>
      </div>
    </main>
  );
}
