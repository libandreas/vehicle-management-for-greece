'use client';

import { useRouter } from 'next/navigation';

export default function Menu() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-80 bg-white shadow-lg">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Μενού</h2>
      </div>
      <nav className="p-4 space-y-2">
        <button
          onClick={() => handleNavigate('/customers')}
          className="w-full text-left p-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <div className="font-semibold">Ψηφιακό Πελατολόγιο</div>
          <div className="text-sm text-gray-500 mt-1">
            Πλήρες σύστημα διαχείρισης πληροφοριών πελατών
          </div>
        </button>

        <button
          onClick={() => handleNavigate('/vehicles')}
          className="w-full text-left p-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <div className="font-semibold">Οχήματα</div>
          <div className="text-sm text-gray-500 mt-1">
            Διαχείριση οχημάτων και service
          </div>
        </button>

        <button
          onClick={() => handleNavigate('/incoming-vehicles')}
          className="w-full text-left p-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <div className="font-semibold">Βιβλίο Εισερχομένων Οχημάτων</div>
          <div className="text-sm text-gray-500 mt-1">
            Διαχείριση εισερχομένων οχημάτων
          </div>
        </button>

        <button
          onClick={() => handleNavigate('/work-scheduling')}
          className="w-full text-left p-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <div className="font-semibold">Προγραμματισμός Εργασιών</div>
          <div className="text-sm text-gray-500 mt-1">
            Διαχείριση και προγραμματισμός εργασιών
          </div>
        </button>
      </nav>
    </div>
  );
}
