CREATE SEQUENCE delivery_note_number_seq START WITH 1;

ALTER TABLE delivery_notes ADD COLUMN number BIGINT;
UPDATE delivery_notes SET number = id;
SELECT setval('delivery_note_number_seq', (SELECT COALESCE(MAX(number), 0) + 1 FROM delivery_notes));
ALTER TABLE delivery_notes ALTER COLUMN number SET NOT NULL;
ALTER TABLE delivery_notes ALTER COLUMN number SET DEFAULT nextval('delivery_note_number_seq');
CREATE UNIQUE INDEX idx_delivery_notes_number ON delivery_notes (number);

ALTER TABLE delivery_notes DROP COLUMN tax_percentage;
