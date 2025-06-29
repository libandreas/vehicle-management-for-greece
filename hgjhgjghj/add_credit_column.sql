-- Προσθήκη στήλης credit στον πίνακα customers
ALTER TABLE customers 
ADD COLUMN credit DECIMAL(10,2) DEFAULT 0.00;

-- Προαιρετικό: Ενημέρωση υπαρχόντων εγγραφών με προεπιλεγμένη τιμή 0
UPDATE customers 
SET credit = 0.00 
WHERE credit IS NULL;

-- Σχόλιο για την στήλη
COMMENT ON COLUMN customers.credit IS 'Πίστωση - Ποσό που χρωστάει το κατάστημα στον πελάτη';
