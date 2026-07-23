-- Add PurchasePrice field to Properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS PurchasePrice DECIMAL(12,2) DEFAULT 0;

-- Update with realistic purchase prices for New Mexico properties
UPDATE properties SET PurchasePrice =
  CASE PropertyID
    WHEN 1 THEN 14400000  -- Sandia Vista Apartments (96 units * $150k/unit)
    WHEN 2 THEN 12960000  -- Plaza del Sol (72 units * $180k/unit)
    WHEN 3 THEN 18000000  -- Rio Grande Commons (120 units * $150k/unit)
    WHEN 4 THEN 11760000  -- Turquoise Trail Residences (84 units * $140k/unit)
    WHEN 5 THEN 8400000   -- Mesilla Valley Estates (60 units * $140k/unit)
    WHEN 6 THEN 16200000  -- Bosque Heights (108 units * $150k/unit)
    WHEN 7 THEN 13500000  -- Zia Park Apartments (90 units * $150k/unit)
    WHEN 8 THEN 8640000   -- Sangre de Cristo Towers (48 units * $180k/unit)
    WHEN 9 THEN 9240000   -- Organ Mountain Commons (66 units * $140k/unit)
  END
WHERE PropertyID BETWEEN 1 AND 9;

-- Update the view to include the new column
CREATE OR REPLACE VIEW "Properties" AS SELECT * FROM properties;

-- Verify
SELECT PropertyID, PropertyName, Units, PurchasePrice,
       ROUND(PurchasePrice / Units, 0) as PricePerUnit
FROM properties
ORDER BY PropertyID;
