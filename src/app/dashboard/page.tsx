"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
	const router = useRouter();
	const [username, setUsername] = useState("");

	useEffect(() => {
		// Έλεγχος αν ο χρήστης είναι συνδεδεμένος
		const isLoggedIn = localStorage.getItem("isLoggedIn");
		const storedUsername = localStorage.getItem("username");
		if (!isLoggedIn) {
			router.push("/login");
		} else {
			setUsername(storedUsername || "");
		}
	}, [router]);

	const handleLogout = () => {
		// Καθαρίζουμε το localStorage
		localStorage.removeItem("isLoggedIn");
		localStorage.removeItem("username");
		router.push("/login");
	};

	const handleNavigate = (path: string) => {
		router.push(path);
	};

	return (
		<div className="min-h-screen bg-gray-100 flex">
			{/* Sidebar */}
			<div className="w-80 bg-white shadow-lg">
				<div className="p-6 border-b">
					<h2 className="text-xl font-bold text-gray-800">Μενού</h2>
				</div>
				<nav className="p-4 space-y-2">
					<button
						onClick={() => handleNavigate("/customers")}
						className="w-full text-left p-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
					>
						<div className="font-semibold">Ψηφιακό Πελατολόγιο</div>
						<div className="text-sm text-gray-500 mt-1">
							Πλήρες σύστημα διαχείρισης πληροφοριών πελατών
						</div>
					</button>
					
					<button
						onClick={() => handleNavigate("/vehicles")}
						className="w-full text-left p-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
					>
						<div className="font-semibold">Οχήματα</div>
						<div className="text-sm text-gray-500 mt-1">
							Διαχείριση οχημάτων και service
						</div>
					</button>
				</nav>
			</div>

			{/* Main Content */}
			<div className="flex-1">
				{/* Header */}
				<div className="flex justify-between items-center p-6 bg-white shadow-sm">
					<div>
						<h1 className="text-2xl font-bold">Dashboard</h1>
						<p className="text-gray-600">Καλώς ήρθες, {username}!</p>
					</div>
					<button
						onClick={handleLogout}
						className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
					>
						Αποσύνδεση
					</button>
				</div>

				{/* Dashboard Content */}
				<div className="p-6">
					<div className="bg-white p-8 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">Επισκόπηση Συστήματος</h2>
						<p className="text-gray-500">
							Επιλέξτε μια λειτουργία από το μενού στα αριστερά για να ξεκινήσετε.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
