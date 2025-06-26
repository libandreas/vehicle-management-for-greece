"use client";
import { useRouter } from "next/navigation";
import Menu from "../components/Menu";
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
		credit: "",
		// Νέα πεδία για συνεργεία
		vehiclePlate: "",
		entryDate: "",
		entryTime: "",
		vehicleCategory: "",
		manufacturer: "",
		serviceType: "",
		serviceCategory: "",
		otherServiceDescription: "", // Ξεχωριστό πεδίο για περιγραφή λοιπών υπηρεσιών
		agreedAmount: "",
		// Εγκατάσταση οντότητας
		facilityLocation: "",
		// Διαρκής παροχή υπηρεσίας
		periodicity: "",
		serviceStartDate: "",
		serviceEndDate: "",
		// Παροχή υπηρεσιών εκτός εγκατάστασης
		externalService: "",
		partnerAfm: ""
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [isEditing, setIsEditing] = useState(false);

	// Συνάρτηση για έλεγχο και δημιουργία πίνακα/στηλών
	const ensureTableAndColumns = async () => {
		try {
			// Έλεγχος αν υπάρχει ο πίνακας customers
			const { data: tableExists, error: tableError } = await supabase
				.from('customers')
				.select('id')
				.limit(1);

			// Αν ο πίνακας δεν υπάρχει, δημιουργούμε τον
			if (tableError && tableError.code === '42P01') {
				console.log('Δημιουργία πίνακα customers...');
				const { error: createTableError } = await supabase.rpc('create_customers_table');
				if (createTableError) {
					console.error('Σφάλμα δημιουργίας πίνακα:', createTableError);
					return false;
				}
			}

			// Έλεγχος και προσθήκη στηλών αν δεν υπάρχουν
			const columnsToAdd = [
				{ name: 'vehicle_plate', type: 'VARCHAR(20)', comment: 'Αριθμός κυκλοφορίας οχήματος' },
				{ name: 'entry_date', type: 'DATE', comment: 'Ημερομηνία εισόδου' },
				{ name: 'entry_time', type: 'TIME', comment: 'Ώρα εισόδου' },
				{ name: 'vehicle_category', type: 'VARCHAR(100)', comment: 'Κατηγορία οχήματος (διαλειτουργικότητα)' },
				{ name: 'manufacturer', type: 'VARCHAR(100)', comment: 'Εργοστάσιο κατασκευής (διαλειτουργικότητα)' },
				{ name: 'service_type', type: 'VARCHAR(50)', comment: 'Τύπος υπηρεσίας (άπαξ, επαναλαμβανόμενη, διαρκή)' },
				{ name: 'service_category', type: 'VARCHAR(200)', comment: 'Κατηγορία παρεχόμενης υπηρεσίας' },
				{ name: 'other_service_description', type: 'TEXT', comment: 'Περιγραφή λοιπών υπηρεσιών' },
				{ name: 'facility_location', type: 'VARCHAR(200)', comment: 'Εγκατάσταση οντότητας' },
				{ name: 'agreed_amount', type: 'DECIMAL(10,2)', comment: 'Συμφωνηθέν ποσό σε ευρώ' },
				{ name: 'periodicity', type: 'VARCHAR(50)', comment: 'Περιοδικότητα για διαρκή υπηρεσία' },
				{ name: 'service_start_date', type: 'DATE', comment: 'Ημερομηνία έναρξης διαρκούς υπηρεσίας' },
				{ name: 'service_end_date', type: 'DATE', comment: 'Ημερομηνία λήξης διαρκούς υπηρεσίας' },
				{ name: 'external_service', type: 'VARCHAR(200)', comment: 'Παροχή υπηρεσιών εκτός εγκατάστασης' },
				{ name: 'partner_afm', type: 'VARCHAR(20)', comment: 'ΑΦΜ συνεργαζόμενης οντότητας' },
				{ name: 'patronymic', type: 'VARCHAR(100)', comment: 'Πατρώνυμο πελάτη' },
				{ name: 'afm', type: 'VARCHAR(20)', comment: 'ΑΦΜ λήπτη υπηρεσίας' },
				{ name: 'debt', type: 'DECIMAL(10,2) DEFAULT 0.00', comment: 'Χρέος πελάτη' },
				{ name: 'credit', type: 'DECIMAL(10,2) DEFAULT 0.00', comment: 'Πίστωση πελάτη' }
			];

			for (const column of columnsToAdd) {
				try {
					// Προσπάθεια προσθήκης στήλης
					const { error: addColumnError } = await supabase.rpc('add_column_if_not_exists', {
						table_name: 'customers',
						column_name: column.name,
						column_type: column.type
					});

					if (addColumnError && !addColumnError.message.includes('already exists')) {
						console.error(`Σφάλμα προσθήκης στήλης ${column.name}:`, addColumnError);
					}
				} catch (error) {
					// Αγνοούμε σφάλματα αν η στήλη υπάρχει ήδη
					console.log(`Στήλη ${column.name} ήδη υπάρχει ή σφάλμα:`, error);
				}
			}

			return true;
		} catch (error) {
			console.error('Σφάλμα στον έλεγχο πίνακα/στηλών:', error);
			return false;
		}
	};

	// Βοηθητική συνάρτηση για καθαρισμό φόρμας
	const clearForm = () => {
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
			credit: "",
			vehiclePlate: "",
			entryDate: new Date().toISOString().split('T')[0], // Σημερινή ημερομηνία
			entryTime: new Date().toTimeString().slice(0, 5), // Τωρινή ώρα
			vehicleCategory: "",
			manufacturer: "",
			serviceType: "άπαξ",
			serviceCategory: "",
			otherServiceDescription: "",
			agreedAmount: "",
			facilityLocation: "",
			periodicity: "",
			serviceStartDate: "",
			serviceEndDate: "",
			externalService: "",
			partnerAfm: ""
		});
	};

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
			// Έλεγχος και δημιουργία πίνακα/στηλών αν χρειάζεται
			const tableReady = await ensureTableAndColumns();
			if (!tableReady) {
				setMessage("Σφάλμα: Δεν ήταν δυνατή η προετοιμασία της βάσης δεδομένων");
				return;
			}

			// Έλεγχος υποχρεωτικών πεδίων
			if (!formData.firstName || !formData.lastName || !formData.phone || 
				!formData.vehiclePlate || !formData.entryDate || !formData.entryTime ||
				!formData.serviceType || !formData.serviceCategory || !formData.facilityLocation) {
				setMessage("Σφάλμα: Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία (με κόκκινο πλαίσιο)");
				return;
			}

			// Έλεγχος ΑΦΜ για επαναλαμβανόμενη υπηρεσία
			if (formData.serviceType === "επαναλαμβανόμενη" && !formData.afm) {
				setMessage("Σφάλμα: Το ΑΦΜ είναι υποχρεωτικό για επαναλαμβανόμενη υπηρεσία");
				return;
			}

			// Έλεγχος πεδίων για διαρκή υπηρεσία
			if (formData.serviceType === "διαρκή") {
				if (!formData.agreedAmount || !formData.periodicity || !formData.serviceStartDate) {
					setMessage("Σφάλμα: Για διαρκή υπηρεσία απαιτούνται: Συμφωνηθέν ποσό, Περιοδικότητα και Ημερομηνία έναρξης");
					return;
				}
			}

			// Έλεγχος ΑΦΜ συνεργαζόμενης οντότητας
			if (formData.externalService === "Μετακίνηση σε συνεργαζόμενη οντότητα" && !formData.partnerAfm) {
				setMessage("Σφάλμα: Το ΑΦΜ συνεργαζόμενης οντότητας είναι υποχρεωτικό");
				return;
			}

			// Έλεγχος περιγραφής για κατηγορία "Λοιπά"
			if (formData.serviceCategory === "Λοιπά" && !formData.otherServiceDescription) {
				setMessage("Σφάλμα: Η περιγραφή λοιπών υπηρεσιών είναι υποχρεωτική για την κατηγορία 'Λοιπά'");
				return;
			}

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
						credit: parseFloat(formData.credit) || 0,
						// Νέα πεδία για συνεργεία
						vehicle_plate: formData.vehiclePlate,
						entry_date: formData.entryDate,
						entry_time: formData.entryTime,
						vehicle_category: formData.vehicleCategory,
						manufacturer: formData.manufacturer,
						service_type: formData.serviceType,
						service_category: formData.serviceCategory,
						other_service_description: formData.otherServiceDescription,
						facility_location: formData.facilityLocation,
						agreed_amount: parseFloat(formData.agreedAmount) || 0,
						periodicity: formData.periodicity,
						service_start_date: formData.serviceStartDate,
						service_end_date: formData.serviceEndDate,
						external_service: formData.externalService,
						partner_afm: formData.partnerAfm
					})
					.eq("id", editingCustomer.id);

				if (error) {
					setMessage("Σφάλμα: " + error.message);
				} else {
					setMessage("Η καταχώρηση ενημερώθηκε επιτυχώς!");
					setEditingCustomer(null);
					clearForm();
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
						credit: parseFloat(formData.credit) || 0,
						// Νέα πεδία για συνεργεία
						vehicle_plate: formData.vehiclePlate,
						entry_date: formData.entryDate,
						entry_time: formData.entryTime,
						vehicle_category: formData.vehicleCategory,
						manufacturer: formData.manufacturer,
						service_type: formData.serviceType,
						service_category: formData.serviceCategory,
						other_service_description: formData.otherServiceDescription,
						facility_location: formData.facilityLocation,
						agreed_amount: parseFloat(formData.agreedAmount) || 0,
						periodicity: formData.periodicity,
						service_start_date: formData.serviceStartDate,
						service_end_date: formData.serviceEndDate,
						external_service: formData.externalService,
						partner_afm: formData.partnerAfm
					}]);

				if (error) {
					setMessage("Σφάλμα: " + error.message);
				} else {
					setMessage("Η καταχώρηση δημιουργήθηκε επιτυχώς!");
					clearForm();
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
			credit: customer.credit ? customer.credit.toString() : "",
			vehiclePlate: customer.vehicle_plate || "",
			entryDate: customer.entry_date || "",
			entryTime: customer.entry_time || "",
			vehicleCategory: customer.vehicle_category || "",
			manufacturer: customer.manufacturer || "",
			serviceType: customer.service_type || "άπαξ",
			serviceCategory: customer.service_category || "",
			otherServiceDescription: customer.other_service_description || "",
			agreedAmount: customer.agreed_amount ? customer.agreed_amount.toString() : "",
			facilityLocation: customer.facility_location || "",
			periodicity: customer.periodicity || "",
			serviceStartDate: customer.service_start_date || "",
			serviceEndDate: customer.service_end_date || "",
			externalService: customer.external_service || "",
			partnerAfm: customer.partner_afm || ""
		});
		setActiveTab("create");
		setMessage("");
	};

	const handleCancelEdit = () => {
		setEditingCustomer(null);
		clearForm();
		setMessage("");
	};

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<Menu />

			<div className="flex-1">
				<div className="flex justify-between items-center p-6 bg-white shadow-sm">
					<div>
						<h1 className="text-2xl font-bold">Ψηφιακό Πελατολόγιο - Συνεργείο Οχημάτων</h1>
						<p className="text-gray-600">Διαχείριση εγγραφών συνεργείου επισκευής, συντήρησης και φανοποιίας οχημάτων</p>
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
							Λίστα Εγγραφών
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
							{editingCustomer ? "Επεξεργασία Εγγραφής" : "Δημιουργία Νέας Εγγραφής"}
						</button>
					</div>
				</div>

				<div className="p-6">
					{activeTab === "list" ? (
						<div className="bg-white rounded-lg shadow-md">
							<div className="p-6 border-b border-gray-200">
								<h3 className="text-lg font-medium text-gray-900">Λίστα Εγγραφών Συνεργείου</h3>
								<p className="mt-1 text-sm text-gray-600">
									Συνολικά {customers.length} εγγραφές
								</p>
							</div>
							
							{loading ? (
								<div className="p-6 text-center">
									<div className="text-gray-500">Φόρτωση...</div>
								</div>
							) : customers.length === 0 ? (
								<div className="p-6 text-center">
									<div className="text-gray-500">Δεν υπάρχουν εγγραφές</div>
									<button
										onClick={() => setActiveTab("create")}
										className="mt-2 text-blue-600 hover:text-blue-500"
									>
										Δημιουργήστε την πρώτη εγγραφή
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
													Όχημα
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Είσοδος
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Υπηρεσία
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Ποσό (€)
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
														<div className="text-sm text-gray-500">{customer.phone}</div>
														{customer.afm && (
															<div className="text-xs text-gray-400">ΑΦΜ: {customer.afm}</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm font-medium text-gray-900">
															{customer.vehicle_plate || "-"}
														</div>
														{customer.vehicle_category && (
															<div className="text-sm text-gray-500">{customer.vehicle_category}</div>
														)}
														{customer.manufacturer && (
															<div className="text-sm text-gray-500">{customer.manufacturer}</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{customer.entry_date && (
															<div className="text-sm text-gray-900">
																{new Date(customer.entry_date).toLocaleDateString("el-GR")}
															</div>
														)}
														{customer.entry_time && (
															<div className="text-sm text-gray-500">{customer.entry_time}</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{customer.service_type && (
															<div className="text-sm font-medium text-gray-900">
																{customer.service_type}
															</div>
														)}
														{customer.service_category && (
															<div className="text-xs text-gray-500 max-w-xs truncate" title={customer.service_category}>
																{customer.service_category}
															</div>
														)}
														{customer.service_category === "Λοιπά" && customer.other_service_description && (
															<div className="text-xs text-blue-600 max-w-xs truncate" title={customer.other_service_description}>
																{customer.other_service_description}
															</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{customer.agreed_amount ? `€${customer.agreed_amount.toFixed(2)}` : "-"}
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
									{editingCustomer ? "Επεξεργασία Εγγραφής Συνεργείου" : "Δημιουργία Νέας Εγγραφής Συνεργείου"}
								</h3>
								{editingCustomer && (
									<div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
										<p className="text-sm text-blue-800">
											Επεξεργάζεστε την εγγραφή: <strong>{editingCustomer.first_name} {editingCustomer.last_name}</strong>
											{editingCustomer.vehicle_plate && (
												<span> - Όχημα: <strong>{editingCustomer.vehicle_plate}</strong></span>
											)}
										</p>
									</div>
								)}
							</div>
							<form onSubmit={handleSubmit} className="space-y-6">
								{/* Βασικά Στοιχεία Πελάτη */}
								<div className="bg-gray-50 p-4 rounded-md">
									<h4 className="text-md font-medium text-gray-900 mb-4">Στοιχεία Πελάτη</h4>
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
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
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
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Α.Φ.Μ. λήπτη υπηρεσίας {formData.serviceType === "επαναλαμβανόμενη" && "*"}
											</label>
											<input
												type="text"
												name="afm"
												value={formData.afm}
												onChange={handleInputChange}
												className={`w-full border-2 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
													formData.serviceType === "επαναλαμβανόμενη" 
														? "border-red-300" 
														: "border-gray-300"
												}`}
												required={formData.serviceType === "επαναλαμβανόμενη"}
											/>
										</div>
									</div>
								</div>

								{/* Στοιχεία Οχήματος */}
								<div className="bg-blue-50 p-4 rounded-md">
									<h4 className="text-md font-medium text-gray-900 mb-4">Στοιχεία Οχήματος</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Αριθμός Κυκλοφορίας Οχήματος *
											</label>
											<input
												type="text"
												name="vehiclePlate"
												value={formData.vehiclePlate}
												onChange={handleInputChange}
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="ΑΒΓ-1234"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Ημερομηνία Εισόδου *
											</label>
											<input
												type="date"
												name="entryDate"
												value={formData.entryDate}
												onChange={handleInputChange}
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
											<p className="text-xs text-gray-500 mt-1">Προεπιλογή: τρέχουσα ημερομηνία</p>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Ώρα Εισόδου *
											</label>
											<input
												type="time"
												name="entryTime"
												value={formData.entryTime}
												onChange={handleInputChange}
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
											<p className="text-xs text-gray-500 mt-1">Προεπιλογή: τρέχουσα ώρα</p>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Κατηγορία Οχήματος
												<span className="text-green-600 text-xs ml-1">(Διαλειτουργικότητα)</span>
											</label>
											<input
												type="text"
												name="vehicleCategory"
												value={formData.vehicleCategory}
												onChange={handleInputChange}
												className="w-full border-2 border-green-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="π.χ. Επιβατικό, Φορτηγό"
												readOnly
											/>
											<p className="text-xs text-green-600 mt-1">Αντλείται αυτόματα (εκτός αλλοδαπών πινακίδων)</p>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Εργοστάσιο Κατασκευής
												<span className="text-green-600 text-xs ml-1">(Διαλειτουργικότητα)</span>
											</label>
											<input
												type="text"
												name="manufacturer"
												value={formData.manufacturer}
												onChange={handleInputChange}
												className="w-full border-2 border-green-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="π.χ. Toyota, BMW"
												readOnly
											/>
											<p className="text-xs text-green-600 mt-1">Αντλείται αυτόματα (εκτός αλλοδαπών πινακίδων)</p>
										</div>
									</div>
								</div>

								{/* Τύπος και Κατηγορία Υπηρεσίας */}
								<div className="bg-green-50 p-4 rounded-md">
									<h4 className="text-md font-medium text-gray-900 mb-4">Στοιχεία Υπηρεσίας</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												α) Εγκατάσταση Οντότητας *
											</label>
											<input
												type="text"
												name="facilityLocation"
												value={formData.facilityLocation}
												onChange={handleInputChange}
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="Διεύθυνση εγκατάστασης..."
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Τύπος Υπηρεσίας *
											</label>
											<select
												name="serviceType"
												value={formData.serviceType}
												onChange={handleInputChange}
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											>
												<option value="άπαξ">Άπαξ</option>
												<option value="επαναλαμβανόμενη">Επαναλαμβανόμενη</option>
												<option value="διαρκή">Διαρκή</option>
											</select>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Κατηγορία Παρεχόμενης Υπηρεσίας *
											</label>
											<select
												name="serviceCategory"
												value={formData.serviceCategory}
												onChange={handleInputChange}
												className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											>
												<option value="">Επιλέξτε κατηγορία</option>
												<option value="Εργασία με χρήση ανταλλακτικών">Εργασία με χρήση ανταλλακτικών</option>
												<option value="Εργασία με χρήση ανταλλακτικών που προσκομίζονται από τον πελάτη">Εργασία με χρήση ανταλλακτικών που προσκομίζονται από τον πελάτη</option>
												<option value="Εργασία χωρίς χρήση ανταλλακτικών">Εργασία χωρίς χρήση ανταλλακτικών</option>
												<option value="Ιδιόχρηση">Ιδιόχρηση</option>
												<option value="Δωρεάν υπηρεσία">Δωρεάν υπηρεσία</option>
												<option value="Αποζημίωση παροχής εγγύησης">Αποζημίωση παροχής εγγύησης</option>
												<option value="Λοιπά">Λοιπά (ελεύθερο κείμενο)</option>
											</select>
										</div>

										{formData.serviceCategory === "Λοιπά" && (
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Περιγραφή Λοιπών Υπηρεσιών *
												</label>
												<textarea
													name="otherServiceDescription"
													value={formData.otherServiceDescription}
													onChange={handleInputChange}
													className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													placeholder="Περιγράψτε την υπηρεσία..."
													rows={3}
													required={formData.serviceCategory === "Λοιπά"}
												/>
											</div>
										)}

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Συμφωνηθέν Ποσό (€) {formData.serviceType === "διαρκή" && "*"}
											</label>
											<input
												type="number"
												step="0.01"
												name="agreedAmount"
												value={formData.agreedAmount}
												onChange={handleInputChange}
												className={`w-full border-2 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
													formData.serviceType === "διαρκή" 
														? "border-red-300" 
														: "border-gray-300"
												}`}
												placeholder="0.00"
												required={formData.serviceType === "διαρκή"}
											/>
											{formData.serviceType === "διαρκή" && (
												<p className="text-xs text-red-600 mt-1">Υποχρεωτικό: Περιοδικώς καταβαλλόμενο μίσθωμα</p>
											)}
										</div>
									</div>
								</div>

								{/* Διαρκής Παροχή Υπηρεσίας - Εμφανίζεται μόνο για διαρκή υπηρεσία ή λήψη σχετικού δικαιώματος */}
								{formData.serviceType === "διαρκή" && (
									<div className="bg-yellow-50 p-4 rounded-md">
										<h4 className="text-md font-medium text-gray-900 mb-2">Διαρκής Παροχή Υπηρεσίας</h4>
										<p className="text-sm text-gray-600 mb-4">
											Ειδικά στην περίπτωση της διαρκούς μίσθωσης/υπηρεσίας ή κατόπιν λήψης σχετικού δικαιώματος
										</p>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Περιοδικότητα *
													<span className="text-xs text-gray-500 block">α) Συμπληρώνεται σε περίπτωση διαρκούς μίσθωσης/υπηρεσίας</span>
												</label>
												<select
													name="periodicity"
													value={formData.periodicity}
													onChange={handleInputChange}
													className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													required={formData.serviceType === "διαρκή"}
												>
													<option value="">Επιλέξτε περιοδικότητα</option>
													<option value="Ημερησίως">Ημερησίως</option>
													<option value="Εβδομαδιαία">Εβδομαδιαία</option>
													<option value="Δεκαπενθήμερη">Δεκαπενθήμερη</option>
													<option value="Μηνιαία">Μηνιαία</option>
													<option value="Διμηνιαία">Διμηνιαία</option>
													<option value="Τριμηνιαία">Τριμηνιαία</option>
													<option value="Τετραμηνιαία">Τετραμηνιαία</option>
													<option value="Εξαμηνιαία">Εξαμηνιαία</option>
													<option value="Ετήσια">Ετήσια</option>
												</select>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Ημερομηνία Έναρξης *
													<span className="text-xs text-gray-500 block">β) Συμπληρώνεται σε περίπτωση διαρκούς μίσθωσης/υπηρεσίας ή λήψης δικαιώματος</span>
												</label>
												<input
													type="date"
													name="serviceStartDate"
													value={formData.serviceStartDate}
													onChange={handleInputChange}
													className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													required={formData.serviceType === "διαρκή"}
												/>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Ημερομηνία Λήξης
													<span className="text-xs text-gray-500 block">γ) Συμπληρώνεται σε περίπτωση διαρκούς μίσθωσης/υπηρεσίας ή λήψης δικαιώματος</span>
												</label>
												<input
													type="date"
													name="serviceEndDate"
													value={formData.serviceEndDate}
													onChange={handleInputChange}
													className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
										</div>
									</div>
								)}

								{/* Παροχή Υπηρεσιών εκτός Εγκατάστασης */}
								<div className="bg-red-50 p-4 rounded-md">
									<h4 className="text-md font-medium text-gray-900 mb-4">Παροχή Υπηρεσιών εκτός Εγκατάστασης</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Μετακίνηση
											</label>
											<select
												name="externalService"
												value={formData.externalService}
												onChange={handleInputChange}
												className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												<option value="">Δεν ισχύει</option>
												<option value="Μετακίνηση σε άλλη εγκατάσταση της επιχείρησης">Μετακίνηση σε άλλη εγκατάσταση της επιχείρησης</option>
												<option value="Μετακίνηση σε συνεργαζόμενη οντότητα">Μετακίνηση σε συνεργαζόμενη οντότητα</option>
											</select>
										</div>

										{formData.externalService === "Μετακίνηση σε συνεργαζόμενη οντότητα" && (
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Α.Φ.Μ. Συνεργαζόμενης Οντότητας *
												</label>
												<input
													type="text"
													name="partnerAfm"
													value={formData.partnerAfm}
													onChange={handleInputChange}
													className="w-full border-2 border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													required
												/>
											</div>
										)}
									</div>
								</div>

								{/* Σημειώσεις - Πάντα εμφανίζονται ως προαιρετικές */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Σημειώσεις
									</label>
									<textarea
										name="notes"
										value={formData.notes}
										onChange={handleInputChange}
										rows={4}
										className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Προαιρετικές σημειώσεις για την υπηρεσία..."
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
												? "Ενημέρωση Εγγραφής" 
												: "Δημιουργία Εγγραφής"
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
