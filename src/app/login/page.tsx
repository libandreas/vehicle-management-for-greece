"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	useEffect(() => {
		// Αν ο χρήστης είναι ήδη συνδεδεμένος, ανακατεύθυνση στο dashboard
		const isLoggedIn = localStorage.getItem("isLoggedIn");
		if (isLoggedIn) {
			router.push("/dashboard");
		}
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Trying to login with:", username, password);
		
		// Query Supabase for user with username and password
		const { data, error: dbError } = await supabase
			.from("users")
			.select("*")
			.eq("username", username)
			.eq("password", password)
			.single();
		
		console.log("Supabase response:", { data, dbError });
		
		if (dbError || !data) {
			setError("Λάθος στοιχεία εισόδου: " + (dbError?.message || "No data found"));
		} else {
			// Αποθηκεύουμε ότι ο χρήστης είναι συνδεδεμένος
			localStorage.setItem("isLoggedIn", "true");
			localStorage.setItem("username", username);
			router.push("/dashboard");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<form
				onSubmit={handleSubmit}
				className="bg-white p-8 rounded shadow-md w-full max-w-sm"
			>
				<h1 className="text-2xl font-bold mb-6 text-center">Σύνδεση</h1>
				<div className="mb-4">
					<label className="block mb-1 font-medium">Όνομα χρήστη</label>
					<input
						type="text"
						className="w-full border rounded px-3 py-2"
						value={username}
						onChange={e => setUsername(e.target.value)}
						required
					/>
				</div>
				<div className="mb-4">
					<label className="block mb-1 font-medium">Κωδικός</label>
					<input
						type="password"
						className="w-full border rounded px-3 py-2"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
				</div>
				{error && <div className="text-red-500 mb-4">{error}</div>}
				<button
					type="submit"
					className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
				>
					Είσοδος
				</button>
			</form>
		</div>
	);
}
