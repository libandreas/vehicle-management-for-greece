-- SQL Script για την προσθήκη του πεδίου full_vehicle_name στον πίνακα vehicles
-- Εκτέλεσε αυτό το script στο SQL Editor της Supabase

-- ΒΗΜΑ 1: Προσθήκη του πεδίου full_vehicle_name
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS full_vehicle_name VARCHAR(200);

-- ΒΗΜΑ 2: Αφαίρεση NOT NULL constraints από παλιά πεδία
ALTER TABLE vehicles 
ALTER COLUMN make DROP NOT NULL;

ALTER TABLE vehicles 
ALTER COLUMN model DROP NOT NULL;

-- ΒΗΜΑ 3: Ενημέρωση υπαρχόντων εγγραφών με κενές τιμές στα παλιά πεδία
UPDATE vehicles 
SET make = '' 
WHERE make IS NULL;

UPDATE vehicles 
SET model = '' 
WHERE model IS NULL;

-- ΒΗΜΑ 4: Σχόλιο για τη νέα στήλη
COMMENT ON COLUMN vehicles.full_vehicle_name IS 'Πλήρες όνομα οχήματος (π.χ. Toyota Corolla 2020 1.6L)';

-- ΒΗΜΑ 5: Μετανάστευση δεδομένων από παλιά πεδία στο full_vehicle_name
UPDATE vehicles 
SET full_vehicle_name = CONCAT_WS(' ', 
    NULLIF(TRIM(make), ''), 
    NULLIF(TRIM(model), ''), 
    CASE WHEN year IS NOT NULL THEN CAST(year AS TEXT) END,
    NULLIF(TRIM(engine_capacity), '')
)
WHERE (full_vehicle_name IS NULL OR full_vehicle_name = '') 
AND (make IS NOT NULL OR model IS NOT NULL OR year IS NOT NULL OR engine_capacity IS NOT NULL);

-- ΒΗΜΑ 6: Ορισμός προεπιλεγμένης τιμής για κενά full_vehicle_name
UPDATE vehicles 
SET full_vehicle_name = 'Άγνωστο όχημα'ssh-keygen -t ed25519 -C "your_email@example.com"cat ~/.ssh/id_ed25519.pubcat ~/.ssh/id_ed25519.pub
WHERE full_vehicle_name IS NULL OR TRIM(full_vehicle_name) = '';

-- ΒΗΜΑ 7: Εμφάνιση των δεδομένων για επιβεβαίωση
SELECT 
    id, 
    license_plate,
    make,
    model,
    year,
    engine_capacity,
    full_vehicle_name,
    created_at
FROM vehicles
ORDER BY created_at DESC
LIMIT 10;
