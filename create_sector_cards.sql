-- Create standardized A1-F16 sector card system
-- Each sector gets identical equipment types with consistent numbering

-- Core equipment types that every sector needs
-- A1-F1: CCTV, A2-F2: Van Pack, A3-F3: Jet Vac, etc.

-- UTILITIES (A1-A10)
INSERT INTO pr2_configurations (sector, category_id, category_name, description) VALUES
('utilities', 'cctv', 'A1 - CCTV Survey', 'CCTV inspection and condition assessment surveys'),
('utilities', 'van-pack', 'A2 - Van Pack', 'Van Pack mobile equipment for sewer maintenance operations'),
('utilities', 'jet-vac', 'A3 - Jet Vac', 'High-pressure water jetting and vacuum services'),
('utilities', 'cctv-van-pack', 'A4 - CCTV/Van Pack', 'CCTV Van Pack equipment with MM4 robotic cutting capabilities'),
('utilities', 'cctv-jet-vac', 'A5 - CCTV/Jet Vac', 'Combined CCTV inspection with jet vac services'),
('utilities', 'cctv-cleansing-root-cutting', 'A6 - CCTV/Cleansing/Root', 'Combined CCTV inspection, cleansing and root cutting operations'),
('utilities', 'directional-water-cutter', 'A7 - Directional Water Cutter', 'Precise directional water cutting services'),
('utilities', 'patching', 'A8 - Patching', 'Patch repair and reinstatement services'),
('utilities', 'f-robot-cutting', 'A9 - Robotic Cutting', 'Robotic cutting and grinding operations');

-- ADOPTION (B1-B9)
INSERT INTO pr2_configurations (sector, category_id, category_name, description) VALUES
('adoption', 'cctv', 'B1 - CCTV Survey', 'CCTV inspection and condition assessment surveys'),
('adoption', 'van-pack', 'B2 - Van Pack', 'Van Pack mobile equipment for sewer maintenance operations'),
('adoption', 'jet-vac', 'B3 - Jet Vac', 'High-pressure water jetting and vacuum services'),
('adoption', 'cctv-van-pack', 'B4 - CCTV/Van Pack', 'CCTV Van Pack equipment with MM4 robotic cutting capabilities'),
('adoption', 'cctv-jet-vac', 'B5 - CCTV/Jet Vac', 'Combined CCTV inspection with jet vac services'),
('adoption', 'cctv-cleansing-root-cutting', 'B6 - CCTV/Cleansing/Root', 'Combined CCTV inspection, cleansing and root cutting operations'),
('adoption', 'directional-water-cutter', 'B7 - Directional Water Cutter', 'Precise directional water cutting services'),
('adoption', 'patching', 'B8 - Patching', 'Patch repair and reinstatement services'),
('adoption', 'f-robot-cutting', 'B9 - Robotic Cutting', 'Robotic cutting and grinding operations');

-- HIGHWAYS (C1-C9)
INSERT INTO pr2_configurations (sector, category_id, category_name, description) VALUES
('highways', 'cctv', 'C1 - CCTV Survey', 'CCTV inspection and condition assessment surveys'),
('highways', 'van-pack', 'C2 - Van Pack', 'Van Pack mobile equipment for sewer maintenance operations'),
('highways', 'jet-vac', 'C3 - Jet Vac', 'High-pressure water jetting and vacuum services'),
('highways', 'cctv-van-pack', 'C4 - CCTV/Van Pack', 'CCTV Van Pack equipment with MM4 robotic cutting capabilities'),
('highways', 'cctv-jet-vac', 'C5 - CCTV/Jet Vac', 'Combined CCTV inspection with jet vac services'),
('highways', 'cctv-cleansing-root-cutting', 'C6 - CCTV/Cleansing/Root', 'Combined CCTV inspection, cleansing and root cutting operations'),
('highways', 'directional-water-cutter', 'C7 - Directional Water Cutter', 'Precise directional water cutting services'),
('highways', 'patching', 'C8 - Patching', 'Patch repair and reinstatement services'),
('highways', 'f-robot-cutting', 'C9 - Robotic Cutting', 'Robotic cutting and grinding operations');

