-- Link-in-Bio for Artists — seed.sql
-- One demo artist profile with a handful of links and a portfolio grid, so
-- /u/demo-artist works with zero setup. Images are Picsum Photos
-- (https://picsum.photos) placeholders, deterministic via a seed string —
-- free, no key, no license restriction, standard placeholder-image
-- practice — swap for real portfolio images before a real launch. Run
-- after schema.sql.

insert into link_in_bio_artists_profiles
  (id, owner_id, username, display_name, bio, avatar_url, is_published)
values (
  '33333333-3333-3333-3333-333333333333',
  null,
  'demo-artist',
  'Sasha Rivera',
  'Illustrator & muralist based in Belgrade. Available for commissions and brand collaborations.',
  'https://picsum.photos/seed/sasha-rivera-avatar/300/300',
  true
)
on conflict (id) do nothing;

insert into link_in_bio_artists_links (profile_id, label, url, sort_order) values
  ('33333333-3333-3333-3333-333333333333', 'Portfolio site', 'https://example.com', 1),
  ('33333333-3333-3333-3333-333333333333', 'Instagram', 'https://instagram.com/example', 2),
  ('33333333-3333-3333-3333-333333333333', 'Commission form', 'https://example.com/commissions', 3),
  ('33333333-3333-3333-3333-333333333333', 'Print shop', 'https://example.com/shop', 4);

insert into link_in_bio_artists_portfolio_items (profile_id, image_url, caption, sort_order) values
  ('33333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/sasha-portfolio-1/600/600', 'Mural, Savamala district', 1),
  ('33333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/sasha-portfolio-2/600/600', 'Editorial illustration series', 2),
  ('33333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/sasha-portfolio-3/600/600', 'Album cover art', 3),
  ('33333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/sasha-portfolio-4/600/600', 'Studio sketchbook', 4),
  ('33333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/sasha-portfolio-5/600/600', 'Live painting event', 5);
