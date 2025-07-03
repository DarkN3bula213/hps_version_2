// User related types for school management
import type { BaseEntity, ContactInfo } from './common.types';

export interface Student extends BaseEntity {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  grade: string;
  section: string;
  parentId: string;
  emergencyContact: ContactInfo;
  medicalInfo?: MedicalInfo;
  academicInfo: AcademicInfo;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
}

export interface Teacher extends BaseEntity {
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  gradeLevels: string[];
  qualification: string;
  experience: number;
  contactInfo: ContactInfo;
  status: 'active' | 'inactive' | 'on_leave';
}

export interface Parent extends BaseEntity {
  parentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: 'father' | 'mother' | 'guardian';
  children: string[]; // Student IDs
  contactInfo: ContactInfo;
  status: 'active' | 'inactive';
}

export interface Staff extends BaseEntity {
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  contactInfo: ContactInfo;
  status: 'active' | 'inactive' | 'on_leave';
}

export interface MedicalInfo {
  allergies: string[];
  medications: string[];
  conditions: string[];
  emergencyContact: ContactInfo;
}

export interface AcademicInfo {
  currentGrade: string;
  currentSection: string;
  enrollmentDate: Date;
  previousSchool?: string;
  academicHistory: AcademicRecord[];
}

export interface AcademicRecord {
  year: string;
  grade: string;
  gpa: number;
  attendance: number;
  remarks?: string;
}
