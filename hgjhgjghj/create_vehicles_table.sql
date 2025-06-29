-- SQL Script για τη δημιουργία του πίνακα vehicles (οχήματα)
-- Εκτέλεσε αυτό το script στο SQL Editor της Supabase

-- Δημιουργία πίνακα vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    chassis_number VARCHAR(50),
    make VARCHAR(50) NOT NULL, -- Κατασκευαστής (π.χ. Toyota, BMW)
    model VARCHAR(100) NOT NULL, -- Μοντέλο (π.χ. Corolla, X3)
    year INTEGER,
    engine_capacity VARCHAR(20), -- Κυβικά (π.χ. 1600cc, 2.0L)
    fuel_type VARCHAR(30), -- Καύσιμο (Βενζίνη, Πετρέλαιο, Υβριδικό)
    transmission VARCHAR(30), -- Κιβώτιο (Χειροκίνητο, Αυτόματο)
    color VARCHAR(50), -- Χρώμα
    mileage INTEGER, -- Χιλιόμετρα
    vin VARCHAR(17), -- Vehicle Identification Number
    notes TEXT, -- Σημειώσεις
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ευρετήριο για γρήγορη αναζήτηση
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- Σχόλια για τις στήλες
COMMENT ON TABLE vehicles IS 'Πίνακας οχημάτων για το συνεργείο';
COMMENT ON COLUMN vehicles.customer_id IS 'Αναφορά στον ιδιοκτήτη πελάτη';
COMMENT ON COLUMN vehicles.license_plate IS 'Πινακίδες κυκλοφορίας';
COMMENT ON COLUMN vehicles.chassis_number IS 'Αριθμός πλαισίου';
COMMENT ON COLUMN vehicles.make IS 'Κατασκευαστής οχήματος';
COMMENT ON COLUMN vehicles.model IS 'Μοντέλο οχήματος';
COMMENT ON COLUMN vehicles.year IS 'Έτος κατασκευής';
COMMENT ON COLUMN vehicles.engine_capacity IS 'Κυβικά κινητήρα';
COMMENT ON COLUMN vehicles.fuel_type IS 'Τύπος καυσίμου';
COMMENT ON COLUMN vehicles.transmission IS 'Τύπος κιβωτίου';
COMMENT ON COLUMN vehicles.mileage IS 'Χιλιόμετρα οχήματος';
COMMENT ON COLUMN vehicles.vin IS 'Αριθμός VIN';

-- RLS (Row Level Security) - Απενεργοποίηση για εσωτερική χρήση
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy για να επιτρέπει όλες τις ενέργειες (διάβασμα, εισαγωγή, ενημέρωση, διαγραφή)
DROP POLICY IF EXISTS "Allow all operations on vehicles" ON vehicles;
CREATE POLICY "Allow all operations on vehicles" ON vehicles
    FOR ALL USING (true) WITH CHECK (true);

-- Επιβεβαίωση της δημιουργίας
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;
