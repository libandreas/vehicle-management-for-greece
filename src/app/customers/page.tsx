"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function CustomersPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("list");
	const [customers, setCustomers] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<any>(null);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		patronymic: "",
		phone: "",
		email: "",
		address: "",
		afm: "",
		notes: "",
		debt: "",
		credit: ""
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		const isLoggedIn = localStorage.getItem("isLoggedIn");
		if (!isLoggedIn) {
			router.push("/login");
		} else {
			fetchCustomers();
		}
	}, [router]);

	const fetchCustomers = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("customers")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error fetching customers:", error);
			} else {
				setCustomers(data || []);
			}
		} catch (error) {
			console.error("Error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("isLoggedIn");
		localStorage.removeItem("username");
		router.push("/login");
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
			if (editingCustomer) {
				// Επεξεργασία υπάρχοντος πελάτη
				const { data, error } = await supabase
					.from("customers")
					.update({
						first_name: formData.firstName,
						last_name: formData.lastName,
						patronymic: formData.patronymic,
						phone: formData.phone,
						email: formData.email,
						address: formData.address,
						afm: formData.afm,
						notes: formData.notes,
						debt: parseFloat(formData.debt) || 0,
						credit: parseFloat(formData.credit) || 0
					})
					.eq("id", editingCustomer.id);

				if (error) {
					setMessage("Σφάλμα: " + error.message);
				} else {
					setMessage("Ο πελάτης ενημερώθηκε επιτυχώς!");
					setEditingCustomer(null);
					setFormData({
						firstName: "",
						lastName: "",
						patronymic: "",
						phone: "",
						email: "",
						address: "",
						afm: "",
						notes: "",
						debt: "",
						credit: ""
					});
					fetchCustomers();
					setTimeout(() => {
						setActiveTab("list");
						setMessage("");
					}, 2000);
				}
			} else {
				// Δημιουργία νέου πελάτη
				const { data, error } = await supabase
					.from("customers")
					.insert([{
						first_name: formData.firstName,
						last_name: formData.lastName,
						patronymic: formData.patronymic,
						phone: formData.phone,
						email: formData.email,
						address: formData.address,
						afm: formData.afm,
						notes: formData.notes,
						debt: parseFloat(formData.debt) || 0,
						credit: parseFloat(formData.credit) || 0
					}]);

				if (error) {
					setMessage("Σφάλμα: " + error.message);
				} else {
					setMessage("Ο πελάτης δημιουργήθηκε επιτυχώς!");
					setFormData({
						firstName: "",
						lastName: "",
						patronymic: "",
						phone: "",
						email: "",
						address: "",
						afm: "",
						notes: "",
						debt: "",
						credit: ""
					});
					fetchCustomers();
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

	const handleEditCustomer = (customer: any) => {
		setEditingCustomer(customer);
		setFormData({
			firstName: customer.first_name,
			lastName: customer.last_name,
			patronymic: customer.patronymic || "",
			phone: customer.phone,
			email: customer.email || "",
			address: customer.address || "",
			afm: customer.afm || "",
			notes: customer.notes || "",
			debt: customer.debt ? customer.debt.toString() : "",
			credit: customer.credit ? customer.credit.toString() : ""
		});
		setActiveTab("create");
		setMessage("");
	};

	const handleCancelEdit = () => {
		setEditingCustomer(null);
		setFormData({
			firstName: "",
			lastName: "",
			patronymic: "",
			phone: "",
			email: "",
			address: "",
			afm: "",
			notes: "",
			debt: "",
			credit: ""
		});
		setMessage("");
	};

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<div className="w-80 bg-white shadow-lg">
				<div className="p-6 border-b">
					<h2 className="text-xl font-bold text-gray-800">Μενού</h2>
				</div>
				<nav className="p-4 space-y-2">
					<button
						onClick={() => router.push("/customers")}
						className="w-full text-left p-4 rounded-lg bg-blue-50 text-blue-600 mb-2"
					>
						<div className="font-semibold">Ψηφιακό Πελατολόγιο</div>
						<div className="text-sm text-gray-500 mt-1">
							Πλήρες σύστημα διαχείρισης πληροφοριών πελατών
						</div>
					</button>
					
					<button
						onClick={() => router.push("/vehicles")}
						className="w-full text-left p-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
					>
						<div className="font-semibold">Οχήματα</div>
						<div className="text-sm text-gray-500 mt-1">
							Διαχείριση οχημάτων και service
						</div>
					</button>
				</nav>
			</div>

			<div className="flex-1">
				<div className="flex justify-between items-center p-6 bg-white shadow-sm">
					<div>
						<h1 className="text-2xl font-bold">Ψηφιακό Πελατολόγιο</h1>
						<p className="text-gray-600">Διαχείριση πληροφοριών πελατών</p>
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
							Λίστα Πελατών
						</button>
						<button
							onClick={() => {
								setActiveTab("create");
								handleCancelEdit(); // Καθαρισμός φόρμας όταν πατάμε το tab
							}}
							className={`py-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === "create"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700"
							}`}
						>
							{editingCustomer ? "Επεξεργασία Πελάτη" : "Δημιουργία Νέου Πελάτη"}
						</button>
					</div>
				</div>

				<div className="p-6">
					{activeTab === "list" ? (
						<div className="bg-white rounded-lg shadow-md">
							<div className="p-6 border-b border-gray-200">
								<h3 className="text-lg font-medium text-gray-900">Λίστα Πελατών</h3>
								<p className="mt-1 text-sm text-gray-600">
									Συνολικά {customers.length} πελάτες
								</p>
							</div>
							
							{loading ? (
								<div className="p-6 text-center">
									<div className="text-gray-500">Φόρτωση...</div>
								</div>
							) : customers.length === 0 ? (
								<div className="p-6 text-center">
									<div className="text-gray-500">Δεν υπάρχουν πελάτες</div>
									<button
										onClick={() => setActiveTab("create")}
										className="mt-2 text-blue-600 hover:text-blue-500"
									>
										Δημιουργήστε τον πρώτο πελάτη
									</button>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Πελάτης
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Στοιχεία Επικοινωνίας
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Α.Φ.Μ.
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Χρέος (€)
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Πίστωση (€)
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Ημερομηνία
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Ενέργειες
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{customers.map((customer) => (
												<tr key={customer.id} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm font-medium text-gray-900">
															{customer.first_name} {customer.last_name}
														</div>
														{customer.patronymic && (
															<div className="text-sm text-gray-500">
																{customer.patronymic}
															</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-900">{customer.phone}</div>
														{customer.email && (
															<div className="text-sm text-gray-500">{customer.email}</div>
														)}
														{customer.address && (
															<div className="text-sm text-gray-500">{customer.address}</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{customer.afm || "-"}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<span className={`font-medium ${
															customer.debt > 0 
																? "text-red-600" 
																: "text-green-600"
														}`}>
															{customer.debt ? `€${customer.debt.toFixed(2)}` : "€0.00"}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<span className={`font-medium ${
															customer.credit > 0 
																? "text-green-600" 
																: "text-gray-600"
														}`}>
															{customer.credit ? `€${customer.credit.toFixed(2)}` : "€0.00"}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
														{new Date(customer.created_at).toLocaleDateString("el-GR")}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
														<button
															onClick={() => handleEditCustomer(customer)}
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
									{editingCustomer ? "Επεξεργασία Πελάτη" : "Δημιουργία Νέου Πελάτη"}
								</h3>
								{editingCustomer && (
									<div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
										<p className="text-sm text-blue-800">
											Επεξεργάζεστε τον πελάτη: <strong>{editingCustomer.first_name} {editingCustomer.last_name}</strong>
										</p>
									</div>
								)}
							</div>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Όνομα *
										</label>
										<input
											type="text"
											name="firstName"
											value={formData.firstName}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Επώνυμο *
										</label>
										<input
											type="text"
											name="lastName"
											value={formData.lastName}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Πατρώνυμο
										</label>
										<input
											type="text"
											name="patronymic"
											value={formData.patronymic}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Α.Φ.Μ.
										</label>
										<input
											type="text"
											name="afm"
											value={formData.afm}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Τηλέφωνο *
										</label>
										<input
											type="tel"
											name="phone"
											value={formData.phone}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Email
										</label>
										<input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Διεύθυνση
									</label>
									<input
										type="text"
										name="address"
										value={formData.address}
										onChange={handleInputChange}
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Χρέος (€)
										</label>
										<input
											type="number"
											step="0.01"
											name="debt"
											value={formData.debt}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="0.00"
										/>
										<p className="text-xs text-gray-500 mt-1">Ποσό που χρωστάει ο πελάτης</p>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Πίστωση (€)
										</label>
										<input
											type="number"
											step="0.01"
											name="credit"
											value={formData.credit}
											onChange={handleInputChange}
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="0.00"
										/>
										<p className="text-xs text-gray-500 mt-1">Ποσό που χρωστάει το κατάστημα</p>
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
										placeholder="Προαιρετικές σημειώσεις για τον πελάτη..."
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
											: editingCustomer 
												? "Ενημέρωση Πελάτη" 
												: "Δημιουργία Πελάτη"
										}
									</button>
									
									{editingCustomer && (
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
