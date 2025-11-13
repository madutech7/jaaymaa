-- Script pour créer le premier administrateur
-- Ce script désactive temporairement le trigger pour permettre la création d'un admin

-- Option 1: Désactiver temporairement le trigger et promouvoir un utilisateur existant
-- Remplacez 'votre-email@example.com' par l'email de l'utilisateur à promouvoir

-- Désactiver le trigger
ALTER TABLE users DISABLE TRIGGER trg_prevent_role_change;

-- Promouvoir un utilisateur en admin par email
UPDATE users 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';

-- Réactiver le trigger
ALTER TABLE users ENABLE TRIGGER trg_prevent_role_change;

-- Vérification
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
WHERE role = 'admin';

-- Option 2: Créer directement un utilisateur admin (si l'utilisateur n'existe pas encore)
-- Désactiver le trigger
-- ALTER TABLE users DISABLE TRIGGER trg_prevent_role_change;

-- Insérer un utilisateur admin directement
-- INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'admin@example.com',
--   'Admin',
--   'User',
--   'admin',
--   NOW(),
--   NOW()
-- );

-- Réactiver le trigger
-- ALTER TABLE users ENABLE TRIGGER trg_prevent_role_change;

