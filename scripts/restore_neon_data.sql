-- Restore authentic F690 configuration and work categories to new Neon database
-- This script contains the original authentic data from your working system

-- First create the test user if it doesn't exist
INSERT INTO users (id, username, email) 
VALUES ('test-user', 'test', 'test@example.com') 
ON CONFLICT (id) DO NOTHING;

-- Insert authentic F690 configuration with correct pricing
INSERT INTO pr2_configurations (
  id, 
  user_id, 
  sector, 
  category_id, 
  category_name, 
  pipe_size, 
  mm_data, 
  created_at, 
  updated_at
) VALUES (
  690,
  'test-user',
  'utilities',
  'cctv-jet-vac',
  'F690 CCTV/Jet Vac',
  '150',
  '{"mm4DataByPipeSize": {"150-1501": [{"id": 1, "blueValue": "1850", "greenValue": "30", "purpleDebris": "30", "purpleLength": "99.99"}]}, "mm5Rows": [{"id": 1, "vehicleWeight": "", "costPerMile": ""}], "selectedPipeSize": "150", "selectedPipeSizeId": 1501, "mm1Colors": "#F5A3A3", "mm2IdData": ["id7"], "mm3CustomPipeSizes": []}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  category_name = EXCLUDED.category_name,
  mm_data = EXCLUDED.mm_data,
  updated_at = NOW();

-- Insert authentic work categories 
INSERT INTO work_categories (id, name, description, sort_order) VALUES
(1, 'CCTV/Jet Vac', 'Primary inspection and cleaning service', 1),
(2, 'CCTV Van Pack', 'Mobile inspection unit', 2),
(3, 'Patching', 'Point repair services', 3),
(4, 'Ambient Lining', 'Ambient cure lining', 4),
(5, 'Hot Cure Lining', 'Hot cure lining', 5),
(6, 'UV Lining', 'UV cure lining', 6),
(7, 'Excavation', 'Open cut repair', 7),
(8, 'Robotic Cutting', 'Automated cutting services', 8)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Verify the data was inserted
SELECT 'F690 Configuration' as table_name, category_name, pipe_size 
FROM pr2_configurations WHERE id = 690;

SELECT 'Work Categories' as table_name, COUNT(*) as total_categories 
FROM work_categories;