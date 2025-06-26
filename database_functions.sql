-- SQL Functions για αυτόματη δημιουργία πινάκων και στηλών
-- Αυτές οι functions θα καλούνται από την εφαρμογή για να βεβαιωθεί ότι η βάση δεδομένων είναι σωστά δομημένη

-- Function για δημιουργία του πίνακα customers αν δεν υπάρχει
CREATE OR REPLACE FUNCTION create_customers_table()
RETURNS VOID AS $$
BEGIN
    -- Δημιουργία πίνακα customers αν δεν υπάρχει
    CREATE TABLE IF NOT EXISTS customers (
        id BIGSERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    
    -- Δημιουργία trigger για updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
    CREATE TRIGGER update_customers_updated_at
        BEFORE UPDATE ON customers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
    RAISE NOTICE 'Πίνακας customers δημιουργήθηκε ή ήδη υπάρχει';
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
    -- Έλεγχος αν η στήλη υπάρχει ήδη
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_name = $2
    ) THEN
        -- Προσθήκη στήλης
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', $1, $2, $3);
        RAISE NOTICE 'Στήλη % προστέθηκε στον πίνακα %', $2, $1;
    ELSE
        RAISE NOTICE 'Στήλη % ήδη υπάρχει στον πίνακα %', $2, $1;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Σφάλμα κατά την προσθήκη στήλης %: %', $2, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function για εξασφάλιση ότι όλες οι απαραίτητες στήλες υπάρχουν
CREATE OR REPLACE FUNCTION ensure_customers_columns()
RETURNS VOID AS $$
BEGIN
    -- Προσθήκη όλων των απαραίτητων στηλών για το ψηφιακό πελατολόγιο συνεργείου
    
    -- Βασικά στοιχεία πελάτη
    PERFORM add_column_if_not_exists('customers', 'patronymic', 'VARCHAR(100)');
    PERFORM add_column_if_not_exists('customers', 'afm', 'VARCHAR(20)');
    PERFORM add_column_if_not_exists('customers', 'debt', 'DECIMAL(10,2) DEFAULT 0.00');
    PERFORM add_column_if_not_exists('customers', 'credit', 'DECIMAL(10,2) DEFAULT 0.00');
    
    -- Στοιχεία οχήματος
    PERFORM add_column_if_not_exists('customers', 'vehicle_plate', 'VARCHAR(20)');
    PERFORM add_column_if_not_exists('customers', 'entry_date', 'DATE');
    PERFORM add_column_if_not_exists('customers', 'entry_time', 'TIME');
    PERFORM add_column_if_not_exists('customers', 'vehicle_category', 'VARCHAR(100)');
    PERFORM add_column_if_not_exists('customers', 'manufacturer', 'VARCHAR(100)');
    
    -- Στοιχεία υπηρεσίας
    PERFORM add_column_if_not_exists('customers', 'facility_location', 'VARCHAR(200)');
    PERFORM add_column_if_not_exists('customers', 'service_type', 'VARCHAR(50)');
    PERFORM add_column_if_not_exists('customers', 'service_category', 'VARCHAR(200)');
    PERFORM add_column_if_not_exists('customers', 'other_service_description', 'TEXT');
    PERFORM add_column_if_not_exists('customers', 'agreed_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    
    -- Διαρκής παροχή υπηρεσίας
    PERFORM add_column_if_not_exists('customers', 'periodicity', 'VARCHAR(50)');
    PERFORM add_column_if_not_exists('customers', 'service_start_date', 'DATE');
    PERFORM add_column_if_not_exists('customers', 'service_end_date', 'DATE');
    
    -- Παροχή υπηρεσιών εκτός εγκατάστασης
    PERFORM add_column_if_not_exists('customers', 'external_service', 'VARCHAR(200)');
    PERFORM add_column_if_not_exists('customers', 'partner_afm', 'VARCHAR(20)');
    
    RAISE NOTICE 'Όλες οι απαραίτητες στήλες του πίνακα customers έχουν εξασφαλιστεί';
END;
$$ LANGUAGE plpgsql;

-- Function που θα καλείται από την εφαρμογή για πλήρη setup
CREATE OR REPLACE FUNCTION setup_customers_database()
RETURNS VOID AS $$
BEGIN
    -- Δημιουργία πίνακα
    PERFORM create_customers_table();
    
    -- Εξασφάλιση όλων των στηλών
    PERFORM ensure_customers_columns();
    
    RAISE NOTICE 'Η βάση δεδομένων για το ψηφιακό πελατολόγιο έχει ρυθμιστεί επιτυχώς';
END;
$$ LANGUAGE plpgsql;
