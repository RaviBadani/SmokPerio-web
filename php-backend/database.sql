-- SmokPerio AI Database Schema & Initial Seed Data
-- Import this SQL file into phpMyAdmin or MySQL CLI (Database: smokperio_db)

CREATE DATABASE IF NOT EXISTS smokperio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smokperio_db;

-- 1. Practitioners (Users)
CREATE TABLE IF NOT EXISTS practitioners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) DEFAULT 'Periodontist Specialist',
    clinic_name VARCHAR(255) DEFAULT 'SmokPerio AI Clinical Hospital',
    phone VARCHAR(50) DEFAULT '+91 98765 43210',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_otp (email, otp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Patients
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    practitioner_id INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(50) NOT NULL,
    cigarettes_per_day INT NOT NULL DEFAULT 0,
    years_smoking INT NOT NULL DEFAULT 0,
    pack_years DOUBLE NOT NULL DEFAULT 0.0,
    smoking_status VARCHAR(50) NOT NULL DEFAULT 'Non-Smoker',
    cal_values TEXT, -- JSON array of CAL probing depths e.g. [3, 4, 5, 4]
    ppd_values TEXT, -- JSON array of PPD values e.g. [2, 3, 4, 3]
    radiographic_bone_loss DOUBLE DEFAULT 0.0,
    furcation_involvement TINYINT(1) DEFAULT 0,
    il6_level DOUBLE DEFAULT NULL,
    tnf_alpha DOUBLE DEFAULT NULL,
    radiograph_path VARCHAR(500) DEFAULT NULL,
    radiograph_analysis TEXT DEFAULT NULL, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Prediction History
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Practitioner Account (Password: password123)
INSERT INTO practitioners (id, name, email, password) 
VALUES (1, 'Dr. Aris Thorne', 'doctor@simats.edu', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1g.uJ1sV98RzQW7O2C.3mQW9g9ZtK/6')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Sample Patients
INSERT INTO patients (id, practitioner_id, name, age, gender, cigarettes_per_day, years_smoking, pack_years, smoking_status, cal_values, ppd_values, radiographic_bone_loss, furcation_involvement, il6_level, tnf_alpha, created_at)
VALUES 
(1, 1, 'John Doe', 48, 'Male', 20, 20, 20.0, 'Heavy Smoker', '[4,5,6,5,4]', '[3,4,5,4,3]', 35.5, 1, 12.4, 8.2, NOW()),
(2, 1, 'Sarah Smith', 35, 'Female', 5, 8, 2.0, 'Light Smoker', '[2,3,3,2]', '[2,2,3,2]', 12.0, 0, 4.1, 2.8, NOW()),
(3, 1, 'Michael Brown', 52, 'Male', 30, 25, 37.5, 'Heavy Smoker', '[6,7,8,7,6]', '[5,6,6,5]', 55.0, 1, 22.1, 15.6, NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Initial Predictions
INSERT INTO predictions (patient_id, result_json, created_at)
VALUES
(1, '{"risk_level":"HIGH","risk_score":78,"progression_6m":1.8,"progression_12m":3.2,"confidence":0.92,"site_risks":[0.7,0.85,0.9,0.75],"key_drivers":["Heavy Smoking (20 pack-years)","Severe CAL (mean 4.8mm)","Elevated IL-6 (12.4 pg/mL)"],"class_probabilities":{"LOW":0.05,"MODERATE":0.15,"HIGH":0.80}}', NOW()),
(2, '{"risk_level":"LOW","risk_score":24,"progression_6m":0.4,"progression_12m":0.8,"confidence":0.95,"site_risks":[0.2,0.25,0.3,0.2],"key_drivers":["Light Smoking history","Minimal Bone Loss"],"class_probabilities":{"LOW":0.85,"MODERATE":0.12,"HIGH":0.03}}', NOW()),
(3, '{"risk_level":"HIGH","risk_score":92,"progression_6m":2.6,"progression_12m":4.9,"confidence":0.94,"site_risks":[0.9,0.95,0.98,0.92],"key_drivers":["Extreme Pack-years (37.5)","Advanced Radiographic Bone Loss (55%)","Furcation Involvement Grade II"],"class_probabilities":{"LOW":0.01,"MODERATE":0.05,"HIGH":0.94}}', NOW());

-- 6. Role column on practitioners (admin / user)
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS role ENUM('user','admin') DEFAULT 'user';

-- 7. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    practitioner_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    notes TEXT DEFAULT '',
    status ENUM('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (practitioner_id) REFERENCES practitioners(id) ON DELETE CASCADE,
    INDEX idx_practitioner_date (practitioner_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Appointments
INSERT INTO appointments (practitioner_id, patient_name, date, time, notes, status) VALUES
(1, 'John Doe',      '2026-08-15', '09:30', 'Follow-up after HIGH risk prediction', 'Scheduled'),
(1, 'Sarah Smith',   '2026-08-16', '11:00', 'Routine check — 6-month follow-up',    'Scheduled'),
(1, 'Michael Brown', '2026-08-10', '14:00', 'Review treatment plan',                'Completed')
ON DUPLICATE KEY UPDATE patient_name=VALUES(patient_name);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type ENUM('info','alert','success','warning') DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES practitioners(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Notifications
INSERT INTO notifications (user_id, title, body, type, is_read) VALUES
(1, 'AI Prediction Complete',  'John Doe''s risk assessment returned HIGH. Review recommended.', 'alert',   0),
(1, 'New Patient Added',       'Patient Sarah Smith has been added to your list.',               'info',    0),
(1, 'Appointment Reminder',    'Consultation with Michael Brown is scheduled for Aug 10.',       'info',    1),
(1, 'Report Generated',        'PDF report for Ananya Patel is ready to download.',              'success', 1),
(1, 'Data Sync Complete',      'All patient records synced with the server successfully.',       'success', 1);

-- 9. Doctor Notes
CREATE TABLE IF NOT EXISTS doctor_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    practitioner_id INT NOT NULL,
    note_text TEXT NOT NULL,
    note_type ENUM('clinical','follow-up','prescription','observation') DEFAULT 'clinical',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (practitioner_id) REFERENCES practitioners(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Doctor Notes
INSERT INTO doctor_notes (patient_id, practitioner_id, note_text, note_type) VALUES
(1, 1, 'Patient shows severe bone loss. Immediate referral to periodontist recommended.', 'clinical'),
(2, 1, 'Light smoker, monitored over 6 months. Low risk confirmed.', 'follow-up'),
(3, 1, 'Grade II furcation involvement. Scaling and root planing planned.', 'prescription');