-- INSURANCE (D1-D9)
INSERT INTO pr2_configurations (sector, category_id, category_name, description) VALUES
('insurance', 'cctv', 'D1 - CCTV Survey', 'CCTV inspection and condition assessment surveys'),
('insurance', 'van-pack', 'D2 - Van Pack', 'Van Pack mobile equipment for sewer maintenance operations'),
('insurance', 'jet-vac', 'D3 - Jet Vac', 'High-pressure water jetting and vacuum services'),
('insurance', 'cctv-van-pack', 'D4 - CCTV/Van Pack', 'CCTV Van Pack equipment with MM4 robotic cutting capabilities'),
('insurance', 'cctv-jet-vac', 'D5 - CCTV/Jet Vac', 'Combined CCTV inspection with jet vac services'),
('insurance', 'cctv-cleansing-root-cutting', 'D6 - CCTV/Cleansing/Root', 'Combined CCTV inspection, cleansing and root cutting operations'),
('insurance', 'directional-water-cutter', 'D7 - Directional Water Cutter', 'Precise directional water cutting services'),
('insurance', 'patching', 'D8 - Patching', 'Patch repair and reinstatement services'),
('insurance', 'f-robot-cutting', 'D9 - Robotic Cutting', 'Robotic cutting and grinding operations');

-- CONSTRUCTION (E1-E9)
INSERT INTO pr2_configurations (sector, category_id, category_name, description) VALUES
('construction', 'cctv', 'E1 - CCTV Survey', 'CCTV inspection and condition assessment surveys'),
('construction', 'van-pack', 'E2 - Van Pack', 'Van Pack mobile equipment for sewer maintenance operations'),
('construction', 'jet-vac', 'E3 - Jet Vac', 'High-pressure water jetting and vacuum services'),
('construction', 'cctv-van-pack', 'E4 - CCTV/Van Pack', 'CCTV Van Pack equipment with MM4 robotic cutting capabilities'),
('construction', 'cctv-jet-vac', 'E5 - CCTV/Jet Vac', 'Combined CCTV inspection with jet vac services'),
('construction', 'cctv-cleansing-root-cutting', 'E6 - CCTV/Cleansing/Root', 'Combined CCTV inspection, cleansing and root cutting operations'),
('construction', 'directional-water-cutter', 'E7 - Directional Water Cutter', 'Precise directional water cutting services'),
('construction', 'patching', 'E8 - Patching', 'Patch repair and reinstatement services'),
('construction', 'f-robot-cutting', 'E9 - Robotic Cutting', 'Robotic cutting and grinding operations');

-- DOMESTIC (F1-F9)
INSERT INTO pr2_configurations (sector, category_id, category_name, description) VALUES
('domestic', 'cctv', 'F1 - CCTV Survey', 'CCTV inspection and condition assessment surveys'),
('domestic', 'van-pack', 'F2 - Van Pack', 'Van Pack mobile equipment for sewer maintenance operations'),
('domestic', 'jet-vac', 'F3 - Jet Vac', 'High-pressure water jetting and vacuum services'),
('domestic', 'cctv-van-pack', 'F4 - CCTV/Van Pack', 'CCTV Van Pack equipment with MM4 robotic cutting capabilities'),
('domestic', 'cctv-jet-vac', 'F5 - CCTV/Jet Vac', 'Combined CCTV inspection with jet vac services'),
('domestic', 'cctv-cleansing-root-cutting', 'F6 - CCTV/Cleansing/Root', 'Combined CCTV inspection, cleansing and root cutting operations'),
('domestic', 'directional-water-cutter', 'F7 - Directional Water Cutter', 'Precise directional water cutting services'),
('domestic', 'patching', 'F8 - Patching', 'Patch repair and reinstatement services'),
('domestic', 'f-robot-cutting', 'F9 - Robotic Cutting', 'Robotic cutting and grinding operations');