'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Menu from '../components/Menu';

interface SparePart {
  name: string;
  cost: number;
}

export default function WorkSchedulingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [sparePart, setSparePart] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [description, setDescription] = useState('');
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [laborCost, setLaborCost] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [router]);

  const addSparePart = () => {
    if (sparePart) {
      setSpareParts([...spareParts, { name: sparePart, cost: 0 }]);
      setSparePart('');
    }
  };

  const handleSparePartCostChange = (index: number, cost: number) => {
    const newSpareParts = [...spareParts];
    newSpareParts[index].cost = cost;
    setSpareParts(newSpareParts);
  };

  const totalCost = spareParts.reduce((total, part) => total + part.cost, 0) + laborCost;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Menu />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Προγραμματισμός Εργασιών</h1>
          <form>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Τίτλος Εργασίας</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ημερομηνία Έναρξης</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Αναμενόμενη Ημερομηνία Παράδοσης</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Περιγραφή Εργασίας</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ανταλλακτικά</h2>
              <div className="flex items-center mb-4">
                <input
                  type="text"
                  value={sparePart}
                  onChange={(e) => setSparePart(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Προσθήκη ανταλλακτικού"
                />
                <button type="button" onClick={addSparePart} className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Προσθήκη</button>
              </div>
              <ul>
                {spareParts.map((part, index) => (
                  <li key={index} className="flex items-center justify-between mb-2">
                    <span>{part.name}</span>
                    <input
                      type="number"
                      value={part.cost}
                      onChange={(e) => handleSparePartCostChange(index, parseFloat(e.target.value))}
                      className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Κόστος"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Κόστος Εργασίας</label>
              <input
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-right">
              <span className="text-xl font-bold">Συνολικό Κόστος: {totalCost.toFixed(2)}€</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
