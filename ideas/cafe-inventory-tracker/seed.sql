-- Cafe Inventory Tracker — seed.sql
-- ~10 demo items in varied states: comfortably stocked, right at the
-- reorder line, already out of stock, and one item with no usage data
-- (daily_usage_rate = 0) to exercise the "can't compute days left" case.
-- Run after schema.sql.

insert into cafe_inventory_tracker_items
  (name, unit, current_stock, reorder_threshold, daily_usage_rate, category, notes) values
  ('Whole Milk', 'L', 8, 10, 6, 'Dairy', 'Delivered Mon/Thu from local dairy'),
  ('Oat Milk', 'L', 15, 5, 3, 'Dairy alternative', null),
  ('Almond Milk', 'L', 0, 5, 2, 'Dairy alternative', 'Out — 86''d from menu until restock'),
  ('Espresso Beans — Dark Roast', 'kg', 4, 3, 2.5, 'Coffee', null),
  ('Espresso Beans — Light Roast', 'kg', 12, 3, 1, 'Coffee', null),
  ('White Sugar', 'kg', 20, 5, 0.8, 'Sweeteners', null),
  ('Brown Sugar', 'kg', 2, 2, 0.3, 'Sweeteners', null),
  ('Vanilla Syrup', 'bottles', 3, 2, 0.4, 'Syrups', null),
  ('Caramel Syrup', 'bottles', 1, 2, 0.5, 'Syrups', 'Popular in fall — order extra'),
  ('12oz Paper Cups', 'sleeves', 40, 15, 5, 'Disposables', null),
  ('Napkins', 'packs', 5, 10, 1, 'Disposables', null),
  ('Chai Concentrate', 'bottles', 6, 2, 0, 'Syrups', 'New item, no usage history yet');
