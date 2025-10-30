DROP DATABASE IF EXISTS patient_management;
CREATE DATABASE patient_management;
USE patient_management;

SET sql_mode = 'STRICT_ALL_TABLES';

-- 1) TABLES

CREATE TABLE clinician (
  clinician_id   INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  specialty      VARCHAR(100),
  contact_info   VARCHAR(100),
  role           ENUM('admin','clinician') DEFAULT 'clinician'
) ENGINE=InnoDB;

CREATE TABLE patient (
  patient_id         INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  date_of_birth      DATE,
  sex                ENUM('Male','Female','Other') DEFAULT NULL,
  phone              VARCHAR(20),
  address            TEXT,
  diagnostic_summary TEXT,
  created_by         INT,
  CONSTRAINT fk_patient_created_by
    FOREIGN KEY (created_by) REFERENCES clinician(clinician_id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE diagnostics (
  diagnosis_id     INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  diagnosis_type   VARCHAR(100) NOT NULL,
  diagnosis_details TEXT,
  diagnosis_date   DATE,
  INDEX idx_diag_patient (patient_id, diagnosis_date),
  CONSTRAINT fk_diag_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE phenotypes (
  phenotype_id   INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  description    TEXT NOT NULL,
  recorded_date  DATE NOT NULL DEFAULT (CURRENT_DATE),
  INDEX idx_pheno_patient (patient_id, recorded_date),
  FULLTEXT INDEX ftx_pheno_description (description),
  CONSTRAINT fk_pheno_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS mutation_variants;

CREATE TABLE mutation_variants (
  mutation_id        INT AUTO_INCREMENT PRIMARY KEY,
  icgc_specimen_id   VARCHAR(50),
  chromosome         VARCHAR(10),
  chromosome_start   INT,
  chromosome_end     INT,
  mutation_type      VARCHAR(100),
  mutated_from_allele VARCHAR(10),
  mutated_to_allele   VARCHAR(10),
  consequence_type    VARCHAR(100),
  gene_affected       VARCHAR(50),
  cancer_type         VARCHAR(100)
) ENGINE=InnoDB;


CREATE TABLE user_activity (
  activity_id    INT AUTO_INCREMENT PRIMARY KEY,
  clinician_id   INT NOT NULL,
  activity_type  ENUM('login','logout','view','edit','report') NOT NULL,
  activity_time  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address     VARCHAR(50),
  INDEX idx_act_user_time (clinician_id, activity_time),
  CONSTRAINT fk_activity_user
    FOREIGN KEY (clinician_id) REFERENCES clinician(clinician_id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reports (
  report_id     INT AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT NULL,
  report_type   ENUM('individual','general') NOT NULL,
  content       MEDIUMTEXT NOT NULL,
  created_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reports_patient (patient_id, created_date),
  CONSTRAINT fk_reports_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE category (
  category_id    INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  category_type  ENUM('diagnostic','phenotype','mutation') NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category_patient (patient_id, category_type),
  CONSTRAINT fk_category_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2) SEED DATA (randomly generated)

INSERT INTO clinician (name, username, password_hash, specialty, contact_info, role) VALUES
('Dr Alice Smith','asmith', SHA2('Passw0rd!',256), 'Geneticist', 'alice.smith@clinic.com', 'admin'),
('Dr Ben Lee','blee', SHA2('Clinician1',256), 'Oncologist', 'ben.lee@clinic.com', 'clinician');

INSERT INTO patient (name, date_of_birth, sex, phone, address, diagnostic_summary, created_by) VALUES
('John Doe','1990-05-21','Male','0412345678','12 Park St, Sydney','Suspected genetic disorder; referred for WES.', 1),
('Mary Jones','1985-02-09','Female','0411111222','8 King Rd, Wollongong','Breast cancer history; BRCA screening.', 2);

INSERT INTO diagnostics (patient_id, diagnosis_type, diagnosis_details, diagnosis_date) VALUES
(1,'Genetic Disorder','Neurodevelopmental delay; pending exome results.','2024-07-15'),
(2,'Cancer','Invasive ductal carcinoma; ER/PR+.','2024-08-20');

INSERT INTO phenotypes (patient_id, description, recorded_date) VALUES
(1,'Microcephaly; intellectual disability','2024-07-16'),
(2,'Breast mass; axillary lymphadenopathy','2024-08-22');

INSERT INTO category (patient_id, category_type) VALUES
(1,'phenotype'), (2,'diagnostic');

INSERT INTO user_activity (clinician_id, activity_type, ip_address) VALUES
(1,'login','192.168.1.2'), (2,'login','192.168.1.3');

INSERT INTO reports (patient_id, report_type, content) VALUES
(2,'individual','PDF: BRCA screening report stored externally (placeholder).'),
(NULL,'general','Population overview report.');

-- 3) import CSV (run if file exists and LOCAL is allowed)

LOAD DATA LOCAL INFILE '/Users/sarina/Downloads/BIOM9450/BIOM9450/Mutation_original.csv'
INTO TABLE mutation_variants
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(patient_id, gene, mutation_type, impact, cancer_type);

-- 4) VIEWS

CREATE OR REPLACE VIEW v_patient_overview AS
SELECT
  p.patient_id,
  p.name AS patient_name,
  p.sex,
  TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
  p.diagnostic_summary,
  MAX(d.diagnosis_date) AS last_diagnosis_date,
  GROUP_CONCAT(DISTINCT m.gene ORDER BY m.gene SEPARATOR ', ') AS genes
FROM patient p
LEFT JOIN diagnostics d ON d.patient_id = p.patient_id
LEFT JOIN mutation_variants m ON m.patient_id = p.patient_id
GROUP BY p.patient_id;

CREATE OR REPLACE VIEW v_counts_for_charts AS
SELECT
  'diagnostics' AS metric, diagnosis_type AS label, COUNT(*) AS count
FROM diagnostics GROUP BY diagnosis_type
UNION ALL
SELECT 'phenotypes', 'records', COUNT(*) FROM phenotypes
UNION ALL
SELECT 'mutations', gene, COUNT(*) FROM mutation_variants GROUP BY gene;

-- mysql -u root -p
-- mysql --local-infile=1 -u root -p patient_management < database.sql
