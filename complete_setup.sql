-- SQL Script για τη δημιουργία του συστήματος οχημάτων
-- Εκτέλεσε αυτό το script στο SQL Editor της Supabase

-- ΒΗΜΑ 1: Προσθήκη στηλών debt και credit στον πίνακα customers (αν δεν υπάρχουν)
DO $$ 
BEGIN
    -- Προσθήκη στήλης debt
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'debt'
    ) THEN
        ALTER TABLE customers ADD COLUMN debt DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN customers.debt IS 'Χρέος πελάτη σε ευρώ';
    END IF;
    
    -- Προσθήκη στήλης credit
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'credit'
    ) THEN
        ALTER TABLE customers ADD COLUMN credit DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN customers.credit IS 'Πίστωση - Ποσό που χρωστάει το κατάστημα στον πελάτη';
    END IF;
END $$;

-- ΒΗΜΑ 2: Δημιουργία πίνακα vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    chassis_number VARCHAR(50),
    make VARCHAR(50), -- Κατασκευαστής (deprecated)
    model VARCHAR(100), -- Μοντέλο (deprecated)
    year INTEGER, -- Έτος (deprecated)
    engine_capacity VARCHAR(20), -- Κυβικά (deprecated)
    full_vehicle_name VARCHAR(200), -- Πλήρες όνομα οχήματος
    fuel_type VARCHAR(30), -- Καύσιμο
    transmission VARCHAR(30), -- Κιβώτιο
    color VARCHAR(50), -- Χρώμα
    mileage INTEGER, -- Χιλιόμετρα
    vin VARCHAR(17), -- VIN
    notes TEXT, -- Σημειώσεις
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ΒΗΜΑ 3: Δημιουργία ευρετηρίων
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- ΒΗΜΑ 4: Προσθήκη σχολίων
COMMENT ON TABLE vehicles IS 'Πίνακας οχημάτων για το συνεργείο';
COMMENT ON COLUMN vehicles.customer_id IS 'Αναφορά στον ιδιοκτήτη πελάτη';
COMMENT ON COLUMN vehicles.license_plate IS 'Πινακίδες κυκλοφορίας';
COMMENT ON COLUMN vehicles.chassis_number IS 'Αριθμός πλαισίου';
COMMENT ON COLUMN vehicles.make IS 'Κατασκευαστής οχήματος (deprecated)';
COMMENT ON COLUMN vehicles.model IS 'Μοντέλο οχήματος (deprecated)';
COMMENT ON COLUMN vehicles.year IS 'Έτος κατασκευής (deprecated)';
COMMENT ON COLUMN vehicles.engine_capacity IS 'Κυβικά κινητήρα (deprecated)';
COMMENT ON COLUMN vehicles.full_vehicle_name IS 'Πλήρες όνομα οχήματος (π.χ. Toyota Corolla 2020 1.6L)';
COMMENT ON COLUMN vehicles.fuel_type IS 'Τύπος καυσίμου';
COMMENT ON COLUMN vehicles.transmission IS 'Τύπος κιβωτίου';
COMMENT ON COLUMN vehicles.mileage IS 'Χιλιόμετρα οχήματος';
COMMENT ON COLUMN vehicles.vin IS 'Αριθμός VIN';

-- ΒΗΜΑ 5: Ενεργοποίηση RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- ΒΗΜΑ 6: Δημιουργία policies
DROP POLICY IF EXISTS "Allow all operations on vehicles" ON vehicles;
CREATE POLICY "Allow all operations on vehicles" ON vehicles
    FOR ALL USING (true) WITH CHECK (true);

-- ΒΗΜΑ 7: Ενημέρωση υπαρχόντων εγγραφών πελατών
UPDATE customers 
SET debt = 0.00 
WHERE debt IS NULL;

UPDATE customers 
SET credit = 0.00 
WHERE credit IS NULL;

-- ΒΗΜΑ 7.5: Προσθήκη full_vehicle_name αν δεν υπάρχει
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles' 
        AND column_name = 'full_vehicle_name'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN full_vehicle_name VARCHAR(200);
        COMMENT ON COLUMN vehicles.full_vehicle_name IS 'Πλήρες όνομα οχήματος (π.χ. Toyota Corolla 2020 1.6L)';
    END IF;
END $$;

-- ΒΗΜΑ 7.6: Μετανάστευση δεδομένων από παλιά πεδία στο full_vehicle_name
UPDATE vehicles 
SET full_vehicle_name = CONCAT_WS(' ', 
    NULLIF(make, ''), 
    NULLIF(model, ''), 
    CASE WHEN year IS NOT NULL THEN CAST(year AS TEXT) END,
    NULLIF(engine_capacity, '')
)
WHERE full_vehicle_name IS NULL OR full_vehicle_name = '';

-- ΒΗΜΑ 8: Επιβεβαίωση των αλλαγών
SELECT 'Πίνακας customers - Στήλες debt/credit:' as info;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('debt', 'credit')
ORDER BY column_name;

SELECT 'Πίνακας vehicles - Όλες οι στήλες:' as info;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;
