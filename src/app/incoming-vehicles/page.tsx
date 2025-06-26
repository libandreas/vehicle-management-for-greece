"use client";
import { useRouter } from "next/navigation";
import Menu from "../components/Menu";
import { useEffect, useState } from "react";

export default function IncomingVehiclesPage() {
	const router = useRouter();

	useEffect(() => {
		// Έλεγχos αν ο χρήστης είναι συνδεδεμένος
		const isLoggedIn = localStorage.getItem("isLoggedIn");
		if (!isLoggedIn) {
			router.push("/login");
		}
	}, [router]);

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<Menu />
			<div className="flex-1 p-8">
				<div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
					<h1 className="text-2xl font-bold text-gray-800 mb-4">Βιβλίο Εισερχομένων Οχημάτων</h1>
					<p className="text-gray-600">Αυτή η σελίδα είναι υπό κατασκευή.</p>
				</div>
			</div>
		</div>
	);
}
