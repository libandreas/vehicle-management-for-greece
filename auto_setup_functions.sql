-- SQL Functions για αυτόματη δημιουργία πίνακα και στηλών
-- Εκτέλεσε αυτό το script στο SQL Editor της Supabase

-- Function για δημιουργία πίνακα customers αν δεν υπάρχει
CREATE OR REPLACE FUNCTION create_customers_table()
RETURNS VOID AS $$
BEGIN
    -- Δημιουργία πίνακα customers με βασικές στήλες
    EXECUTE '
    CREATE TABLE IF NOT EXISTS customers (
        id BIGSERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc''::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(''utc''::text, NOW()) NOT NULL
    )';
    
    -- Δημιουργία trigger για updated_at
    EXECUTE '
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = TIMEZONE(''utc''::text, NOW());
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql';
    
    EXECUTE '
    DROP TRIGGER IF EXISTS update_customers_updated_at ON customers';
    
    EXECUTE '
    CREATE TRIGGER update_customers_updated_at
        BEFORE UPDATE ON customers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()';
END;
$$ LANGUAGE plpgsql;

-- Function για προσθήκη στήλης αν δεν υπάρχει
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name TEXT,
    column_name TEXT,
    column_type TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Έλεγχος αν υπάρχει η στήλη
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = add_column_if_not_exists.table_name 
        AND column_name = add_column_if_not_exists.column_name
    ) THEN
        -- Προσθήκη στήλης
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                      add_column_if_not_exists.table_name, 
                      add_column_if_not_exists.column_name, 
                      column_type);
        
        RAISE NOTICE 'Προστέθηκε στήλη %.% με τύπο %', 
                     add_column_if_not_exists.table_name, 
                     add_column_if_not_exists.column_name, 
                     column_type;
    ELSE
        RAISE NOTICE 'Η στήλη %.% υπάρχει ήδη', 
                     add_column_if_not_exists.table_name, 
                     add_column_if_not_exists.column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function για έλεγχο αν υπάρχει πίνακας
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = table_exists.table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Εκτέλεση αρχικής δημιουργίας πίνακα (αν δεν υπάρχει)
SELECT create_customers_table();

-- Προσθήκη όλων των απαραίτητων στηλών για το ψηφιακό πελατολόγιο
SELECT add_column_if_not_exists('customers', 'vehicle_plate', 'VARCHAR(20)');
SELECT add_column_if_not_exists('customers', 'entry_date', 'DATE');
SELECT add_column_if_not_exists('customers', 'entry_time', 'TIME');
SELECT add_column_if_not_exists('customers', 'vehicle_category', 'VARCHAR(100)');
SELECT add_column_if_not_exists('customers', 'manufacturer', 'VARCHAR(100)');
SELECT add_column_if_not_exists('customers', 'service_type', 'VARCHAR(50)');
SELECT add_column_if_not_exists('customers', 'service_category', 'VARCHAR(200)');
SELECT add_column_if_not_exists('customers', 'agreed_amount', 'DECIMAL(10,2) DEFAULT 0.00');
SELECT add_column_if_not_exists('customers', 'periodicity', 'VARCHAR(50)');
SELECT add_column_if_not_exists('customers', 'service_start_date', 'DATE');
SELECT add_column_if_not_exists('customers', 'service_end_date', 'DATE');
SELECT add_column_if_not_exists('customers', 'external_service', 'VARCHAR(200)');
SELECT add_column_if_not_exists('customers', 'partner_afm', 'VARCHAR(20)');
SELECT add_column_if_not_exists('customers', 'patronymic', 'VARCHAR(100)');
SELECT add_column_if_not_exists('customers', 'afm', 'VARCHAR(20)');
SELECT add_column_if_not_exists('customers', 'debt', 'DECIMAL(10,2) DEFAULT 0.00');
SELECT add_column_if_not_exists('customers', 'credit', 'DECIMAL(10,2) DEFAULT 0.00');

-- Προσθήκη σχολίων στις στήλες
COMMENT ON COLUMN customers.vehicle_plate IS 'Αριθμός κυκλοφορίας οχήματος - Υποχρεωτικό';
COMMENT ON COLUMN customers.entry_date IS 'Ημερομηνία εισόδου στο συνεργείο - Υποχρεωτικό';
COMMENT ON COLUMN customers.entry_time IS 'Ώρα εισόδου στο συνεργείο - Υποχρεωτικό';
COMMENT ON COLUMN customers.vehicle_category IS 'Κατηγορία οχήματος (διαλειτουργικότητα)';
COMMENT ON COLUMN customers.manufacturer IS 'Εργοστάσιο κατασκευής (διαλειτουργικότητα)';
COMMENT ON COLUMN customers.service_type IS 'Τύπος υπηρεσίας (άπαξ, επαναλαμβανόμενη, διαρκή) - Υποχρεωτικό';
COMMENT ON COLUMN customers.service_category IS 'Κατηγορία παρεχόμενης υπηρεσίας - Υποχρεωτικό';
COMMENT ON COLUMN customers.agreed_amount IS 'Συμφωνηθέν ποσό σε ευρώ';
COMMENT ON COLUMN customers.periodicity IS 'Περιοδικότητα για διαρκή υπηρεσία';
COMMENT ON COLUMN customers.service_start_date IS 'Ημερομηνία έναρξης διαρκούς υπηρεσίας';
COMMENT ON COLUMN customers.service_end_date IS 'Ημερομηνία λήξης διαρκούς υπηρεσίας';
COMMENT ON COLUMN customers.external_service IS 'Παροχή υπηρεσιών εκτός εγκατάστασης';
COMMENT ON COLUMN customers.partner_afm IS 'ΑΦΜ συνεργαζόμενης οντότητας';
COMMENT ON COLUMN customers.patronymic IS 'Πατρώνυμο πελάτη';
COMMENT ON COLUMN customers.afm IS 'ΑΦΜ λήπτη υπηρεσίας (υποχρεωτικό για επαναλαμβανόμενη)';
COMMENT ON COLUMN customers.debt IS 'Χρέος πελάτη σε ευρώ';
COMMENT ON COLUMN customers.credit IS 'Πίστωση - Ποσό που χρωστάει το κατάστημα στον πελάτη';

-- Δημιουργία ευρετηρίων για βελτίωση της απόδοσης
CREATE INDEX IF NOT EXISTS idx_customers_vehicle_plate ON customers(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_customers_entry_date ON customers(entry_date);
CREATE INDEX IF NOT EXISTS idx_customers_service_type ON customers(service_type);
CREATE INDEX IF NOT EXISTS idx_customers_afm ON customers(afm);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Ενημέρωση επιτυχίας
DO $$
BEGIN
    RAISE NOTICE 'Η δημιουργία/ενημέρωση του πίνακα customers ολοκληρώθηκε επιτυχώς!';
    RAISE NOTICE 'Ο πίνακας περιέχει όλες τις απαραίτητες στήλες για το ψηφιακό πελατολόγιο συνεργείου.';
END $$;
