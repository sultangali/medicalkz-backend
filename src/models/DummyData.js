const mongoose = require('mongoose');
const User = require('./User');
const Appointment = require('./Appointment');
const bcrypt = require('bcrypt');
const Medication = require('./Medication');
const Prescription = require('./Prescription');

// Function to seed doctor data
const seedDoctors = async () => {
  try {
    // First check if we already have doctors
    const existingDoctors = await User.countDocuments({ role: 'DOCTOR' });
    
    if (existingDoctors > 0) {
      console.log('Doctors already exist in database. Skipping seed.');
      return;
    }
    
    // Dummy doctor data
    const doctors = [
      {
        fullName: 'Dr. Aizhan Bekturova',
        email: 'aizhan.bekturova@medicalkz.com',
        password: await bcrypt.hash('password123', 10),
        role: 'DOCTOR',
        phoneNumber: '+7 (701) 234-5678',
        doctorProfile: {
          specialization: 'CARDIOLOGIST',
          medicalLicenseId: 'KZ-MED-2345',
          clinicAddress: 'Medical Center Almaty, Abay Ave 152',
          availability: {
            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            workingHours: {
              start: '09:00',
              end: '17:00'
            },
            isAvailableForHomeVisits: false
          }
        }
      },
      {
        fullName: 'Dr. Nurlan Satybaldiev',
        email: 'nurlan.satybaldiev@medicalkz.com',
        password: await bcrypt.hash('password123', 10),
        role: 'DOCTOR',
        phoneNumber: '+7 (702) 345-6789',
        doctorProfile: {
          specialization: 'PEDIATRICIAN',
          medicalLicenseId: 'KZ-MED-3456',
          clinicAddress: 'Children\'s Health Clinic, Tole Bi St 80',
          availability: {
            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
            workingHours: {
              start: '10:00',
              end: '18:00'
            },
            isAvailableForHomeVisits: true
          }
        }
      },
      {
        fullName: 'Dr. Saniya Omarova',
        email: 'saniya.omarova@medicalkz.com',
        password: await bcrypt.hash('password123', 10),
        role: 'DOCTOR',
        phoneNumber: '+7 (707) 456-7890',
        doctorProfile: {
          specialization: 'DERMATOLOGIST',
          medicalLicenseId: 'KZ-MED-4567',
          clinicAddress: 'SkinCare Clinic, Kunaev St 120',
          availability: {
            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            workingHours: {
              start: '09:00',
              end: '17:00'
            },
            isAvailableForHomeVisits: false
          }
        }
      },
      {
        fullName: 'Dr. Marat Kazbekov',
        email: 'marat.kazbekov@medicalkz.com',
        password: await bcrypt.hash('password123', 10),
        role: 'DOCTOR',
        phoneNumber: '+7 (705) 567-8901',
        doctorProfile: {
          specialization: 'NEUROLOGIST',
          medicalLicenseId: 'KZ-MED-5678',
          clinicAddress: 'Neuro Center, Nazarbayev Ave 220',
          availability: {
            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            workingHours: {
              start: '09:00',
              end: '15:00'
            },
            isAvailableForHomeVisits: false
          }
        }
      },
      {
        fullName: 'Dr. Aliya Suleimenova',
        email: 'aliya.suleimenova@medicalkz.com',
        password: await bcrypt.hash('password123', 10),
        role: 'DOCTOR',
        phoneNumber: '+7 (701) 678-9012',
        doctorProfile: {
          specialization: 'THERAPIST',
          medicalLicenseId: 'KZ-MED-6789',
          clinicAddress: 'Family Clinic, Zheltoksan St 55',
          availability: {
            workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
            workingHours: {
              start: '09:00',
              end: '18:00'
            },
            isAvailableForHomeVisits: true
          }
        }
      }
    ];

    // Insert doctors
    await User.insertMany(doctors);
    console.log('Doctors seeded successfully!');
  } catch (error) {
    console.error('Error seeding doctors:', error);
  }
};

