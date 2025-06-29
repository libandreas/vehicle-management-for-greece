-- Προσθήκη στήλης debt στον πίνακα customers
ALTER TABLE customers 
ADD COLUMN debt DECIMAL(10,2) DEFAULT 0.00;

-- Προαιρετικό: Ενημέρωση υπαρχόντων εγγραφών με προεπιλεγμένη τιμή 0
UPDATE customers 
SET debt = 0.00 
WHERE debt IS NULL;

-- Σχόλιο για την στήλη
COMMENT ON COLUMN customers.debt IS 'Χρέος πελάτη σε ευρώ';
