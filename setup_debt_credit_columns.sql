-- SQL Script για την προσθήκη των στηλών debt και credit στον πίνακα customers
-- Εκτέλεσε αυτό το script στο SQL Editor της Supabase

-- Προσθήκη στήλης debt (χρέος) αν δεν υπάρχει
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'debt'
    ) THEN
        ALTER TABLE customers ADD COLUMN debt DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN customers.debt IS 'Χρέος πελάτη σε ευρώ';
    END IF;
END $$;

-- Προσθήκη στήλης credit (πίστωση) αν δεν υπάρχει
DO $$ 
BEGIN
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

-- Ενημέρωση υπαρχόντων εγγραφών με προεπιλεγμένες τιμές
UPDATE customers 
SET debt = 0.00 
WHERE debt IS NULL;

UPDATE customers 
SET credit = 0.00 
WHERE credit IS NULL;

-- Επιβεβαίωση των αλλαγών
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('debt', 'credit')
ORDER BY column_name;