// Function to seed patient data
const seedPatients = async () => {
  try {
    // First check if we already have patients
    const existingPatients = await User.countDocuments({ role: 'PATIENT' });
    
    if (existingPatients > 0) {
      console.log('Patients already exist in database. Skipping seed.');
      return;
    }
    
    // Dummy patient data
    const patients = [
      {
        fullName: 'John Smith',
        email: 'john.smith@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PATIENT',
        phoneNumber: '+7 (701) 111-2233',
        patientProfile: {
          dateOfBirth: new Date('1981-03-15'),
          gender: 'MALE',
          address: 'Almaty, Dostyk Ave 123',
          medicalData: {
            heightCm: 175,
            weightKg: 80,
            bloodType: 'A+',
            allergies: ['Penicillin'],
            chronicConditions: ['Hypertension'],
            lifestyleCharacteristics: {
              activityLevel: 'MODERATE',
              isSmoker: false,
              dietPreferences: ['Low sodium']
            }
          }
        }
      },
      {
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PATIENT',
        phoneNumber: '+7 (702) 222-3344',
        patientProfile: {
          dateOfBirth: new Date('1988-07-22'),
          gender: 'FEMALE',
          address: 'Almaty, Al-Farabi Ave 456',
          medicalData: {
            heightCm: 165,
            weightKg: 65,
            bloodType: 'B+',
            allergies: ['Shellfish'],
            chronicConditions: ['Diabetes Type 2'],
            lifestyleCharacteristics: {
              activityLevel: 'ACTIVE',
              isSmoker: false,
              dietPreferences: ['Diabetic diet']
            }
          }
        }
      },
      {
        fullName: 'Michael Brown',
        email: 'michael.brown@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PATIENT',
        phoneNumber: '+7 (703) 333-4455',
        patientProfile: {
          dateOfBirth: new Date('1995-11-08'),
          gender: 'MALE',
          address: 'Almaty, Satpayev St 789',
          medicalData: {
            heightCm: 180,
            weightKg: 75,
            bloodType: 'O+',
            allergies: ['Dust mites'],
            chronicConditions: ['Asthma'],
            lifestyleCharacteristics: {
              activityLevel: 'LIGHT',
              isSmoker: false,
              dietPreferences: ['Regular']
            }
          }
        }
      },
      {
        fullName: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PATIENT',
        phoneNumber: '+7 (704) 444-5566',
        patientProfile: {
          dateOfBirth: new Date('1991-05-14'),
          gender: 'FEMALE',
          address: 'Almaty, Nazarbayev Ave 321',
          medicalData: {
            heightCm: 170,
            weightKg: 60,
            bloodType: 'AB+',
            allergies: ['Pollen', 'Cat dander'],
            chronicConditions: ['Allergies'],
            lifestyleCharacteristics: {
              activityLevel: 'MODERATE',
              isSmoker: false,
              dietPreferences: ['Vegetarian']
            }
          }
        }
      },
      {
        fullName: 'David Lee',
        email: 'david.lee@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PATIENT',
        phoneNumber: '+7 (705) 555-6677',
        patientProfile: {
          dateOfBirth: new Date('1978-12-03'),
          gender: 'MALE',
          address: 'Almaty, Furmanov St 654',
          medicalData: {
            heightCm: 172,
            weightKg: 85,
            bloodType: 'O-',
            allergies: [],
            chronicConditions: ['Arthritis'],
            lifestyleCharacteristics: {
              activityLevel: 'SEDENTARY',
              isSmoker: true,
              dietPreferences: ['Regular']
            }
          }
        }
      }
    ];

    // Insert patients
    const insertedPatients = await User.insertMany(patients);
    console.log('Patients seeded successfully!');
    return insertedPatients;
  } catch (error) {
    console.error('Error seeding patients:', error);
    return [];
  }
};

