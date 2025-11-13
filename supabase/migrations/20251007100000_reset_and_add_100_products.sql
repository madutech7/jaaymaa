-- ============================================
-- CRÉATION DES CATÉGORIES (SI ELLES N'EXISTENT PAS)
-- ============================================

INSERT INTO categories (name, slug, description, "order", is_active) VALUES
('Électronique', 'electronics', 'Appareils et accessoires électroniques', 1, TRUE),
('Mode', 'fashion', 'Vêtements et accessoires de mode', 2, TRUE),
('Maison & Jardin', 'home', 'Articles pour la maison et le jardin', 3, TRUE),
('Sport & Fitness', 'sport', 'Équipements de sport et fitness', 4, TRUE),
('Beauté & Santé', 'beauty', 'Produits de beauté et santé', 5, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUPPRESSION DE TOUS LES PRODUITS EXISTANTS
-- ============================================

DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM product_recommendations;
DELETE FROM reviews;
DELETE FROM wishlists;
DELETE FROM inventory_logs;
DELETE FROM products;

-- ============================================
-- AJOUT DE 100 NOUVEAUX PRODUITS AVEC VRAIES PHOTOS
-- ============================================

-- Électronique (30 produits)
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, sku, stock, images, category_id, brand, is_featured, is_new_arrival, status) VALUES
('iPhone 15 Pro Max', 'iphone-15-pro-max', 'Le dernier iPhone avec puce A17 Pro et appareil photo 48MP', 'Écran 6.7", 256GB, Titane', 850000, 950000, 'ELEC-001', 45, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1678652197950-62e8c7e5b3ae?w=800","alt":"iPhone 15 Pro","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1678685888221-c82e8c65ad33?w=800","alt":"iPhone 15 Pro 2","isPrimary":false,"order":2},{"id":"3","url":"https://images.unsplash.com/photo-1678652197968-e0c8a3b8c9b5?w=800","alt":"iPhone 15 Pro 3","isPrimary":false,"order":3}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Apple', true, true, 'active'),

('Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Smartphone Android flagship avec S Pen intégré', 'Écran AMOLED 6.8", 512GB, 5G', 780000, 880000, 'ELEC-002', 38, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800","alt":"Samsung Galaxy","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800","alt":"Samsung Galaxy 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Samsung', true, true, 'active'),

('MacBook Pro 16"', 'macbook-pro-16', 'Ordinateur portable professionnel avec puce M3 Max', '36GB RAM, 1TB SSD, Liquid Retina XDR', 1950000, 2200000, 'ELEC-003', 22, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800","alt":"MacBook Pro","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800","alt":"MacBook Pro 2","isPrimary":false,"order":2},{"id":"3","url":"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800","alt":"MacBook Pro 3","isPrimary":false,"order":3}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Apple', true, false, 'active'),

('Dell XPS 15', 'dell-xps-15', 'Laptop ultra-performant pour créatifs et développeurs', '32GB RAM, 1TB SSD, RTX 4060', 1650000, 1850000, 'ELEC-004', 30, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800","alt":"Dell XPS","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800","alt":"Dell XPS 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Dell', false, true, 'active'),

('AirPods Pro 2', 'airpods-pro-2', 'Écouteurs sans fil avec réduction de bruit adaptative', 'ANC, Spatial Audio, USB-C', 185000, 220000, 'ELEC-005', 120, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800","alt":"AirPods Pro","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800","alt":"AirPods Pro 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Apple', true, true, 'active'),

('Sony WH-1000XM5', 'sony-wh-1000xm5', 'Casque premium avec meilleure ANC du marché', '30h autonomie, Bluetooth 5.2, Multipoint', 280000, 350000, 'ELEC-006', 65, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800","alt":"Sony Headphones","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800","alt":"Sony Headphones 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Sony', true, false, 'active'),

('iPad Pro 12.9"', 'ipad-pro-129', 'Tablette professionnelle avec puce M2', '512GB, Wi-Fi + 5G, Magic Keyboard', 980000, 1150000, 'ELEC-007', 40, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800","alt":"iPad Pro","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1585790050230-5dd28404f0a1?w=800","alt":"iPad Pro 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Apple', true, true, 'active'),

('Samsung Galaxy Tab S9', 'samsung-tab-s9', 'Tablette Android avec S Pen inclus', 'Écran AMOLED 11", 256GB, DeX Mode', 520000, 620000, 'ELEC-008', 55, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800","alt":"Samsung Tab","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800","alt":"Samsung Tab 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Samsung', false, true, 'active'),

('Apple Watch Ultra 2', 'apple-watch-ultra-2', 'Montre connectée pour les aventuriers', 'Titane, GPS double fréquence, 36h autonomie', 650000, 750000, 'ELEC-009', 48, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800","alt":"Apple Watch","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800","alt":"Apple Watch 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Apple', true, true, 'active'),

('Samsung Galaxy Watch 6', 'samsung-watch-6', 'Montre intelligente avec suivi santé complet', 'Analyse composition corporelle, ECG, SpO2', 280000, 350000, 'ELEC-010', 72, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800","alt":"Samsung Watch","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800","alt":"Samsung Watch 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Samsung', false, false, 'active'),

('Canon EOS R6 Mark II', 'canon-eos-r6-mark-ii', 'Appareil photo hybride professionnel', '24MP, 4K 60fps, IBIS, Autofocus intelligent', 1850000, 2100000, 'ELEC-011', 18, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800","alt":"Canon Camera","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800","alt":"Canon Camera 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Canon', true, false, 'active'),

('Sony A7 IV', 'sony-a7-iv', 'Hybride plein format polyvalent', '33MP, 4K 60fps, 10bit 4:2:2', 1650000, 1900000, 'ELEC-012', 25, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1606980657686-3aa7fcee2c1e?w=800","alt":"Sony Camera","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1606980761988-e2cfc7d4900e?w=800","alt":"Sony Camera 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Sony', true, true, 'active'),

('DJI Mini 4 Pro', 'dji-mini-4-pro', 'Drone compact avec vidéo 4K HDR', 'Omnidirectional sensors, 34min vol, 249g', 720000, 850000, 'ELEC-013', 32, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800","alt":"DJI Drone","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=800","alt":"DJI Drone 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'DJI', true, true, 'active'),

('GoPro Hero 12', 'gopro-hero-12', 'Caméra d''action ultra-résistante', '5.3K60, HyperSmooth 6.0, étanche 10m', 350000, 420000, 'ELEC-014', 58, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1585508889330-c6dde8ced762?w=800","alt":"GoPro","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1606053721625-8f6ac7a3d3b1?w=800","alt":"GoPro 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'GoPro', false, true, 'active'),

('PlayStation 5', 'playstation-5', 'Console nouvelle génération', '825GB SSD, Ray tracing, 4K 120fps', 420000, 500000, 'ELEC-015', 35, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800","alt":"PS5","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800","alt":"PS5 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Sony', true, true, 'active'),

('Xbox Series X', 'xbox-series-x', 'Console Microsoft 4K', '1TB SSD, Quick Resume, Game Pass', 400000, 480000, 'ELEC-016', 42, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800","alt":"Xbox","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800","alt":"Xbox 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Microsoft', true, false, 'active'),

('Nintendo Switch OLED', 'nintendo-switch-oled', 'Console hybride avec écran OLED', 'Écran 7", 64GB, Joy-Con améliorés', 280000, 320000, 'ELEC-017', 68, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800","alt":"Switch OLED","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1585857187825-2f87f6e23c85?w=800","alt":"Switch OLED 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Nintendo', true, true, 'active'),

('LG OLED C3 55"', 'lg-oled-c3-55', 'TV OLED 4K avec AI', 'α9 Gen 6, 120Hz, HDMI 2.1, Dolby Vision', 1250000, 1450000, 'ELEC-018', 28, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800","alt":"LG OLED","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1593359863068-cfed63de3bbb?w=800","alt":"LG OLED 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'LG', true, false, 'active'),

('Samsung QN90C 65"', 'samsung-qn90c-65', 'TV Neo QLED 4K', 'Mini LED, 144Hz, Anti-reflet', 1480000, 1680000, 'ELEC-019', 24, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1593078165976-f71a38126484?w=800","alt":"Samsung TV","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1593078163425-c7042bfb50e8?w=800","alt":"Samsung TV 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Samsung', true, true, 'active'),

('Sonos Arc', 'sonos-arc', 'Barre de son Dolby Atmos', '11 haut-parleurs, eARC, Trueplay', 720000, 850000, 'ELEC-020', 45, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800","alt":"Sonos Arc","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800","alt":"Sonos Arc 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Sonos', false, false, 'active'),

('Logitech MX Master 3S', 'logitech-mx-master-3s', 'Souris ergonomique sans fil', '8000 DPI, Silent clicks, Multi-device', 85000, 110000, 'ELEC-021', 95, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1527814050087-3793815479db?w=800","alt":"Logitech Mouse","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800","alt":"Logitech Mouse 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Logitech', false, true, 'active'),

('Razer BlackWidow V4', 'razer-blackwidow-v4', 'Clavier mécanique gaming RGB', 'Green switches, Media keys, Repose-poignets', 145000, 180000, 'ELEC-022', 78, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800","alt":"Razer Keyboard","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1595225476474-87563907a212?w=800","alt":"Razer Keyboard 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Razer', false, true, 'active'),

('Samsung T7 Shield 2TB', 'samsung-t7-shield-2tb', 'SSD externe robuste et rapide', '1050 MB/s, IP65, USB 3.2 Gen 2', 180000, 220000, 'ELEC-023', 110, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800","alt":"Samsung SSD","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800","alt":"Samsung SSD 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Samsung', false, false, 'active'),

('Anker PowerCore 20K', 'anker-powercore-20k', 'Batterie externe haute capacité', '20000mAh, 22.5W fast charge, 2 ports', 42000, 55000, 'ELEC-024', 145, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800","alt":"Anker PowerBank","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1622535317308-32e5ac7a11b6?w=800","alt":"Anker PowerBank 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Anker', false, true, 'active'),

('Ring Video Doorbell Pro', 'ring-doorbell-pro', 'Sonnette connectée avec caméra HD', '1080p HDR, Vision nocturne, Alexa', 195000, 240000, 'ELEC-025', 62, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1558002038-1055907df827?w=800","alt":"Ring Doorbell","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1558089687-8e00e3e63dfe?w=800","alt":"Ring Doorbell 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Ring', false, true, 'active'),

('Philips Hue Starter Kit', 'philips-hue-starter-kit', 'Kit d''éclairage intelligent', '4 ampoules + pont, 16 millions couleurs', 165000, 210000, 'ELEC-026', 85, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800","alt":"Philips Hue","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1550684851-fac5c861d6b4?w=800","alt":"Philips Hue 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Philips', false, false, 'active'),

('Amazon Echo Dot 5', 'amazon-echo-dot-5', 'Enceinte intelligente compacte', 'Alexa, Capteur température, Smart home', 48000, 62000, 'ELEC-027', 125, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=800","alt":"Echo Dot","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800","alt":"Echo Dot 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Amazon', false, true, 'active'),

('Nest Learning Thermostat', 'nest-thermostat', 'Thermostat intelligent auto-programmable', 'Économie énergie, App mobile, Alexa/Google', 220000, 270000, 'ELEC-028', 52, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800","alt":"Nest","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800","alt":"Nest 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Google', true, false, 'active'),

('Bose QuietComfort Earbuds II', 'bose-qc-earbuds-ii', 'Écouteurs avec ANC personnalisée', 'CustomTune, 6h autonomie, IPX4', 240000, 290000, 'ELEC-029', 74, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800","alt":"Bose Earbuds","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800","alt":"Bose Earbuds 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Bose', true, true, 'active'),

('Kindle Paperwhite', 'kindle-paperwhite', 'Liseuse numérique avec éclairage', 'Écran 6.8", IPX8, 16GB, 10 semaines', 125000, 150000, 'ELEC-030', 98, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1592422546481-20b14e9c4bcc?w=800","alt":"Kindle","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800","alt":"Kindle 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'Amazon', false, false, 'active');

-- Mode & Accessoires (25 produits)
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, sku, stock, images, category_id, brand, is_featured, is_new_arrival, status) VALUES
('Veste en Cuir Noir', 'veste-cuir-noir', 'Veste en cuir véritable style biker', '100% cuir, doublure satin, poches multiples', 295000, 380000, 'MODE-001', 35, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800","alt":"Leather Jacket","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800","alt":"Leather Jacket 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'LuxeLeather', true, true, 'active'),

('Jean Slim Fit Bleu', 'jean-slim-bleu', 'Jean stretch confortable coupe moderne', 'Denim stretch, coupe ajustée, 5 poches', 42000, 58000, 'MODE-002', 145, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1542272604-787c3835535d?w=800","alt":"Jeans","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800","alt":"Jeans 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'UrbanDenim', false, false, 'active'),

('T-Shirt Bio Blanc', 'tshirt-bio-blanc', 'T-shirt en coton biologique premium', '100% coton bio certifié, coupe classique', 18000, 25000, 'MODE-003', 220, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800","alt":"White Tshirt","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800","alt":"White Tshirt 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'EcoStyle', false, true, 'active'),

('Chemise Oxford Bleu', 'chemise-oxford-bleu', 'Chemise classique en coton Oxford', 'Col boutonné, coupe regular, facile entretien', 52000, 68000, 'MODE-004', 95, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800","alt":"Oxford Shirt","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800","alt":"Oxford Shirt 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'ClassicMen', false, false, 'active'),

('Pull en Laine Mérinos', 'pull-laine-merinos', 'Pull col rond en pure laine mérinos', '100% laine mérinos, doux et chaud', 98000, 135000, 'MODE-005', 72, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800","alt":"Wool Sweater","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=800","alt":"Wool Sweater 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'WoolCraft', true, false, 'active'),

('Costume Deux Pièces', 'costume-deux-pieces', 'Costume élégant pour occasions spéciales', 'Laine, coupe slim, veste + pantalon', 385000, 480000, 'MODE-006', 42, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","alt":"Suit","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1593030662806-7c44e6bfcd4b?w=800","alt":"Suit 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'TailorMade', true, true, 'active'),

('Robe Cocktail Noire', 'robe-cocktail-noire', 'Robe élégante pour soirées', 'Coupe ajustée, tissu noble, fermeture zip', 185000, 245000, 'MODE-007', 58, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800","alt":"Black Dress","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800","alt":"Black Dress 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'EveningGlow', true, true, 'active'),

('Sneakers Blanches Cuir', 'sneakers-blanches', 'Baskets minimalistes en cuir', 'Cuir italien, semelle confort, intemporelles', 125000, 165000, 'MODE-008', 88, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800","alt":"White Sneakers","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800","alt":"White Sneakers 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'FootStyle', false, true, 'active'),

('Bottes Chelsea Marron', 'bottes-chelsea-marron', 'Bottines Chelsea en daim', 'Daim premium, élastiques latéraux, semelle crêpe', 165000, 210000, 'MODE-009', 64, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800","alt":"Chelsea Boots","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800","alt":"Chelsea Boots 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'BritStyle', false, false, 'active'),

('Sac à Main Cuir', 'sac-main-cuir', 'Sac à main élégant en cuir véritable', 'Cuir pleine fleur, compartiments multiples', 225000, 290000, 'MODE-010', 48, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800","alt":"Leather Bag","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800","alt":"Leather Bag 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'LuxeBags', true, false, 'active'),

('Ceinture Cuir Italien', 'ceinture-cuir-italien', 'Ceinture classique en cuir italien', 'Cuir vachette, boucle argentée, 3.5cm', 58000, 78000, 'MODE-011', 125, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1624222247344-550fb60583f2?w=800","alt":"Belt","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800","alt":"Belt 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'ItalianStyle', false, false, 'active'),

('Montre Automatique', 'montre-automatique', 'Montre mécanique de luxe', 'Mouvement automatique, saphir, 100m', 485000, 620000, 'MODE-012', 28, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800","alt":"Watch","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800","alt":"Watch 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'TimeClassic', true, true, 'active'),

('Lunettes de Soleil Aviateur', 'lunettes-aviateur', 'Lunettes style aviateur intemporelles', 'Verres polarisés, monture métal, UV400', 95000, 125000, 'MODE-013', 82, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800","alt":"Sunglasses","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1577803645773-f96470509666?w=800","alt":"Sunglasses 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'SunStyle', false, true, 'active'),

('Écharpe Cachemire', 'echarpe-cachemire', 'Écharpe luxueuse en pur cachemire', '100% cachemire mongol, doux et chaud', 145000, 185000, 'MODE-014', 68, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800","alt":"Scarf","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1601924638867-1a2f9c1c285b?w=800","alt":"Scarf 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'CashmereTouch', true, false, 'active'),

('Portefeuille Cuir Minimaliste', 'portefeuille-minimaliste', 'Portefeuille compact en cuir', 'RFID blocking, 6 emplacements cartes', 48000, 62000, 'MODE-015', 145, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1627123424574-724758594e93?w=800","alt":"Wallet","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1613000549446-e07e7b50b4e7?w=800","alt":"Wallet 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'MinimalLeather', false, true, 'active'),

('Casquette Baseball Premium', 'casquette-baseball', 'Casquette ajustable de qualité', 'Coton sergé, visière courbée, bandeau anti-sueur', 32000, 42000, 'MODE-016', 165, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800","alt":"Cap","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800","alt":"Cap 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'CapCulture', false, false, 'active'),

('Gants Cuir Doublés', 'gants-cuir-doubles', 'Gants en cuir avec doublure cachemire', 'Cuir agneau, intérieur cachemire, tactiles', 88000, 115000, 'MODE-017', 72, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1584729613043-45cf2e1c67fa?w=800","alt":"Gloves","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1601924637163-4c6b14d1f8d8?w=800","alt":"Gloves 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'WinterLux', false, false, 'active'),

('Veste Bomber Aviateur', 'veste-bomber', 'Blouson bomber style militaire', 'Nylon résistant, col côtelé, poches MA-1', 185000, 235000, 'MODE-018', 52, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800","alt":"Bomber Jacket","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=800","alt":"Bomber Jacket 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'MilitaryStyle', false, true, 'active'),

('Pantalon Chino Beige', 'pantalon-chino-beige', 'Chino coupe droite versatile', 'Coton gabardine, coupe confort, 4 poches', 62000, 82000, 'MODE-019', 110, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800","alt":"Chinos","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800","alt":"Chinos 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'CasualWear', false, false, 'active'),

('Short Bermuda Sport', 'short-bermuda-sport', 'Short confortable pour l''été', 'Tissu respirant, ceinture élastique, séchage rapide', 38000, 52000, 'MODE-020', 135, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800","alt":"Shorts","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1591195853663-2ac54485f939?w=800","alt":"Shorts 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'SummerFit', false, false, 'active'),

('Polo Piqué Classic', 'polo-pique-classic', 'Polo en coton piqué de qualité', '100% coton piqué, col côte, coupe regular', 52000, 68000, 'MODE-021', 120, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1626497764746-6dc36546b388?w=800","alt":"Polo","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1626497843227-0dadd9e36e6a?w=800","alt":"Polo 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'PoloClub', false, false, 'active'),

('Sweat à Capuche Premium', 'sweat-capuche-premium', 'Hoodie confortable en molleton épais', 'Coton molletonné, poche kangourou, cordon', 78000, 98000, 'MODE-022', 145, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800","alt":"Hoodie","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1509942774463-acf339c97765?w=800","alt":"Hoodie 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'StreetWear', false, true, 'active'),

('Jogging Sportswear', 'jogging-sportswear', 'Pantalon de jogging confortable', 'Coton-polyester, poches zippées, chevilles ajustables', 62000, 82000, 'MODE-023', 125, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1552902876-2f7f82c13e8b?w=800","alt":"Joggers","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1624378440070-64c78984d2bb?w=800","alt":"Joggers 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'ActiveWear', false, false, 'active'),

('Veste Imperméable', 'veste-impermeable', 'Veste de pluie technique', 'Membrane imperméable, capuche ajustable, respirante', 145000, 195000, 'MODE-024', 68, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800","alt":"Rain Jacket","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800","alt":"Rain Jacket 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'OutdoorGear', false, true, 'active'),

('Doudoune Légère', 'doudoune-legere', 'Doudoune compacte et chaude', 'Duvet 90/10, déperlant, ultra-léger', 195000, 260000, 'MODE-025', 58, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800","alt":"Down Jacket","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1548126032-bb4b2f48ff58?w=800","alt":"Down Jacket 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'WinterWear', true, false, 'active');

-- Maison & Jardin (20 produits)
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, sku, stock, images, category_id, brand, is_featured, is_new_arrival, status) VALUES
('Canapé d''Angle Moderne', 'canape-angle-moderne', 'Canapé spacieux et confortable', 'Tissu premium, 6 places, convertible', 485000, 620000, 'HOME-001', 18, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800","alt":"Sofa","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800","alt":"Sofa 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'HomeComfort', true, true, 'active'),

('Table à Manger Bois Massif', 'table-manger-bois', 'Table élégante en chêne massif', 'Chêne massif, 8 personnes, finition huilée', 385000, 480000, 'HOME-002', 22, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800","alt":"Dining Table","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800","alt":"Dining Table 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'WoodCraft', true, false, 'active'),

('Lit King Size avec Rangement', 'lit-king-size', 'Lit confortable avec tiroirs intégrés', 'Sommier à lattes, 4 tiroirs, tête de lit capitonnée', 295000, 380000, 'HOME-003', 28, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800","alt":"Bed","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800","alt":"Bed 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'SleepWell', false, true, 'active'),

('Matelas Mémoire de Forme', 'matelas-memoire', 'Matelas ergonomique haute qualité', '7 zones, mousse mémoire, housse déhoussable', 225000, 290000, 'HOME-004', 42, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800","alt":"Mattress","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=800","alt":"Mattress 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'ComfortSleep', true, false, 'active'),

('Bureau Gaming RGB', 'bureau-gaming-rgb', 'Bureau gamer avec LED et porte-câbles', 'Surface 140x70cm, RGB, tapis souris intégré', 185000, 245000, 'HOME-005', 35, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800","alt":"Gaming Desk","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800","alt":"Gaming Desk 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'GamerSpace', false, true, 'active'),

('Chaise Bureau Ergonomique', 'chaise-bureau-ergo', 'Fauteuil de bureau avec support lombaire', 'Réglages multiples, mesh respirant, accoudoirs 4D', 225000, 290000, 'HOME-006', 58, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800","alt":"Office Chair","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800","alt":"Office Chair 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'ErgoWork', true, false, 'active'),

('Bibliothèque Murale', 'bibliotheque-murale', 'Étagères murales modulaires', 'Bois MDF, 5 niveaux, fixations invisibles', 125000, 165000, 'HOME-007', 48, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800","alt":"Bookshelf","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=800","alt":"Bookshelf 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'WallDecor', false, false, 'active'),

('Lampe sur Pied Design', 'lampe-pied-design', 'Lampadaire moderne arc', 'Marbre base, bras arqué, LED dimmable', 165000, 210000, 'HOME-008', 42, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800","alt":"Floor Lamp","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800","alt":"Floor Lamp 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'LightDesign', false, true, 'active'),

('Miroir Rond XXL', 'miroir-rond-xxl', 'Grand miroir décoratif avec cadre métal', 'Diamètre 80cm, cadre laiton, fixation murale', 145000, 185000, 'HOME-009', 32, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1618220179428-22790b461013?w=800","alt":"Mirror","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1615537242654-2e6cd9e6f0d0?w=800","alt":"Mirror 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'DecorStyle', false, false, 'active'),

('Tapis Berbère 200x300', 'tapis-berbere', 'Tapis laine fait main style berbère', 'Laine naturelle, motifs géométriques, 200x300cm', 285000, 360000, 'HOME-010', 25, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1600166898405-da9535204843?w=800","alt":"Rug","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1625819729959-3d78e88b8e2c?w=800","alt":"Rug 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'RugArt', true, false, 'active'),

('Set de Cuisine 12 Pièces', 'set-cuisine-12pieces', 'Batterie de cuisine professionnelle', 'Inox 18/10, tous feux, lave-vaisselle', 245000, 320000, 'HOME-011', 38, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800","alt":"Cookware Set","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1584990347449-39b3b9c0c41c?w=800","alt":"Cookware Set 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'ChefPro', true, true, 'active'),

('Couteaux Japonais Set', 'couteaux-japonais', 'Set de 5 couteaux acier damassé', 'Acier VG-10, manche pakkawood, bloc bambou', 385000, 480000, 'HOME-012', 28, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800","alt":"Knife Set","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800","alt":"Knife Set 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'BladeArt', true, false, 'active'),

('Machine à Café Expresso', 'machine-cafe-expresso', 'Machine expresso automatique', 'Broyeur céramique, écran tactile, 15 bars', 580000, 720000, 'HOME-013', 32, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800","alt":"Coffee Machine","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800","alt":"Coffee Machine 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'CafeBrew', true, true, 'active'),

('Blender Haute Performance', 'blender-haute-performance', 'Blender professionnel 2000W', '2L, 32000 RPM, programmes auto, inox', 185000, 245000, 'HOME-014', 52, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1585515320310-259814833e62?w=800","alt":"Blender","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800","alt":"Blender 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'PowerBlend', false, true, 'active'),

('Aspirateur Robot Intelligent', 'aspirateur-robot', 'Robot aspirateur avec cartographie AI', 'LIDAR, 3000Pa, app mobile, station auto-vidage', 385000, 480000, 'HOME-015', 45, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800","alt":"Robot Vacuum","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=800","alt":"Robot Vacuum 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'SmartClean', true, true, 'active'),

('Purificateur d''Air HEPA', 'purificateur-air-hepa', 'Purificateur d''air intelligent', 'Filtre HEPA H13, capteurs qualité air, app', 225000, 290000, 'HOME-016', 38, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1595420083424-54c08a5de2b4?w=800","alt":"Air Purifier","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1610569244414-5e7453c3a0c5?w=800","alt":"Air Purifier 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'PureAir', true, false, 'active'),

('Ventilateur Tour Silencieux', 'ventilateur-tour', 'Ventilateur colonne avec télécommande', 'Oscillation 90°, minuterie 8h, mode nuit', 95000, 125000, 'HOME-017', 68, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1585148841692-1b5a2a9d1c26?w=800","alt":"Tower Fan","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1558882224-dda166733046?w=800","alt":"Tower Fan 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'CoolAir', false, false, 'active'),

('Humidificateur Ultrasonique', 'humidificateur-ultrasonique', 'Humidificateur d''air silencieux', '6L, 40h autonomie, diffusion huiles essentielles', 78000, 98000, 'HOME-018', 85, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1621618858933-d5f8be0aea1e?w=800","alt":"Humidifier","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?w=800","alt":"Humidifier 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'AirWell', false, true, 'active'),

('Draps Satin de Coton', 'draps-satin-coton', 'Parure de lit luxueuse 4 pièces', 'Coton égyptien 500 fils, satin, 160x200cm', 125000, 165000, 'HOME-019', 72, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800","alt":"Bed Sheets","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1615800098892-9e5095a52769?w=800","alt":"Bed Sheets 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'LinenLux', false, false, 'active'),

('Plaid en Laine Douce', 'plaid-laine-douce', 'Couverture moelleuse premium', 'Laine mérinos, 150x200cm, ultra-doux', 88000, 115000, 'HOME-020', 95, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1605980413788-7c3f8d8b2048?w=800","alt":"Blanket","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800","alt":"Blanket 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'CozyHome', false, false, 'active');

-- Sport & Fitness (15 produits)
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, sku, stock, images, category_id, brand, is_featured, is_new_arrival, status) VALUES
('Tapis de Course Pliable', 'tapis-course-pliable', 'Tapis de course électrique pliable', 'Moteur 2.5HP, 0-16km/h, écran LCD, bluetooth', 485000, 620000, 'SPORT-001', 22, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1556817411-58c45dd94e8c?w=800","alt":"Treadmill","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800","alt":"Treadmill 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'FitPro', true, true, 'active'),

('Vélo d''Appartement Magnétique', 'velo-appartement', 'Vélo stationnaire avec résistance magnétique', '16 niveaux, écran LCD, support tablette', 285000, 360000, 'SPORT-002', 35, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800","alt":"Exercise Bike","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1559364663-8c9c6e4d7c2f?w=800","alt":"Exercise Bike 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'CycleFit', true, false, 'active'),

('Set Haltères Ajustables', 'halteres-ajustables', 'Haltères à disques amovibles 2x20kg', '2x20kg, disques fonte, barres chrome', 145000, 185000, 'SPORT-003', 58, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1574351758396-d7d1fef79f73?w=800","alt":"Dumbbells","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800","alt":"Dumbbells 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'PowerLift', false, true, 'active'),

('Banc de Musculation Multi-fonction', 'banc-musculation', 'Banc ajustable avec supports', 'Inclinable 7 positions, max 300kg, compact', 195000, 245000, 'SPORT-004', 42, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800","alt":"Weight Bench","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1534438097545-e9cee96be7a1?w=800","alt":"Weight Bench 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'GymPro', false, false, 'active'),

('Barre de Traction Murale', 'barre-traction-murale', 'Barre multifonction fixation murale', 'Acier robuste, poignées multiples, 150kg max', 88000, 115000, 'SPORT-005', 72, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=800","alt":"Pull up Bar","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800","alt":"Pull up Bar 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'BodyFit', false, false, 'active'),

('Tapis de Yoga Premium', 'tapis-yoga-premium', 'Tapis de yoga écologique épais', '5mm TPE, anti-dérapant, sangle transport', 48000, 62000, 'SPORT-006', 125, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800","alt":"Yoga Mat","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1592432678016-e910b452be9a?w=800","alt":"Yoga Mat 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'YogaFlow', false, true, 'active'),

('Kettlebell 12kg', 'kettlebell-12kg', 'Kettlebell en fonte revêtue', '12kg, revêtement vinyle, poignée large', 52000, 68000, 'SPORT-007', 95, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800","alt":"Kettlebell","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1588286163145-f4ce732e9c9d?w=800","alt":"Kettlebell 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'IronKing', false, false, 'active'),

('Corde à Sauter Speed', 'corde-sauter-speed', 'Corde à sauter professionnelle', 'Roulements à billes, poignées ergonomiques, ajustable', 28000, 38000, 'SPORT-008', 158, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800","alt":"Jump Rope","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1592188657297-c6473609e988?w=800","alt":"Jump Rope 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'SpeedFit', false, false, 'active'),

('Bandes Élastiques Set', 'bandes-elastiques-set', 'Set de 5 bandes de résistance', '5 résistances, poignées, ancrage porte, sac', 38000, 52000, 'SPORT-009', 145, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1598289431256-c6a704b4fe30?w=800","alt":"Resistance Bands","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1591946119358-9b49a7bb0489?w=800","alt":"Resistance Bands 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'FlexBand', false, true, 'active'),

('Ballon de Gym 65cm', 'ballon-gym-65cm', 'Swiss ball anti-éclatement', '65cm, PVC épais, pompe incluse, 300kg max', 32000, 42000, 'SPORT-010', 105, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1567598508481-65985588e295?w=800","alt":"Exercise Ball","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800","alt":"Exercise Ball 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'CoreFit', false, false, 'active'),

('Gants de Boxe 12oz', 'gants-boxe-12oz', 'Gants de boxe cuir synthétique', '12oz, rembourrage mousse, velcro, ventilation', 62000, 82000, 'SPORT-011', 78, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1599058917440-d9535a98eb4c?w=800","alt":"Boxing Gloves","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1605894337933-76483d24dd45?w=800","alt":"Boxing Gloves 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'FightPro', false, false, 'active'),

('Rouleau de Massage Foam', 'rouleau-massage-foam', 'Rouleau de massage pour récupération', '33cm, texture 3D, EVA haute densité', 42000, 55000, 'SPORT-012', 112, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1598289431308-2e1e5e6dc86b?w=800","alt":"Foam Roller","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1543947639-4ba7d4d9c06b?w=800","alt":"Foam Roller 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'RecoverFit', false, true, 'active'),

('Montre Cardio GPS', 'montre-cardio-gps', 'Montre sport avec GPS et capteur FC', 'GPS multi-sport, Cardio poignet, 7 jours autonomie', 185000, 240000, 'SPORT-013', 52, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800","alt":"Sport Watch","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800","alt":"Sport Watch 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'SportTech', true, true, 'active'),

('Chaussures Running Pro', 'chaussures-running-pro', 'Chaussures de course haute performance', 'Mousse réactive, mesh respirant, amorti max', 125000, 165000, 'SPORT-014', 88, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800","alt":"Running Shoes","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800","alt":"Running Shoes 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'RunElite', true, false, 'active'),

('Sac de Sport Imperméable', 'sac-sport-impermeable', 'Sac de gym avec compartiment chaussures', '45L, imperméable, compartiment séparé, sangles', 58000, 78000, 'SPORT-015', 98, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800","alt":"Gym Bag","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800","alt":"Gym Bag 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'sport'), 'GymGear', false, true, 'active');

-- Beauté & Santé (10 produits)
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, sku, stock, images, category_id, brand, is_featured, is_new_arrival, status) VALUES
('Sérum Vitamine C Bio', 'serum-vitamine-c', 'Sérum anti-âge éclaircissant', 'Vitamine C 20%, acide hyaluronique, naturel', 45000, 58000, 'BEAUTY-001', 145, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800","alt":"Vitamin C Serum","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800","alt":"Vitamin C Serum 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'GlowSkin', true, true, 'active'),

('Crème Hydratante Visage', 'creme-hydratante-visage', 'Crème hydratante acide hyaluronique', 'Hydratation 24h, tous types de peau, non-comédogène', 38000, 52000, 'BEAUTY-002', 185, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800","alt":"Face Cream","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800","alt":"Face Cream 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'HydraLux', false, false, 'active'),

('Masque Purifiant Charbon', 'masque-charbon', 'Masque détoxifiant au charbon actif', 'Charbon bambou, points noirs, pores', 28000, 38000, 'BEAUTY-003', 165, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800","alt":"Charcoal Mask","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800","alt":"Charcoal Mask 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'PureSkin', false, true, 'active'),

('Huile Essentielle Lavande', 'huile-lavande', 'Huile essentielle pure 100% naturelle', '30ml, bio, relaxation, aromathérapie', 22000, 32000, 'BEAUTY-004', 195, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800","alt":"Lavender Oil","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1582546019006-2b12e3f23445?w=800","alt":"Lavender Oil 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'EssenceNature', false, false, 'active'),

('Brosse Nettoyante Visage', 'brosse-nettoyante-visage', 'Brosse électrique silicone pour le visage', 'Silicone médical, vibrations soniques, étanche', 68000, 88000, 'BEAUTY-005', 95, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800","alt":"Face Brush","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1610801912267-ac4d9e4b1646?w=800","alt":"Face Brush 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'CleanTech', true, true, 'active'),

('Palette Maquillage Nude', 'palette-maquillage-nude', 'Palette fards à paupières neutres', '12 teintes, pigments haute qualité, longue tenue', 52000, 68000, 'BEAUTY-006', 125, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800","alt":"Makeup Palette","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1583241800698-b3b5abc2c42d?w=800","alt":"Makeup Palette 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'BeautyColor', false, true, 'active'),

('Rouge à Lèvres Mat', 'rouge-levres-mat', 'Rouge à lèvres longue tenue mat', 'Formule crémeuse, vitamine E, hydratant', 28000, 38000, 'BEAUTY-007', 215, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800","alt":"Lipstick","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1592182799969-b0e4f30a5d82?w=800","alt":"Lipstick 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'LipLux', false, false, 'active'),

('Kit Manucure Professionnel', 'kit-manucure-pro', 'Set complet pour manucure et pédicure', '15 accessoires, étui cuir, inox chirurgical', 42000, 55000, 'BEAUTY-008', 105, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1610992015762-45dca7aca4d0?w=800","alt":"Manicure Set","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800","alt":"Manicure Set 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'NailPro', false, false, 'active'),

('Diffuseur Huiles Essentielles', 'diffuseur-huiles', 'Diffuseur d''arômes ultrasonique', '400ml, LED coloré, minuterie, silencieux', 48000, 62000, 'BEAUTY-009', 88, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800","alt":"Diffuser","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800","alt":"Diffuser 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'AromaZen', true, false, 'active'),

('Balance Connectée', 'balance-connectee', 'Pèse-personne intelligent avec app', 'Composition corporelle, 13 données, Bluetooth', 68000, 88000, 'BEAUTY-010', 78, 
 '[{"id":"1","url":"https://images.unsplash.com/photo-1589942864166-b0e9b0f16cc4?w=800","alt":"Smart Scale","isPrimary":true,"order":1},{"id":"2","url":"https://images.unsplash.com/photo-1594041737226-f0c7d8e74f1b?w=800","alt":"Smart Scale 2","isPrimary":false,"order":2}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'beauty'), 'HealthTrack', true, true, 'active');

-- Migration completed successfully!

