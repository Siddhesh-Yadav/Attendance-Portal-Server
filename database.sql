-- Employee Attendance Portal — Database SQL Fallback
-- Run this script for a fresh database setup if migrations are not available.
-- PostgreSQL required.

-- Usage:
--   createdb attendance_portal
--   psql -d attendance_portal -f database.sql

BEGIN;

-- ─── Drop existing tables (in reverse dependency order) ──────────
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ─── Create Tables ───────────────────────────────────────────────

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  "roleId" INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "permissionId" INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("roleId", "permissionId")
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  "fullName" VARCHAR(255) NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "roleId" INT NOT NULL REFERENCES roles(id),
  "managerId" INT REFERENCES users(id) ON DELETE SET NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users("roleId");
CREATE INDEX idx_users_manager ON users("managerId");
CREATE INDEX idx_users_active ON users("isActive");

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenHash" VARCHAR(255) NOT NULL,
  "lastActivityAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP NOT NULL,
  "revokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions("userId");
CREATE INDEX idx_sessions_expiry ON sessions("expiresAt");
CREATE INDEX idx_sessions_token ON sessions("tokenHash");

CREATE TABLE leave_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  "annualQuota" INT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "checkInTime" TIMESTAMP NOT NULL,
  "checkOutTime" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", date)
);

CREATE INDEX idx_attendance_user_date ON attendance_records("userId", date);
CREATE INDEX idx_attendance_date ON attendance_records(date);

CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "leaveTypeId" INT NOT NULL REFERENCES leave_types(id),
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "approvedBy" INT REFERENCES users(id) ON DELETE SET NULL,
  "rejectionRemark" TEXT,
  "approvalRemark" TEXT,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_dates CHECK ("endDate" >= "startDate")
);

CREATE INDEX idx_leave_user ON leave_requests("userId");
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests("startDate", "endDate");

-- ─── Seed Data ──────────────────────────────────────────────────

-- Roles
INSERT INTO roles (code, name, description) VALUES
  ('EMPLOYEE', 'Employee', 'Regular staff member'),
  ('MANAGER', 'Manager', 'Team lead or senior staff'),
  ('HR', 'HR Administrator', 'HR admin with full access');

-- Permissions
INSERT INTO permissions (code, description, category) VALUES
  ('attendance:checkin', 'Can check in', 'attendance'),
  ('attendance:checkout', 'Can check out', 'attendance'),
  ('attendance:view_own', 'Can view own attendance', 'attendance'),
  ('attendance:view_team', 'Can view team attendance', 'attendance'),
  ('attendance:view_all', 'Can view all attendance', 'attendance'),
  ('leave:apply', 'Can apply for leave', 'leave'),
  ('leave:view_own', 'Can view own leave requests', 'leave'),
  ('leave:approve', 'Can approve/reject leave', 'leave'),
  ('leave:view_all', 'Can view all leave requests', 'leave'),
  ('user:create', 'Can create users', 'user'),
  ('user:deactivate', 'Can deactivate users', 'user'),
  ('user:assign_role', 'Can assign roles', 'user'),
  ('user:assign_manager', 'Can assign managers', 'user'),
  ('leave_type:configure', 'Can configure leave types', 'leave_type');

-- Role-Permission Mappings
-- EMPLOYEE (roleId=1): checkin, checkout, view_own, apply, view_own_leave
INSERT INTO role_permissions ("roleId", "permissionId") VALUES
  (1, 1), (1, 2), (1, 3), (1, 6), (1, 7);

-- MANAGER (roleId=2): employee perms + view_team, approve
INSERT INTO role_permissions ("roleId", "permissionId") VALUES
  (2, 1), (2, 2), (2, 3), (2, 4), (2, 6), (2, 7), (2, 8);

-- HR (roleId=3): view_own, view_team, view_all, view_own_leave, view_all_leave, user mgmt, leave_type config
INSERT INTO role_permissions ("roleId", "permissionId") VALUES
  (3, 3), (3, 4), (3, 5), (3, 7), (3, 9), (3, 10), (3, 11), (3, 12), (3, 13), (3, 14);

-- Users (password: password123, bcrypt hash)
-- NOTE: Generate the hash with: node -e "require('bcryptjs').hash('password123', 10).then(console.log)"
INSERT INTO users (email, "fullName", "passwordHash", "roleId", "managerId", "isActive") VALUES
  ('hr@company.com', 'HR Admin', '$2a$10$placeholder_replace_with_real_hash', 3, NULL, true),
  ('manager@company.com', 'John Manager', '$2a$10$placeholder_replace_with_real_hash', 2, NULL, true),
  ('emp1@company.com', 'Alice Employee', '$2a$10$placeholder_replace_with_real_hash', 1, 2, true),
  ('emp2@company.com', 'Bob Employee', '$2a$10$placeholder_replace_with_real_hash', 1, 2, true),
  ('emp3@company.com', 'Charlie Employee', '$2a$10$placeholder_replace_with_real_hash', 1, 2, true);

-- Leave Types
INSERT INTO leave_types (name, "annualQuota", description) VALUES
  ('Casual Leave', 12, 'Casual leave for personal reasons'),
  ('Sick Leave', 10, 'Sick leave for health reasons'),
  ('Earned Leave', 20, 'Annual earned leave');

COMMIT;