// Function to seed pharmacist data
const seedPharmacists = async () => {
  try {
    // First check if we already have pharmacists
    const existingPharmacists = await User.countDocuments({ role: 'PHARMACIST' });
    
    if (existingPharmacists > 0) {
      console.log('Pharmacists already exist in database. Skipping seed.');
      return;
    }
    
    // Dummy pharmacist data
    const pharmacists = [
      {
        fullName: 'Pharmacist Aida Nazarbayeva',
        email: 'pharm1@mi.mi',
        password: await bcrypt.hash('password123', 10),
        role: 'PHARMACIST',
        phoneNumber: '+7 (701) 789-0123',
        pharmacistProfile: {
          pharmacyLicenseId: 'KZ-PHARM-1234',
          pharmacyName: 'Central Pharmacy',
          pharmacyAddress: 'Almaty, Republic Square 15'
        }
      },
      {
        fullName: 'Pharmacist Murat Omarov',
        email: 'pharm2@mi.mi',
        password: await bcrypt.hash('password123', 10),
        role: 'PHARMACIST',
        phoneNumber: '+7 (702) 890-1234',
        pharmacistProfile: {
          pharmacyLicenseId: 'KZ-PHARM-5678',
          pharmacyName: 'Health Plus Pharmacy',
          pharmacyAddress: 'Almaty, Abay Ave 200'
        }
      }
    ];

    // Insert pharmacists
    await User.insertMany(pharmacists);
    console.log('Pharmacists seeded successfully!');
  } catch (error) {
    console.error('Error seeding pharmacists:', error);
  }
};

// Function to seed appointments
const seedAppointments = async () => {
  try {
    // Check if appointments already exist
    const existingAppointments = await Appointment.countDocuments();
    
    if (existingAppointments > 0) {
      console.log('Appointments already exist in database. Skipping seed.');
      return;
    }

    // Get doctors and patients
    const doctors = await User.find({ role: 'DOCTOR' }).limit(3);
    const patients = await User.find({ role: 'PATIENT' });

    if (doctors.length === 0 || patients.length === 0) {
      console.log('No doctors or patients found. Cannot seed appointments.');
      return;
    }

    // Create appointments between doctors and patients
    const appointments = [
      {
        patientId: patients[0]._id, // John Smith
        doctorId: doctors[0]._id,   // Dr. Aizhan Bekturova (Cardiologist)
        appointmentDate: new Date('2023-05-10T10:00:00Z'),
        status: 'COMPLETED',
        type: 'CONSULTATION',
        notes: 'Regular checkup for hypertension management'
      },
      {
        patientId: patients[1]._id, // Sarah Johnson
        doctorId: doctors[1]._id,   // Dr. Nurlan Satybaldiev (Pediatrician)
        appointmentDate: new Date('2023-05-15T14:00:00Z'),
        status: 'COMPLETED',
        type: 'CONSULTATION',
        notes: 'Diabetes management consultation'
      },
      {
        patientId: patients[2]._id, // Michael Brown
        doctorId: doctors[2]._id,   // Dr. Saniya Omarova (Dermatologist)
        appointmentDate: new Date('2023-05-20T11:00:00Z'),
        status: 'COMPLETED',
        type: 'CONSULTATION',
        notes: 'Asthma follow-up and medication review'
      },
      {
        patientId: patients[3]._id, // Emma Wilson
        doctorId: doctors[0]._id,   // Dr. Aizhan Bekturova
        appointmentDate: new Date('2023-05-18T15:00:00Z'),
        status: 'COMPLETED',
        type: 'CONSULTATION',
        notes: 'Allergy consultation and treatment plan'
      },
      {
        patientId: patients[4]._id, // David Lee
        doctorId: doctors[1]._id,   // Dr. Nurlan Satybaldiev
        appointmentDate: new Date('2023-05-12T09:00:00Z'),
        status: 'COMPLETED',
        type: 'CONSULTATION',
        notes: 'Arthritis pain management consultation'
      }
    ];

    await Appointment.insertMany(appointments);
    console.log('Appointments seeded successfully!');
  } catch (error) {
    console.error('Error seeding appointments:', error);
  }
};

