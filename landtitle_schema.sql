-- =========================================================
-- Schema for the ERD (MySQL 8+)
-- =========================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create a database
CREATE DATABASE IF NOT EXISTS landtitle
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE landtitle;

-- ---------- Lookups / reference tables ----------
DROP TABLE IF EXISTS Abstract;
CREATE TABLE Abstract (
  abstractID      INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS BookType;
CREATE TABLE BookType (
  bookTypeID      INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS Subdivision;
CREATE TABLE Subdivision (
  subdivisionID   INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS County;
CREATE TABLE County (
  countyID        INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Core security / auth ----------
DROP TABLE IF EXISTS Admin;
CREATE TABLE Admin (
  adminID         INT PRIMARY KEY AUTO_INCREMENT,
  username        VARCHAR(255) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  permissions     TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  userID          INT PRIMARY KEY AUTO_INCREMENT,
  username        VARCHAR(255) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  role            VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS Role;
CREATE TABLE Role (
  roleID          INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(255) NOT NULL,
  permissions     TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS Permission;
CREATE TABLE Permission (
  permissionID    INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(255) NOT NULL,
  description     TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin assigns roles to users
DROP TABLE IF EXISTS AdminAssignedRole;
CREATE TABLE AdminAssignedRole (
  adminID         INT NOT NULL,
  userID          INT NOT NULL,
  roleID          INT NOT NULL,
  assigned_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (adminID, userID, roleID),
  CONSTRAINT fk_ar_admin   FOREIGN KEY (adminID) REFERENCES Admin(adminID) ON DELETE CASCADE,
  CONSTRAINT fk_ar_user    FOREIGN KEY (userID)  REFERENCES `User`(userID) ON DELETE CASCADE,
  CONSTRAINT fk_ar_role    FOREIGN KEY (roleID)  REFERENCES Role(roleID)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Many-to-many: Users ↔ Roles
DROP TABLE IF EXISTS UserRole;
CREATE TABLE UserRole (
  userID          INT NOT NULL,
  roleID          INT NOT NULL,
  PRIMARY KEY (userID, roleID),
  CONSTRAINT fk_ur_user FOREIGN KEY (userID) REFERENCES `User`(userID) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (roleID) REFERENCES Role(roleID)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Many-to-many: Roles ↔ Permissions
DROP TABLE IF EXISTS RolePermission;
CREATE TABLE RolePermission (
  roleID          INT NOT NULL,
  permissionID    INT NOT NULL,
  PRIMARY KEY (roleID, permissionID),
  CONSTRAINT fk_rp_role       FOREIGN KEY (roleID)       REFERENCES Role(roleID)            ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permissionID) REFERENCES Permission(permissionID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Document ----------
DROP TABLE IF EXISTS Document;
CREATE TABLE Document (
  documentID          INT PRIMARY KEY AUTO_INCREMENT,

  -- Relationships to lookups
  abstractID          INT NULL,
  bookTypeID          INT NULL,
  subdivisionID       INT NULL,
  countyID            INT NULL,

  instrumentNumber    VARCHAR(64),
  book                VARCHAR(50),
  volume              VARCHAR(50),
  page                VARCHAR(50),
  grantor             VARCHAR(255),
  grantee             VARCHAR(255),
  instrumentType      VARCHAR(100),
  remarks             TEXT,
  lienAmount          DECIMAL(15,2),
  legalDescription    TEXT,
  subBlock            VARCHAR(50),

  abstractText        TEXT,
  acres               DECIMAL(12,4),
  fileStampDate       DATE,
  filingDate          DATE,
  nFileReference      VARCHAR(255),
  finalizedBy         VARCHAR(255),
  exportFlag          TINYINT(1) DEFAULT 0,
  propertyType        VARCHAR(100),
  GFNNumber           INT,
  marketShare         VARCHAR(255),
  sortArray           TEXT,
  address             VARCHAR(255),
  CADNumber           VARCHAR(100),
  CADNumber2          VARCHAR(100),
  GLOLink             VARCHAR(255),
  fieldNotes          TEXT,

  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_doc_instr (instrumentNumber),
  INDEX idx_doc_dates (filingDate, fileStampDate),
  INDEX idx_doc_fk_abs (abstractID),
  INDEX idx_doc_fk_booktype (bookTypeID),
  INDEX idx_doc_fk_subdiv (subdivisionID),
  INDEX idx_doc_fk_county (countyID),

  CONSTRAINT fk_doc_abstract    FOREIGN KEY (abstractID)    REFERENCES Abstract(abstractID)       ON DELETE SET NULL,
  CONSTRAINT fk_doc_booktype    FOREIGN KEY (bookTypeID)    REFERENCES BookType(bookTypeID)       ON DELETE SET NULL,
  CONSTRAINT fk_doc_subdivision FOREIGN KEY (subdivisionID) REFERENCES Subdivision(subdivisionID) ON DELETE SET NULL,
  CONSTRAINT fk_doc_county      FOREIGN KEY (countyID)      REFERENCES County(countyID)            ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- AI_Extraction ----------
DROP TABLE IF EXISTS AI_Extraction;
CREATE TABLE AI_Extraction (
  extractionID      INT PRIMARY KEY AUTO_INCREMENT,
  documentID        INT NOT NULL,
  accuracy          FLOAT,
  `timestamp`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fieldsExtracted   JSON NULL,

  INDEX idx_ai_doc (documentID),
  CONSTRAINT fk_ai_doc FOREIGN KEY (documentID) REFERENCES Document(documentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Record ----------
DROP TABLE IF EXISTS Record;
CREATE TABLE Record (
  recordID          INT PRIMARY KEY AUTO_INCREMENT,
  documentID        INT NOT NULL,
  fieldName         VARCHAR(255) NOT NULL,
  oldValue          TEXT NULL,
  newValue          TEXT NULL,
  `timestamp`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifiedBy        VARCHAR(255) NULL,
  modifiedByUserID  INT NULL,

  INDEX idx_rec_doc (documentID, `timestamp`),
  INDEX idx_rec_user (modifiedByUserID),

  CONSTRAINT fk_rec_doc  FOREIGN KEY (documentID)       REFERENCES Document(documentID) ON DELETE CASCADE,
  CONSTRAINT fk_rec_user FOREIGN KEY (modifiedByUserID) REFERENCES `User`(userID)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
-- =========================================================
