-- REV V8.1 ROLLBACK SCRIPT - TP1 TEMPLATE SYSTEM LOCKED
-- Run this script to restore the exact state of ID 152 and TP1 template

-- Restore ID 152 CCTV Jet Vac Configuration
UPDATE pr2_configurations 
SET 
  pricing_options = '[{"id": "price_dayrate", "label": "Day Rate", "value": "1850", "enabled": true}]',
  quantity_options = '[{"id": "quantity_runs", "label": "Runs per Shift", "value": "25", "enabled": true}]',
  min_quantity_options = '[{"id": "minquantity_runs", "label": "Min Runs per Shift", "value": "25", "enabled": true}]',
  range_options = '[{"id": "range_percentage", "label": "Percentage", "enabled": true, "rangeEnd": "30", "rangeStart": "0"}, {"id": "range_length", "label": "Length", "enabled": true, "rangeEnd": "33.99", "rangeStart": "0"}]',
  description = 'Day Rate = £1850. ÷. Runs per Shift = 25. Min Runs per Shift = 25. Percentage = 0 to 30. Length = 0 to 33.99',
  category_color = '#ee719e'
WHERE id = 152;

-- Verify the restoration
SELECT id, category_id, category_name, description, pricing_options, quantity_options, min_quantity_options, range_options, category_color 
FROM pr2_configurations 
WHERE id = 152;