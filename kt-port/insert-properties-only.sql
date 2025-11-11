-- Insert just the 9 properties first
-- Run this FIRST before inserting financial data

INSERT INTO Properties (PropertyID, PropertyName, Address, City, State, ZipCode, Units, YearBuilt)
VALUES
    (1, 'Sandia Vista Apartments', '4250 Montgomery Blvd NE', 'Albuquerque', 'NM', '87109', 96, 2018),
    (2, 'Plaza del Sol', '1875 St. Michaels Dr', 'Santa Fe', 'NM', '87505', 72, 2019),
    (3, 'Rio Grande Commons', '5100 Lomas Blvd NW', 'Albuquerque', 'NM', '87120', 120, 2017),
    (4, 'Turquoise Trail Residences', '8500 Central Ave SE', 'Albuquerque', 'NM', '87108', 84, 2016),
    (5, 'Mesilla Valley Estates', '2200 E Lohman Ave', 'Las Cruces', 'NM', '88001', 60, 2015),
    (6, 'Bosque Heights', '3300 Candelaria Rd NE', 'Albuquerque', 'NM', '87107', 108, 2020),
    (7, 'Zia Park Apartments', '1450 Southern Blvd SE', 'Rio Rancho', 'NM', '87124', 90, 2019),
    (8, 'Sangre de Cristo Towers', '925 Paseo de Peralta', 'Santa Fe', 'NM', '87501', 48, 2018),
    (9, 'Organ Mountain Commons', '1100 S Valley Dr', 'Las Cruces', 'NM', '88005', 66, 2017)
ON CONFLICT (PropertyID) DO NOTHING;

-- Verify all 9 were inserted
SELECT PropertyID, PropertyName FROM Properties ORDER BY PropertyID;
