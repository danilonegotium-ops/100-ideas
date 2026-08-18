-- QR Menu 2.0 — seed.sql
-- Demo restaurant with a full menu and a few tables, so the ordering flow
-- works end-to-end with zero admin setup. Run after schema.sql.
--
-- owner_id is left NULL on purpose (no real Supabase user exists yet). The
-- public routes (/r/demo-bistro, /r/demo-bistro/t/<table-id>) work
-- immediately. The /admin dashboard for THIS restaurant only becomes
-- reachable once a real user exists and this row's owner_id is updated to
-- that user's auth.uid() — see SPEC.md.

insert into qr_menu_2_restaurants (id, owner_id, slug, name)
values ('11111111-1111-1111-1111-111111111111', null, 'demo-bistro', 'Demo Bistro')
on conflict (id) do nothing;

insert into qr_menu_2_categories (id, restaurant_id, name, sort_order) values
  ('11111111-1111-1111-1111-1111111111c1', '11111111-1111-1111-1111-111111111111', 'Starters', 1),
  ('11111111-1111-1111-1111-1111111111c2', '11111111-1111-1111-1111-111111111111', 'Mains', 2),
  ('11111111-1111-1111-1111-1111111111c3', '11111111-1111-1111-1111-111111111111', 'Drinks', 3),
  ('11111111-1111-1111-1111-1111111111c4', '11111111-1111-1111-1111-111111111111', 'Desserts', 4)
on conflict (id) do nothing;

insert into qr_menu_2_menu_items (restaurant_id, category_id, name, description, price_cents, is_available, sort_order) values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c1', 'Grilled Halloumi', 'With honey and cracked pepper', 890, true, 1),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c1', 'Soup of the Day', 'Ask your server for today''s soup', 650, true, 2),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c1', 'Crispy Calamari', 'Served with lemon aioli', 1050, true, 3),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c2', 'Classic Cheeseburger', 'Beef patty, cheddar, house sauce, fries', 1450, true, 1),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c2', 'Margherita Pizza', 'San Marzano tomato, mozzarella, basil', 1350, true, 2),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c2', 'Grilled Salmon', 'Seasonal vegetables, lemon butter', 1890, true, 3),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c2', 'Wild Mushroom Risotto', 'Parmesan, truffle oil (v)', 1590, false, 4),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c3', 'Fresh Orange Juice', '', 450, true, 1),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c3', 'Sparkling Water', '500ml', 350, true, 2),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c3', 'House Red Wine', 'Glass, 150ml', 750, true, 3),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c4', 'Chocolate Lava Cake', 'Vanilla ice cream', 790, true, 1),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-1111111111c4', 'Tiramisu', 'Classic Italian recipe', 750, true, 2);

insert into qr_menu_2_tables (id, restaurant_id, label) values
  ('11111111-1111-1111-1111-1111111111d1', '11111111-1111-1111-1111-111111111111', 'Table 1'),
  ('11111111-1111-1111-1111-1111111111d2', '11111111-1111-1111-1111-111111111111', 'Table 2'),
  ('11111111-1111-1111-1111-1111111111d3', '11111111-1111-1111-1111-111111111111', 'Table 3'),
  ('11111111-1111-1111-1111-1111111111d4', '11111111-1111-1111-1111-111111111111', 'Patio 1')
on conflict (id) do nothing;
