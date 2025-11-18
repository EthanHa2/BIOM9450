DROP DATABASE IF EXISTS patient_management;
CREATE DATABASE patient_management;
USE patient_management;
SET sql_mode = 'STRICT_ALL_TABLES';
-- 1) TABLES
CREATE TABLE clinician (
    clinician_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('admin', 'clinician') DEFAULT 'clinician'
) ENGINE = InnoDB;
CREATE TABLE patient (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE,
    sex ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    phone VARCHAR(20),
    address TEXT,
    photo TEXT
) ENGINE = InnoDB;
CREATE TABLE diagnostic (
    diagnosis_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    clinician_id INT NOT NULL,
    diagnosis_type TEXT NOT NULL,
    description TEXT NOT NULL,
    treatment TEXT,
    diagnosis_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_diag_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_diag_clinician FOREIGN KEY (clinician_id) REFERENCES clinician(clinician_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;
CREATE TABLE phenotype (
    phenotype_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    clinician_id INT NOT NULL,
    description TEXT NOT NULL,
    recorded_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_pheno_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pheno_clinician FOREIGN KEY (clinician_id) REFERENCES clinician(clinician_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;
DROP TABLE IF EXISTS mutation;
CREATE TABLE mutation (
    mutation_id INT AUTO_INCREMENT PRIMARY KEY,
    icgc_specimen_id VARCHAR(50),
    chromosome VARCHAR(10),
    chromosome_start INT,
    chromosome_end INT,
    mutation_type VARCHAR(100),
    mutated_from_allele VARCHAR(10),
    mutated_to_allele VARCHAR(10),
    consequence_type VARCHAR(100),
    gene_affected VARCHAR(50),
    cancer_type VARCHAR(100)
) ENGINE = InnoDB;
DROP TABLE IF EXISTS patient_mutation;
CREATE TABLE patient_mutation (
    patient_id INT NOT NULL,
    mutation_id INT NOT NULL,
    recorded_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (patient_id, mutation_id),
    CONSTRAINT fk_pm_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_mutation FOREIGN KEY (mutation_id) REFERENCES mutation(mutation_id) ON DELETE RESTRICT
) ENGINE = InnoDB;
CREATE TABLE user_activity (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    clinician_id INT NOT NULL,
    activity_type ENUM('login', 'logout', 'view', 'edit', 'report') NOT NULL,
    activity_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    INDEX idx_act_user_time (clinician_id, activity_time),
    CONSTRAINT fk_activity_user FOREIGN KEY (clinician_id) REFERENCES clinician(clinician_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NULL,
    report_type ENUM('individual', 'general') NOT NULL,
    content MEDIUMTEXT NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reports_patient (patient_id, created_date),
    CONSTRAINT fk_reports_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON UPDATE CASCADE ON DELETE
    SET NULL
) ENGINE = InnoDB;
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    category_type ENUM('diagnostic', 'phenotype', 'mutation') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_patient (patient_id, category_type),
    CONSTRAINT fk_category_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;
-- 2) SEED DATA (randomly generated)
INSERT INTO clinician (
        first_name,
        last_name,
        username,
        password_hash,
        specialty,
        phone,
        role
    )
VALUES (
        'Alice',
        'Smith',
        'alice.smith@clinic.com',
        SHA2('Passw0rd!', 256),
        'Geneticist',
        0412345678,
        'admin'
    ),
    (
        'Ben',
        'Lee',
        'ben.lee@clinic.com',
        SHA2('Clinician1', 256),
        'Oncologist',
        0412345679,
        'clinician'
    );
INSERT INTO patient (
        first_name,
        last_name,
        dob,
        sex,
        phone,
        address
    )
VALUES (
        'John',
        'Doe',
        '1990-05-21',
        'Male',
        '0412345678',
        '12 Park St, Sydney'
    ),
    (
        'Mary',
        'Jones',
        '1985-02-09',
        'Female',
        '0411111222',
        '8 King Rd, Wollongong'
    );
INSERT INTO diagnostic (
        patient_id,
        clinician_id,
        diagnosis_type,
        description,
        diagnosis_date,
        treatment
    )
VALUES (
        1,
        1,
        'Genetic Disorder',
        'Neurodevelopmental delay; pending exome results.',
        '2024-07-15',
        'N/A'
    ),
    (
        2,
        1,
        'Cancer',
        'Invasive ductal carcinoma; ER/PR+.',
        '2024-08-20',
        'Chemo'
    );

INSERT INTO phenotype (
        patient_id,
        clinician_id,
        description,
        recorded_date
    )
VALUES (
        1,
        1,
        'Microcephaly; intellectual disability',
        '2024-07-16'
    ),
    (
        2,
        1,
        'Breast mass; axillary lymphadenopathy',
        '2024-08-22'
    );
INSERT INTO category (patient_id, category_type)
VALUES (1, 'phenotype'),
    (2, 'diagnostic');
INSERT INTO user_activity (clinician_id, activity_type, ip_address)
VALUES (1, 'login', '192.168.1.2'),
    (2, 'login', '192.168.1.3');
INSERT INTO reports (patient_id, report_type, content)
VALUES (
        2,
        'individual',
        'PDF: BRCA screening report stored externally (placeholder).'
    ),
    (NULL, 'general', 'Population overview report.');
-- 3) import CSV (run if file exists and LOCAL is allowed)
LOAD DATA LOCAL INFILE '...\\Mutation_original.csv' INTO TABLE mutation FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
INSERT INTO patient_mutation (patient_id, mutation_id)
VALUES (1, 1),
    (1, 2),
    (1, 3),
    (2, 2);
-- mysql -u root -p
-- mysql --local-infile=1 -u root -p patient_management < database.sql