const seedMedications = async () => {
  try {
    const existingMedications = await Medication.countDocuments();
    if (existingMedications > 0) {
      console.log('Medications already exist in database. Skipping seed.');
      return;
    }

    // Find a pharmacist to assign medications to
    const pharmacist = await User.findOne({ role: 'PHARMACIST' });
    if (!pharmacist) {
      console.log('No pharmacist found. Skipping medication seed.');
      return;
    }

    const sampleMedications = [
      {
        nameKazakh: 'Парацетамол',
        nameInternational: 'Paracetamol',
        composition: 'Paracetamol 500mg',
        strength: '500mg',
        form: 'TABLET',
        manufacturer: 'Actavis',
        price: 450.00,
        tagsOrCategory: ['pain relief', 'fever reducer'],
        addedByPharmacistId: pharmacist._id,
        isAvailable: true,
        contraindications: 'Liver disease, alcohol dependency',
        sideEffects: 'Nausea, skin rash, liver damage (overdose)',
        dosageInstructions: 'Adults: 1-2 tablets every 4-6 hours. Maximum 8 tablets per day.',
        storageCriteria: 'Store in a cool, dry place below 25°C',
        stockQuantity: 150,
        lowStockThreshold: 20,
        expiryDate: new Date('2026-12-31')
      },
      {
        nameKazakh: 'Ибупрофен',
        nameInternational: 'Ibuprofen',
        composition: 'Ibuprofen 400mg',
        strength: '400mg',
        form: 'TABLET',
        manufacturer: 'Pfizer',
        price: 680.00,
        tagsOrCategory: ['anti-inflammatory', 'pain relief'],
        addedByPharmacistId: pharmacist._id,
        isAvailable: true,
        contraindications: 'Stomach ulcers, kidney disease, heart disease',
        sideEffects: 'Stomach upset, dizziness, headache',
        dosageInstructions: 'Adults: 1 tablet every 6-8 hours with food. Maximum 3 tablets per day.',
        storageCriteria: 'Store below 25°C in original packaging',
        stockQuantity: 8, // Low stock for testing
        lowStockThreshold: 10,
        expiryDate: new Date('2025-08-15')
      },
      {
        nameKazakh: 'Амоксициллин',
        nameInternational: 'Amoxicillin',
        composition: 'Amoxicillin 500mg',
        strength: '500mg',
        form: 'CAPSULE',
        manufacturer: 'Sandoz',
        price: 1250.00,
        tagsOrCategory: ['antibiotic', 'infection'],
        addedByPharmacistId: pharmacist._id,
        isAvailable: true,
        contraindications: 'Penicillin allergy, mononucleosis',
        sideEffects: 'Diarrhea, nausea, skin rash, allergic reactions',
        dosageInstructions: 'Adults: 1 capsule 3 times daily for 7-10 days',
        storageCriteria: 'Store in refrigerator (2-8°C)',
        stockQuantity: 75,
        lowStockThreshold: 15,
        expiryDate: new Date('2025-06-30') // Expiring soon for testing
      },
      {
        nameKazakh: 'Омепразол',
        nameInternational: 'Omeprazole',
        composition: 'Omeprazole 20mg',
        strength: '20mg',
        form: 'CAPSULE',
        manufacturer: 'Teva',
        price: 890.00,
        tagsOrCategory: ['acid reducer', 'stomach'],
        addedByPharmacistId: pharmacist._id,
        isAvailable: true,
        contraindications: 'Liver disease, osteoporosis risk',
        sideEffects: 'Headache, stomach pain, diarrhea',
        dosageInstructions: 'Adults: 1 capsule daily before breakfast',
        storageCriteria: 'Store below 25°C, protect from moisture',
        stockQuantity: 45,
        lowStockThreshold: 10,
        expiryDate: new Date('2027-03-15')
      },
      {
        nameKazakh: 'Салбутамол',
        nameInternational: 'Salbutamol',
        composition: 'Salbutamol 100mcg per dose',
        strength: '100mcg',
        form: 'INHALER',
        manufacturer: 'GSK',
        price: 2150.00,
        tagsOrCategory: ['asthma', 'bronchodilator'],
        addedByPharmacistId: pharmacist._id,
        isAvailable: true,
        contraindications: 'Heart rhythm disorders, hyperthyroidism',
        sideEffects: 'Tremor, headache, rapid heartbeat',
        dosageInstructions: '1-2 puffs as needed for breathing difficulties',
        storageCriteria: 'Store below 30°C, do not freeze',
        stockQuantity: 25,
        lowStockThreshold: 5,
        expiryDate: new Date('2026-09-20')
      },
      {
        nameKazakh: 'Лоратадин',
        nameInternational: 'Loratadine',
        composition: 'Loratadine 10mg',
        strength: '10mg',
        form: 'TABLET',
        manufacturer: 'Actavis',
        price: 320.00,
        tagsOrCategory: ['antihistamine', 'allergy'],
        addedByPharmacistId: pharmacist._id,
        isAvailable: true,
        contraindications: 'Liver disease, pregnancy (first trimester)',
        sideEffects: 'Drowsiness, dry mouth, fatigue',
        dosageInstructions: 'Adults: 1 tablet daily',
        storageCriteria: 'Store below 25°C in dry place',
        stockQuantity: 3, // Very low stock
        lowStockThreshold: 10,
        expiryDate: new Date('2026-11-10')
      }
    ];

    await Medication.insertMany(sampleMedications);
    console.log('Sample medications seeded successfully');
  } catch (error) {
    console.error('Error seeding medications:', error);
  }
};

