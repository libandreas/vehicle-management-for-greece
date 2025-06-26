"use client";
import { useRouter } from "next/navigation";
import Menu from "../components/Menu";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function VehiclesPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("list");
	const [vehicles, setVehicles] = useState<any[]>([]);
	const [customers, setCustomers] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [editingVehicle, setEditingVehicle] = useState<any>(null);
	const [formData, setFormData] = useState({
		customerId: "",
		licensePlate: "",
		chassisNumber: "",
		fullVehicleName: "",
		fuelType: "",
		transmission: "",
		color: "",
		mileage: "",
		vin: "",
		notes: ""
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => {
		const isLoggedIn = localStorage.getItem("isLoggedIn");
		if (!isLoggedIn) {
			router.push("/login");
		} else {
			fetchVehicles();
			fetchCustomers();
		}
	}, [router]);

	const fetchVehicles = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("vehicles")
				.select(`
					*,
					customers (
						id,
						first_name,
						last_name,
						phone
					)
				`)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error fetching vehicles:", error);
			} else {
				setVehicles(data || []);
			}
		} catch (error) {
			console.error("Error:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCustomers = async () => {
		try {
			const { data, error } = await supabase
				.from("customers")
				.select("id, first_name, last_name, phone")
				.order("first_name", { ascending: true });

			if (error) {
				console.error("Error fetching customers:", error);
			} else {
				setCustomers(data || []);
			}
		} catch (error) {
			console.error("Error:", error);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("isLoggedIn");
		localStorage.removeItem("username");
		router.push("/login");
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setMessage("");

		try {
			if (editingVehicle) {
				// Επεξεργασία υπάρχοντος οχήματος
				const { data, error } = await supabase
					.from("vehicles")
					.update({
						customer_id: formData.customerId ? parseInt(formData.customerId) : null,
						license_plate: formData.licensePlate.toUpperCase(),
						chassis_number: formData.chassisNumber,
						full_vehicle_name: formData.fullVehicleName,
						fuel_type: formData.fuelType,
						transmission: formData.transmission,
						color: formData.color,
						mileage: formData.mileage ? parseInt(formData.mileage) : null,
						vin: formData.vin,
						notes: formData.notes,
						updated_at: new Date().toISOString()
					})
					.eq("id", editingVehicle.id);

				if (error) {
					setMessage("Σφάλμα: " + error.message);
				} else {
					setMessage("Το όχημα ενημερώθηκε επιτυχώς!");
					setEditingVehicle(null);
					resetForm();
					fetchVehicles();
					setTimeout(() => {
						setActiveTab("list");
						setMessage("");
					}, 2000);
				}
			} else {
				// Δημιουργία νέου οχήματος
				const { data, error } = await supabase
					.from("vehicles")
					.insert([{
						customer_id: formData.customerId ? parseInt(formData.customerId) : null,
						license_plate: formData.licensePlate.toUpperCase(),
						chassis_number: formData.chassisNumber,
						full_vehicle_name: formData.fullVehicleName,
						fuel_type: formData.fuelType,
						transmission: formData.transmission,
						color: formData.color,
						mileage: formData.mileage ? parseInt(formData.mileage) : null,
						vin: formData.vin,
						notes: formData.notes
					}]);

				if (error) {
					setMessage("Σφάλμα: " + error.message);
				} else {
					setMessage("Το όχημα δημιουργήθηκε επιτυχώς!");
					resetForm();
					fetchVehicles();
					setTimeout(() => {
						setActiveTab("list");
						setMessage("");
					}, 2000);
				}
			}
		} catch (error) {
			setMessage("Σφάλμα: " + (error as Error).message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setFormData({
			customerId: "",
			licensePlate: "",
			chassisNumber: "",
			fullVehicleName: "",
			fuelType: "",
			transmission: "",
			color: "",
			mileage: "",
			vin: "",
			notes: ""
		});
	};

	const handleEditVehicle = (vehicle: any) => {
		setEditingVehicle(vehicle);
		setFormData({
			customerId: vehicle.customer_id ? vehicle.customer_id.toString() : "",
			licensePlate: vehicle.license_plate || "",
			chassisNumber: vehicle.chassis_number || "",
			fullVehicleName: vehicle.full_vehicle_name || "",
			fuelType: vehicle.fuel_type || "",
			transmission: vehicle.transmission || "",
			color: vehicle.color || "",
			mileage: vehicle.mileage ? vehicle.mileage.toString() : "",
			vin: vehicle.vin || "",
			notes: vehicle.notes || ""
		});
		setActiveTab("create");
		setMessage("");
	};

	const handleCancelEdit = () => {
		setEditingVehicle(null);
		resetForm();
		setMessage("");
	};

	const fuelTypes = ["Βενζίνη", "Πετρέλαιο", "Υβριδικό", "Ηλεκτρικό", "LPG", "CNG"];
	const transmissionTypes = ["Χειροκίνητο", "Αυτόματο", "CVT", "DSG"];

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<Menu />

			<div className="flex-1">
				<div className="flex justify-between items-center p-6 bg-white shadow-sm">
					<div>
						<h1 className="text-2xl font-bold">Διαχείριση Οχημάτων</h1>
						<p className="text-gray-600">Καταγραφή και διαχείριση οχημάτων πελατών</p>
					</div>
					<button
						onClick={handleLogout}
						className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
					>
						Αποσύνδεση
					</button>
				</div>

				<div className="bg-white border-b">
					<div className="flex space-x-8 px-6">
						<button
							onClick={() => setActiveTab("list")}
							className={`py-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === "list"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700"
							}`}
						>
							Λίστα Οχημάτων
						</button>
						<button
							onClick={() => {
								setActiveTab("create");
								handleCancelEdit();
							}}
							className={`py-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === "create"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700"
							}`}
						>
							{editingVehicle ? "Επεξεργασία Οχήματος" : "Δημιουργία Νέου Οχήματος"}
						</button>
					</div>
				</div>

				<div className="p-6">
					{activeTab === "list" ? (
						<div className="bg-white rounded-lg shadow-md">
							<div className="p-6 border-b border-gray-200">
								<h3 className="text-lg font-medium text-gray-900">Λίστα Οχημάτων</h3>
								<p className="mt-1 text-sm text-gray-600">
									Συνολικά {vehicles.length} οχήματα
								</p>
							</div>
							
							{loading ? (
								<div className="p-6 text-center">
									<div className="text-gray-500">Φόρτωση...</div>
								</div>
							) : vehicles.length === 0 ? (
								<div className="p-6 text-center">
									<div className="text-gray-500">Δεν υπάρχουν οχήματα</div>
									<button
										onClick={() => setActiveTab("create")}
										className="mt-2 text-blue-600 hover:text-blue-500"
									>
										Δημιουργήστε το πρώτο όχημα
									</button>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Πινακίδες
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Όχημα
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Ιδιοκτήτης
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Χιλιόμετρα
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Ενέργειες
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{vehicles.map((vehicle) => (
												<tr key={vehicle.id} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm font-medium text-gray-900">
															{vehicle.license_plate}
														</div>
														{vehicle.chassis_number && (
															<div className="text-xs text-gray-500">
																Πλαίσιο: {vehicle.chassis_number}
															</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm font-medium text-gray-900">
															{vehicle.full_vehicle_name || "Χωρίς όνομα"}
														</div>
														<div className="text-sm text-gray-500">
															{vehicle.fuel_type && `${vehicle.fuel_type} • `}
															{vehicle.transmission}
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{vehicle.customers ? (
															<div>
																<div className="text-sm font-medium text-gray-900">
																	{vehicle.customers.first_name} {vehicle.customers.last_name}
																</div>
																<div className="text-sm text-gray-500">
																	{vehicle.customers.phone}
																</div>
															</div>
														) : (
															<span className="text-sm text-gray-400">Χωρίς ιδιοκτήτη</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "-"}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
														<button
															onClick={() => handleEditVehicle(vehicle)}
															className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
														>
															Επεξεργασία
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-md p-8">
							<div className="mb-6">
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									{editingVehicle ? "Επεξεργασία Οχήματος" : "Δημιουργία Νέου Οχήματος"}
								</h3>
								{editingVehicle && (
									<div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
										<p className="text-sm text-blue-800">
											Επεξεργάζεστε το όχημα: <strong>{editingVehicle.license_plate}</strong>
										</p>
									</div>
								)}
							</div>
							
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Ιδιοκτήτης
										</label>
										<select
											name="customerId"
											value={formData.customerId}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="">Επιλέξτε πελάτη...</option>
											{customers.map((customer) => (
												<option key={customer.id} value={customer.id}>
													{customer.first_name} {customer.last_name} - {customer.phone}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Πινακίδες *
										</label>
										<input
											type="text"
											name="licensePlate"
											value={formData.licensePlate}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="π.χ. ΑΒΓ-1234"
											required
										/>
									</div>

									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Πλήρες όνομα οχήματος *
										</label>
										<input
											type="text"
											name="fullVehicleName"
											value={formData.fullVehicleName}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="π.χ. Toyota Corolla 2020 1.6L"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Καύσιμο
										</label>
										<select
											name="fuelType"
											value={formData.fuelType}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="">Επιλέξτε καύσιμο...</option>
											{fuelTypes.map((fuel) => (
												<option key={fuel} value={fuel}>
													{fuel}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Κιβώτιο
										</label>
										<select
											name="transmission"
											value={formData.transmission}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="">Επιλέξτε κιβώτιο...</option>
											{transmissionTypes.map((trans) => (
												<option key={trans} value={trans}>
													{trans}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Χρώμα
										</label>
										<input
											type="text"
											name="color"
											value={formData.color}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="π.χ. Λευκό, Μαύρο"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Χιλιόμετρα
										</label>
										<input
											type="number"
											name="mileage"
											value={formData.mileage}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="π.χ. 50000"
											min="0"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Αριθμός Πλαισίου
										</label>
										<input
											type="text"
											name="chassisNumber"
											value={formData.chassisNumber}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Αριθμός πλαισίου"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											VIN
										</label>
										<input
											type="text"
											name="vin"
											value={formData.vin}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Vehicle Identification Number"
											maxLength={17}
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Σημειώσεις
									</label>
									<textarea
										name="notes"
										value={formData.notes}
										onChange={handleInputChange}
										rows={4}
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Προαιρετικές σημειώσεις για το όχημα..."
									/>
								</div>

								{message && (
									<div className={`p-4 rounded-md ${
										message.includes("Σφάλμα") 
											? "bg-red-50 text-red-700 border border-red-200" 
											: "bg-green-50 text-green-700 border border-green-200"
									}`}>
										{message}
									</div>
								)}

								<div className="flex gap-4">
									<button
										type="submit"
										disabled={isSubmitting}
										className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
									>
										{isSubmitting 
											? "Αποθήκευση..." 
											: editingVehicle 
												? "Ενημέρωση Οχήματος" 
												: "Δημιουργία Οχήματος"
										}
									</button>
									
									{editingVehicle && (
										<button
											type="button"
											onClick={handleCancelEdit}
											className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition"
										>
											Ακύρωση Επεξεργασίας
										</button>
									)}
									
									<button
										type="button"
										onClick={() => setActiveTab("list")}
										className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition"
									>
										Επιστροφή στη Λίστα
									</button>
								</div>
							</form>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
