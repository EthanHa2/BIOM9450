DROP DATABASE IF EXISTS patient_management;
CREATE DATABASE patient_management;
USE patient_management;
SET sql_mode = 'STRICT_ALL_TABLES';
-- 1) TABLES
CREATE TABLE clinician (
    clinician_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
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
    dob DATE NOT NULL,
    sex ENUM('Male', 'Female', 'Other') NOT NULL,
    phone VARCHAR(20) NOT NULL,
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
        email,
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
    ),
    ('Claire', 'Zhou', 'claire.zhou@clinic.com', SHA2('Doctor123', 256), 'Neurologist', '0423000111', 'clinician'),
('David', 'Nguyen', 'david.nguyen@clinic.com', SHA2('Path0logy!', 256), 'Pathologist', '0423000222', 'clinician');
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
    ),
    ('Lucas', 'Kim', '1978-11-04', 'Male',   '0423333444', '22 Queen St, Canberra', NULL),
('Emma',  'Brown', '2000-06-17', 'Female','0455555666', '5 Ocean Ave, Melbourne', NULL),
('Noah',  'Patel', '1995-12-01', 'Male',   '0401234123', '34 George St, Sydney', NULL),
('Sophie','Tan',  '2010-09-23', 'Female','0466666777', '78 River Rd, Brisbane', NULL);

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
    ),
    (   3, 
        3, 
        'Neurological Disorder',
        'Drug-resistant epilepsy, possible SCN1A mutation.',
        'Anti-epileptic medication; EEG monitoring.',
        '2023-12-10'
    ),
    (   
        4, 
        3, 
        'Neurocutaneous Disorder',
        'Multiple café-au-lait spots; NF1 deletion confirmed.',
        'Annual MRI and ophthalmology review.',
        '2024-03-01'
    ),
    (   
        5, 
        2, 
        'Cancer',
        'Colorectal carcinoma, microsatellite instability high (MSI-H).',
        'Surgical resection; adjuvant chemotherapy.',
        '2024-04-09'
    ),
    (   
        6, 
        1,
        'Genetic Disorder',
        'Autism spectrum disorder; CMA pending for CNV analysis.',
        'Behavioural therapy; speech therapy referral.',
        '2024-05-10'
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
    ), 
    (3, 3, 'Frequent seizures; developmental regression', '2023-12-12'),
(4, 3, 'Multiple skin neurofibromas; optic pathway glioma', '2024-03-03'),
(5, 2, 'Abdominal pain; rectal bleeding; weight loss', '2024-04-11'),
(6, 1, 'Delayed speech; repetitive behaviours; poor eye contact', '2024-05-11');

INSERT INTO category (patient_id, category_type)
VALUES (1, 'phenotype'),
        (2, 'diagnostic'),
        (3, 'mutation');
INSERT INTO user_activity (clinician_id, activity_type, ip_address)
VALUES (1, 'login', '192.168.1.2'),
    (2, 'login', '192.168.1.3'),
(2, 'edit',   '192.168.1.11'),
(3, 'login',  '192.168.1.12'),
(4, 'report', '192.168.1.13');;

INSERT INTO reports (patient_id, report_type, content)
VALUES (
        2,
        'individual',
        'PDF: BRCA screening report stored externally (placeholder).'
    ),
    (NULL, 'general', 'Population overview report.'), 
    (1, 'individual', 'Genomic report: candidate variants identified; follow-up recommended.'),
(3, 'individual', 'Epilepsy gene panel: SCN1A variant of uncertain significance.'),
(4, 'individual', 'NF1 deletion confirmed; schedule yearly MRI and ophthalmology review.'),
(5, 'individual', 'MSI-H colorectal tumour; consider immunotherapy options.'),
(NULL, 'general', 'Monthly overview: increase in neurological and cancer cases over last quarter.');

-- 3) import CSV (run if file exists and LOCAL is allowed)
LOAD DATA LOCAL INFILE '...\\Mutation_original.csv' INTO TABLE mutation FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
INSERT INTO patient_mutation (patient_id, mutation_id)
VALUES (1, 1),
    (1, 2),
    (1, 3),
    (2, 2);
-- mysql -u root -p
-- mysql --local-infile=1 -u root -p patient_management < database.sql