const seedPrescriptions = async () => {
  try {
    const existingPrescriptions = await Prescription.countDocuments();
    if (existingPrescriptions > 0) {
      console.log('Prescriptions already exist in database. Skipping seed.');
      return;
    }

    // Get patients, doctors, and medications
    const patients = await User.find({ role: 'PATIENT' });
    const doctors = await User.find({ role: 'DOCTOR' });
    const medications = await Medication.find();

    if (patients.length === 0 || doctors.length === 0 || medications.length === 0) {
      console.log('No patients, doctors, or medications found. Skipping prescription seed.');
      return;
    }

    const samplePrescriptions = [
      {
        patientId: patients[0]._id, // First patient
        doctorId: doctors[0]._id,   // First doctor
        issueDate: new Date('2025-05-20'),
        medicationsPrescribed: [
          {
            medicationId: medications[0]._id, // Paracetamol
            dosage: '1 tablet',
            frequency: 'Three times a day',
            duration: '7 days',
            instructions: 'Take with food',
            startDate: new Date('2025-05-20'),
            endDate: new Date('2025-05-27')
          },
          {
            medicationId: medications[1]._id, // Ibuprofen
            dosage: '1 tablet',
            frequency: 'As needed for pain',
            duration: '5 days',
            instructions: 'Take with food or milk',
            startDate: new Date('2025-05-20'),
            endDate: new Date('2025-05-25')
          }
        ],
        diagnosis: 'Common cold with mild fever',
        notes: 'Patient should rest and drink plenty of fluids',
        status: 'ACTIVE'
      },
      {
        patientId: patients[0]._id, // Same patient
        doctorId: doctors[1]._id,   // Different doctor
        issueDate: new Date('2025-05-15'),
        medicationsPrescribed: [
          {
            medicationId: medications[2]._id, // Amoxicillin
            dosage: '1 capsule',
            frequency: 'Three times a day',
            duration: '10 days',
            instructions: 'Complete the full course even if feeling better',
            startDate: new Date('2025-05-15'),
            endDate: new Date('2025-05-25')
          }
        ],
        diagnosis: 'Bacterial infection',
        notes: 'Follow up in 1 week if symptoms persist',
        status: 'COMPLETED'
      },
      {
        patientId: patients[0]._id, // Same patient
        doctorId: doctors[0]._id,   // First doctor
        issueDate: new Date('2025-05-10'),
        medicationsPrescribed: [
          {
            medicationId: medications[5]._id, // Loratadine
            dosage: '1 tablet',
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take in the morning',
            startDate: new Date('2025-05-10'),
            endDate: new Date('2025-06-10')
          }
        ],
        diagnosis: 'Seasonal allergies',
        notes: 'Continue as needed during allergy season',
        status: 'ACTIVE'
      }
    ];

    await Prescription.insertMany(samplePrescriptions);
    console.log('Sample prescriptions seeded successfully');
  } catch (error) {
    console.error('Error seeding prescriptions:', error);
  }
};

// Function to seed all dummy data
const seedAllData = async () => {
  await seedDoctors();
  await seedPatients();
  await seedPharmacists();
  await seedAppointments();
  await seedMedications();
  await seedPrescriptions();
};

// Export the functions
module.exports = {
  seedDoctors,
  seedPatients,
  seedAppointments,
  seedMedications,
  seedPharmacists,
  seedPrescriptions,
  seedAllData
}; 