-- ============================================
-- FIX: Infinite Recursion in Users RLS Policies
-- ADAPTÉ POUR NEON
-- ============================================
-- This migration fixes the infinite recursion error (42P17)
-- by replacing direct users table queries with the is_admin() function
-- Date: 2025-01-10
-- ============================================
-- NOTE: Neon utilise current_user_id() au lieu de auth.uid()
-- ============================================

-- Vérifier que la fonction current_user_id() existe
-- (Elle devrait être créée dans le schéma principal)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'current_user_id'
  ) THEN
    RAISE EXCEPTION 'La fonction current_user_id() doit être créée avant cette migration';
  END IF;
END $$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "users_select_all_admins" ON users;
DROP POLICY IF EXISTS "users_update_all_admins" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Recreate users_select_all_admins policy using is_admin() function
-- This avoids infinite recursion because is_admin() is SECURITY DEFINER
CREATE POLICY "users_select_all_admins" ON users FOR SELECT
TO authenticated USING (is_admin());

-- Recreate users_update_all_admins policy using is_admin() function
CREATE POLICY "users_update_all_admins" ON users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Recreate users_update_own policy without querying users table
-- Users can update their own record but cannot change their role
-- ADAPTÉ POUR NEON: utilise current_user_id() au lieu de auth.uid()
CREATE POLICY "users_update_own" ON users FOR UPDATE
TO authenticated
USING (current_user_id() = id)
WITH CHECK (current_user_id() = id);

-- ============================================
-- Vérifier que la fonction is_admin() est correctement configurée
-- ============================================
-- La fonction is_admin() doit utiliser current_user_id() et non auth.uid()
-- pour éviter la récursion infinie

DO $$
BEGIN
  -- Vérifier que is_admin() existe et utilise current_user_id()
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'La fonction is_admin() doit être créée avant cette migration';
  END IF;
END $$;

-- ============================================
-- Trigger to prevent users from changing their own role
-- ============================================

-- Function to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if the current user is an admin
    IF NOT is_admin() THEN
      -- Non-admins cannot change roles (even their own)
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trg_prevent_role_change ON users;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- ============================================
-- Migration complete
-- ============================================
-- ✅ Politiques RLS corrigées pour éviter la récursion
-- ✅ Trigger de protection des rôles créé
-- ✅ Adapté pour Neon (utilise current_user_id() au lieu de auth.uid())
-- ============================================


