'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../utils/api';
import {
  Bell,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Plane,
  Heart,
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
} from 'lucide-react';
import StaffSidebar from './ui/staff-sidebar';

interface Donor {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Pending';
  dateJoined: string;
  lastDonation: string;
  dob: string;
  occupation: string;
  maritalStatus: string;
  address: string;
  phone: string;
  email: string;
  travel: 'Yes' | 'No';
  travelCountries: string;
  travelPurpose: string;
  donationReasons: string;
  spouseSupport: 'Yes' | 'No';
  prevDonations: 'Yes' | 'No';
  lastDonationDate: string;
  lastDonationLocation: string;
  stoppedReason: string;
  medicalHistory: {
    tuberculosis: 'Yes' | 'No';
    hepatitisB: 'Yes' | 'No';
    mastitis: 'Yes' | 'No';
    syphilis: 'Yes' | 'No';
    herpes: 'Yes' | 'No';
    std: 'Yes' | 'No';
  };
  habits: {
    alcohol24h: 'Yes' | 'No';
    smoke: 'Yes' | 'No';
    illegalDrugs: 'Yes' | 'No';
    intravenousDrugs: 'Yes' | 'No';
  };
  diet: {
    vegetarian: 'Yes' | 'No';
    multivitamins: 'Yes' | 'No';
    herbalHighDose: 'Yes' | 'No';
  };
  bloodExposure: {
    bloodProduct12m: 'Yes' | 'No';
    needlePrick: 'Yes' | 'No';
    repeatedTransfusions: 'Yes' | 'No';
  };
}

interface Applicant {
  id: string;
  name: string;
  application_status: 'Approved' | 'Pending' | 'Rejected';
  dateApplied: string;
  email: string;
  dob: string;
  occupation: string;
  maritalStatus: string;
  address: string;
  phone: string;
  travel: 'Yes' | 'No';
  travelCountries: string;
  travelPurpose: string;
  donationReasons: string;
  spouseSupport: 'Yes' | 'No';
  prevDonations: 'Yes' | 'No';
  lastDonationDate: string;
  lastDonationLocation: string;
  stoppedReason: string;
  medicalHistory: {
    tuberculosis: 'Yes' | 'No';
    hepatitisB: 'Yes' | 'No';
    mastitis: 'Yes' | 'No';
    syphilis: 'Yes' | 'No';
    herpes: 'Yes' | 'No';
    std: 'Yes' | 'No';
  };
  habits: {
    alcohol24h: 'Yes' | 'No';
    smoke: 'Yes' | 'No';
    illegalDrugs: 'Yes' | 'No';
    intravenousDrugs: 'Yes' | 'No';
  };
  diet: {
    vegetarian: 'Yes' | 'No';
    multivitamins: 'Yes' | 'No';
    herbalHighDose: 'Yes' | 'No';
  };
  bloodExposure: {
    bloodProduct12m: 'Yes' | 'No';
    needlePrick: 'Yes' | 'No';
    repeatedTransfusions: 'Yes' | 'No';
  };
}

interface StaffDonorsManagementProps {
  mode: 'donors' | 'applicants';
}

export default function StaffDonorsManagement({ mode }: StaffDonorsManagementProps) {
  // Navigation Collapsibles
  const [donorsOpen, setDonorsOpen] = useState(true);
  const [beneficiariesOpen, setBeneficiariesOpen] = useState(true);
  const [showSidebarNotification, setShowSidebarNotification] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  // Main list states
  // removing the mock 
  /*
  const [donors, setDonors] = useState<Donor[]>([
    {
      id: 'D001',
      name: 'Olivia Carter',
      status: 'Active',
      dateJoined: '2025-01-12',
      lastDonation: '2026-05-01',
      dob: '1995-05-12',
      occupation: 'Accountant',
      maritalStatus: 'Married',
      address: '7428 Maple Crest Drive Apt 5B, Riverton, OR 97214, United States',
      phone: '+1 (555) 274-8391',
      email: 'OllieCarter@example.com',
      travel: 'Yes',
      travelCountries: 'Japan, China, Singapore, and Sweden',
      travelPurpose: 'Work',
      donationReasons: 'To support babies whose mothers cannot produce enough milk.',
      spouseSupport: 'Yes',
      prevDonations: 'Yes',
      lastDonationDate: '2026-05-01',
      lastDonationLocation: 'St. Judes Hospital',
      stoppedReason: 'I was no longer able to produce breast milk.',
      medicalHistory: { tuberculosis: 'Yes', hepatitisB: 'No', mastitis: 'Yes', syphilis: 'No', herpes: 'No', std: 'Yes' },
      habits: { alcohol24h: 'Yes', smoke: 'No', illegalDrugs: 'Yes', intravenousDrugs: 'No' },
      diet: { vegetarian: 'Yes', multivitamins: 'No', herbalHighDose: 'Yes' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    },
    {
      id: 'D002',
      name: 'Sophia Mitchell',
      status: 'Inactive',
      dateJoined: '2024-11-08',
      lastDonation: '2026-03-14',
      dob: '1992-08-20',
      occupation: 'Teacher',
      maritalStatus: 'Single',
      address: '109 Birchwood Lane, Portland, OR 97205',
      phone: '+1 (555) 890-4122',
      email: 'sophia.m@example.com',
      travel: 'No',
      travelCountries: '',
      travelPurpose: '',
      donationReasons: 'Altruistic donation to support clinical neonates.',
      spouseSupport: 'Yes',
      prevDonations: 'No',
      lastDonationDate: '',
      lastDonationLocation: '',
      stoppedReason: '',
      medicalHistory: { tuberculosis: 'No', hepatitisB: 'No', mastitis: 'No', syphilis: 'No', herpes: 'No', std: 'No' },
      habits: { alcohol24h: 'No', smoke: 'No', illegalDrugs: 'No', intravenousDrugs: 'No' },
      diet: { vegetarian: 'No', multivitamins: 'Yes', herbalHighDose: 'No' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    },
    {
      id: 'D003',
      name: 'Emma Phillips',
      status: 'Active',
      dateJoined: '2025-06-20',
      lastDonation: '2026-04-28',
      dob: '1997-11-02',
      occupation: 'Graphic Designer',
      maritalStatus: 'Married',
      address: '438 Pine Meadows Blvd, Portland, OR 97210',
      phone: '+1 (555) 345-0912',
      email: 'emma.p@example.com',
      travel: 'Yes',
      travelCountries: 'Canada',
      travelPurpose: 'Vacation',
      donationReasons: 'Had excess supply and wanted to help others.',
      spouseSupport: 'Yes',
      prevDonations: 'Yes',
      lastDonationDate: '2026-04-28',
      lastDonationLocation: 'Makati Human Milk Bank',
      stoppedReason: 'None, actively donating.',
      medicalHistory: { tuberculosis: 'No', hepatitisB: 'No', mastitis: 'No', syphilis: 'No', herpes: 'No', std: 'No' },
      habits: { alcohol24h: 'No', smoke: 'No', illegalDrugs: 'No', intravenousDrugs: 'No' },
      diet: { vegetarian: 'No', multivitamins: 'Yes', herbalHighDose: 'No' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    },
    {
      id: 'D004',
      name: 'Liam Turner',
      status: 'Active',
      dateJoined: '2024-09-17',
      lastDonation: '2026-02-11',
      dob: '1990-03-14',
      occupation: 'Software Engineer',
      maritalStatus: 'Married',
      address: '502 Cedar Heights Road, Beaverton, OR 97005',
      phone: '+1 (555) 762-3841',
      email: 'liam.turner@example.com',
      travel: 'No',
      travelCountries: '',
      travelPurpose: '',
      donationReasons: 'Helping out the community clinics.',
      spouseSupport: 'Yes',
      prevDonations: 'Yes',
      lastDonationDate: '2026-02-11',
      lastDonationLocation: 'Beaverton Community Clinic',
      stoppedReason: 'Temporary pause.',
      medicalHistory: { tuberculosis: 'No', hepatitisB: 'No', mastitis: 'No', syphilis: 'No', herpes: 'No', std: 'No' },
      habits: { alcohol24h: 'Yes', smoke: 'No', illegalDrugs: 'No', intravenousDrugs: 'No' },
      diet: { vegetarian: 'Yes', multivitamins: 'Yes', herbalHighDose: 'No' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    },
    {
      id: 'D005',
      name: 'Ava Roberts',
      status: 'Pending',
      dateJoined: '2025-03-05',
      lastDonation: '2026-01-25',
      dob: '1994-07-22',
      occupation: 'Nurse',
      maritalStatus: 'Single',
      address: '887 Oak Ridge Way, Vancouver, WA 98661',
      phone: '+1 (555) 902-8813',
      email: 'ava.roberts@example.com',
      travel: 'Yes',
      travelCountries: 'United Kingdom',
      travelPurpose: 'Leisure',
      donationReasons: 'To contribute to neonatal health programs.',
      spouseSupport: 'Yes',
      prevDonations: 'Yes',
      lastDonationDate: '2026-01-25',
      lastDonationLocation: 'Legacy Health Center',
      stoppedReason: 'Awaiting rescreening.',
      medicalHistory: { tuberculosis: 'No', hepatitisB: 'No', mastitis: 'No', syphilis: 'No', herpes: 'No', std: 'No' },
      habits: { alcohol24h: 'No', smoke: 'No', illegalDrugs: 'No', intravenousDrugs: 'No' },
      diet: { vegetarian: 'No', multivitamins: 'No', herbalHighDose: 'No' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    }
  ]);

  const [applicants, setApplicants] = useState<Applicant[]>([
    {
      id: 'A001',
      name: 'Sarah Jenkins',
      application_status: 'Pending',
      dateApplied: '2026-06-20',
      email: 'sarah.j@example.com',
      dob: '1996-01-10',
      occupation: 'Consultant',
      maritalStatus: 'Single',
      address: '221 Oak Street Apt 3A, Makati City',
      phone: '+63 917 555 0122',
      travel: 'No',
      travelCountries: '',
      travelPurpose: '',
      donationReasons: 'Wants to support local infant nutrition programs.',
      spouseSupport: 'Yes',
      prevDonations: 'No',
      lastDonationDate: '',
      lastDonationLocation: '',
      stoppedReason: '',
      medicalHistory: { tuberculosis: 'No', hepatitisB: 'No', mastitis: 'No', syphilis: 'No', herpes: 'No', std: 'No' },
      habits: { alcohol24h: 'No', smoke: 'No', illegalDrugs: 'No', intravenousDrugs: 'No' },
      diet: { vegetarian: 'No', multivitamins: 'Yes', herbalHighDose: 'No' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    },
    {
      id: 'A002',
      name: 'Lily Henderson',
      application_status: 'Approved',
      dateApplied: '2026-06-18',
      email: 'lily.h@example.com',
      dob: '1993-04-15',
      occupation: 'Analyst',
      maritalStatus: 'Married',
      address: '45 Sunset Blvd, Taguig City',
      phone: '+63 917 890 2234',
      travel: 'Yes',
      travelCountries: 'Singapore',
      travelPurpose: 'Work',
      donationReasons: 'Excess supply to support NICU babies.',
      spouseSupport: 'Yes',
      prevDonations: 'No',
      lastDonationDate: '',
      lastDonationLocation: '',
      stoppedReason: '',
      medicalHistory: { tuberculosis: 'No', hepatitisB: 'No', mastitis: 'No', syphilis: 'No', herpes: 'No', std: 'No' },
      habits: { alcohol24h: 'No', smoke: 'No', illegalDrugs: 'No', intravenousDrugs: 'No' },
      diet: { vegetarian: 'Yes', multivitamins: 'Yes', herbalHighDose: 'No' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    },
    {
      id: 'A003',
      name: 'Chloe Patel',
      application_status: 'Rejected',
      dateApplied: '2026-06-15',
      email: 'chloe.p@example.com',
      dob: '1989-10-25',
      occupation: 'Chemist',
      maritalStatus: 'Married',
      address: '12 Emerald Drive, Pasig City',
      phone: '+63 918 123 4567',
      travel: 'Yes',
      travelCountries: 'India, China',
      travelPurpose: 'Family Visit',
      donationReasons: 'Wants to donate surplus.',
      spouseSupport: 'Yes',
      prevDonations: 'Yes',
      lastDonationDate: '2025-10-12',
      lastDonationLocation: 'Mumbai Milk Center',
      stoppedReason: 'Relocation',
      medicalHistory: { tuberculosis: 'Yes', hepatitisB: 'No', mastitis: 'No', syphilis: 'No', herpes: 'No', std: 'No' },
      habits: { alcohol24h: 'No', smoke: 'Yes', illegalDrugs: 'No', intravenousDrugs: 'No' },
      diet: { vegetarian: 'Yes', multivitamins: 'No', herbalHighDose: 'No' },
      bloodExposure: { bloodProduct12m: 'No', needlePrick: 'No', repeatedTransfusions: 'No' }
    }
  ]);
*/
// Main list states
  const [donors, setDonors] = useState<Donor[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- PASTE THIS NEW BLOCK HERE ---
  
  // This function reaches out to your backend, grabs the raw database data, 
  // and translates it so your frontend UI can read it perfectly without crashing.
 // This function reaches out to your backend, grabs the raw database data, 
  // and translates it so your frontend UI can read it perfectly without crashing.
  const fetchAllDonors = async () => {
    try {
      setIsLoadingData(true);
      const response = await api.get('/api/donors');
      
      // 1. THE HEAT-SEEKING MISSILE
      // This logic digs into the backend response and finds the actual Array
      let rawArray: any[] = [];
      const payload = response.data?.data; // This is the { ... } object from your screenshot

      if (Array.isArray(payload)) {
        rawArray = payload;
      } else if (payload && typeof payload === 'object') {
        // Look through all the keys in the object to find the one holding the array (like 'donors' or 'results')
        const arrayKey = Object.keys(payload).find(key => Array.isArray(payload[key]));
        if (arrayKey) {
          rawArray = payload[arrayKey];
        }
      }

      // If the database is completely empty, rawArray will just be [], which is safe!
      if (!rawArray) {
        rawArray = []; 
      }

      // 2. THE TRANSLATOR
      const mappedData = rawArray.map((d: any) => {
        const profile = d.profile || {};
        const personal = profile.personal_information || {};
        const travelInfo = profile.traveling_information || {};
        const donationInfo = profile.donation_information || {};
        const medicalInfo = profile.medical_information || {};
        
        return {
          id: d.dtn,
          name: d.name,
          status: d.application_status === 'pending' ? 'Pending' : (d.account_status === 'active' ? 'Active' : 'Inactive'),
          dateJoined: d.joined_date ? new Date(d.joined_date).toISOString().split('T')[0] : 'N/A',
          lastDonation: donationInfo.last_donation || 'N/A',
          dob: d.birth_date ? new Date(d.birth_date).toISOString().split('T')[0] : 'N/A',
          occupation: personal.occupation || '',
          maritalStatus: personal.marital_status || '',
          address: personal.home_address || '',
          phone: d.phone,
          email: d.email,

          travel: travelInfo.travelled_recently === 'yes' ? 'Yes' : 'No',
          travelCountries: travelInfo.country_visited || '',
          travelPurpose: travelInfo.purpose || '',
          
          donationReasons: donationInfo.reason || '',
          spouseSupport: donationInfo.spouse_consent === 'yes' ? 'Yes' : 'No',
          prevDonations: donationInfo.previously_donated === 'yes' ? 'Yes' : 'No',
          lastDonationDate: donationInfo.last_donation || '',
          lastDonationLocation: donationInfo.place_donated || '',
          stoppedReason: donationInfo.reason_for_stopping || '',

          medicalHistory: {
            tuberculosis: medicalInfo.infectious_medical_illness?.tuberculosis === 'yes' ? 'Yes' : 'No',
            hepatitisB: medicalInfo.infectious_medical_illness?.hepatitis_b === 'yes' ? 'Yes' : 'No',
            mastitis: medicalInfo.infectious_medical_illness?.mastitis === 'yes' ? 'Yes' : 'No',
            syphilis: medicalInfo.infectious_medical_illness?.syphilis === 'yes' ? 'Yes' : 'No',
            herpes: medicalInfo.infectious_medical_illness?.herpes === 'yes' ? 'Yes' : 'No',
            std: medicalInfo.infectious_medical_illness?.std === 'yes' ? 'Yes' : 'No',
          },
          habits: {
            alcohol24h: medicalInfo.substance_user_habits?.consumed_alcohol === 'yes' ? 'Yes' : 'No',
            smoke: medicalInfo.substance_user_habits?.smoke === 'yes' ? 'Yes' : 'No',
            illegalDrugs: medicalInfo.substance_user_habits?.illegal_drugs === 'yes' ? 'Yes' : 'No',
            intravenousDrugs: medicalInfo.substance_user_habits?.intravenous_drug_use === 'yes' ? 'Yes' : 'No',
          },
          diet: {
            vegetarian: medicalInfo.diet_supplement_tracking?.vegetarian === 'yes' ? 'Yes' : 'No',
            multivitamins: medicalInfo.diet_supplement_tracking?.multivitamins === 'yes' ? 'Yes' : 'No',
            herbalHighDose: medicalInfo.diet_supplement_tracking?.herbal_drugs === 'yes' ? 'Yes' : 'No',
          },
          bloodExposure: {
            bloodProduct12m: medicalInfo.blood_exposure_transfusion?.received_blood === 'yes' ? 'Yes' : 'No',
            needlePrick: medicalInfo.blood_exposure_transfusion?.needle_contact === 'yes' ? 'Yes' : 'No',
            repeatedTransfusions: medicalInfo.blood_exposure_transfusion?.repeated_blood_transfusion === 'yes' ? 'Yes' : 'No',
          }
        };
      });

      // 3. SORT AND SPLIT
      const fetchedApplicants = mappedData.filter((d: any) => d.status === 'Pending');
      const fetchedDonors = mappedData.filter((d: any) => d.status !== 'Pending');

      setApplicants(fetchedApplicants);
      setDonors(fetchedDonors);

    } catch (error) {
      console.error("Failed to fetch donors:", error);
    } finally {
      setIsLoadingData(false);
    }
  };
  // 8. This built-in React hook tells the component: 
  // "Hey, as soon as this page loads for the first time, run the fetchAllDonors function automatically!"
  useEffect(() => {
    fetchAllDonors();
  }, []);
  // --- END OF PASTE ---

  // Query Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Selected item for Detail Modal
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  // Modal Visibility states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerTab, setRegisterTab] = useState(1); // 1: Personal/Contact, 2: Travel/Donation, 3: Medical/Habits

  // Register New Donor Form State
  const [newDonorForm, setNewDonorForm] = useState({
    name: '',
    dob: '',
    occupation: '',
    maritalStatus: 'Single',
    address: '',
    phone: '',
    email: '',
    travel: 'No' as 'Yes' | 'No',
    travelCountries: '',
    travelPurpose: '',
    donationReasons: '',
    spouseSupport: 'Yes' as 'Yes' | 'No',
    prevDonations: 'No' as 'Yes' | 'No',
    lastDonationDate: '',
    lastDonationLocation: '',
    stoppedReason: '',
    tuberculosis: 'No' as 'Yes' | 'No',
    hepatitisB: 'No' as 'Yes' | 'No',
    mastitis: 'No' as 'Yes' | 'No',
    syphilis: 'No' as 'Yes' | 'No',
    herpes: 'No' as 'Yes' | 'No',
    std: 'No' as 'Yes' | 'No',
    alcohol24h: 'No' as 'Yes' | 'No',
    smoke: 'No' as 'Yes' | 'No',
    illegalDrugs: 'No' as 'Yes' | 'No',
    intravenousDrugs: 'No' as 'Yes' | 'No',
    vegetarian: 'No' as 'Yes' | 'No',
    multivitamins: 'No' as 'Yes' | 'No',
    herbalHighDose: 'No' as 'Yes' | 'No',
    bloodProduct12m: 'No' as 'Yes' | 'No',
    needlePrick: 'No' as 'Yes' | 'No',
    repeatedTransfusions: 'No' as 'Yes' | 'No',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSidebarNotification(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTime(date.toLocaleDateString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter & Sort Logic
  const getProcessedDonors = () => {
    let result = [...donors];

    // Search filter (id or name)
    if (search.trim() !== '') {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortBy as keyof Donor];
      let bVal = b[sortBy as keyof Donor];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const getProcessedApplicants = () => {
    let result = [...applicants];

    // Search filter
    if (search.trim() !== '') {
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.id.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Application Status filter
    if (statusFilter !== 'All') {
      result = result.filter((a) => a.application_status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortBy as keyof Applicant];
      let bVal = b[sortBy as keyof Applicant];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const processedDonors = getProcessedDonors();
  const processedApplicants = getProcessedApplicants();

  // Pagination bounds
  const totalItems = mode === 'donors' ? processedDonors.length : processedApplicants.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pagedItems = mode === 'donors' 
    ? processedDonors.slice((page - 1) * limit, page * limit)
    : processedApplicants.slice((page - 1) * limit, page * limit);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, limit]);

  // Handle Sort Toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Submit registration form
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newId = `D00${donors.length + 1}`;
    const newDonor: Donor = {
      id: newId,
      name: newDonorForm.name,
      status: 'Active',
      dateJoined: new Date().toISOString().split('T')[0],
      lastDonation: newDonorForm.lastDonationDate || 'N/A',
      dob: newDonorForm.dob,
      occupation: newDonorForm.occupation,
      maritalStatus: newDonorForm.maritalStatus,
      address: newDonorForm.address,
      phone: newDonorForm.phone,
      email: newDonorForm.email,
      travel: newDonorForm.travel,
      travelCountries: newDonorForm.travelCountries,
      travelPurpose: newDonorForm.travelPurpose,
      donationReasons: newDonorForm.donationReasons,
      spouseSupport: newDonorForm.spouseSupport,
      prevDonations: newDonorForm.prevDonations,
      lastDonationDate: newDonorForm.lastDonationDate,
      lastDonationLocation: newDonorForm.lastDonationLocation,
      stoppedReason: newDonorForm.stoppedReason,
      medicalHistory: {
        tuberculosis: newDonorForm.tuberculosis,
        hepatitisB: newDonorForm.hepatitisB,
        mastitis: newDonorForm.mastitis,
        syphilis: newDonorForm.syphilis,
        herpes: newDonorForm.herpes,
        std: newDonorForm.std,
      },
      habits: {
        alcohol24h: newDonorForm.alcohol24h,
        smoke: newDonorForm.smoke,
        illegalDrugs: newDonorForm.illegalDrugs,
        intravenousDrugs: newDonorForm.intravenousDrugs,
      },
      diet: {
        vegetarian: newDonorForm.vegetarian,
        multivitamins: newDonorForm.multivitamins,
        herbalHighDose: newDonorForm.herbalHighDose,
      },
      bloodExposure: {
        bloodProduct12m: newDonorForm.bloodProduct12m,
        needlePrick: newDonorForm.needlePrick,
        repeatedTransfusions: newDonorForm.repeatedTransfusions,
      },
    };

    if (mode === 'applicants') {
      const newApplicant: Applicant = {
        id: `A00${applicants.length + 1}`,
        name: newDonorForm.name,
        application_status: 'Pending',
        dateApplied: new Date().toISOString().split('T')[0],
        email: newDonorForm.email,
        dob: newDonorForm.dob,
        occupation: newDonorForm.occupation,
        maritalStatus: newDonorForm.maritalStatus,
        address: newDonorForm.address,
        phone: newDonorForm.phone,
        travel: newDonorForm.travel,
        travelCountries: newDonorForm.travelCountries,
        travelPurpose: newDonorForm.travelPurpose,
        donationReasons: newDonorForm.donationReasons,
        spouseSupport: newDonorForm.spouseSupport,
        prevDonations: newDonorForm.prevDonations,
        lastDonationDate: newDonorForm.lastDonationDate,
        lastDonationLocation: newDonorForm.lastDonationLocation,
        stoppedReason: newDonorForm.stoppedReason,
        medicalHistory: {
          tuberculosis: newDonorForm.tuberculosis,
          hepatitisB: newDonorForm.hepatitisB,
          mastitis: newDonorForm.mastitis,
          syphilis: newDonorForm.syphilis,
          herpes: newDonorForm.herpes,
          std: newDonorForm.std,
        },
        habits: {
          alcohol24h: newDonorForm.alcohol24h,
          smoke: newDonorForm.smoke,
          illegalDrugs: newDonorForm.illegalDrugs,
          intravenousDrugs: newDonorForm.intravenousDrugs,
        },
        diet: {
          vegetarian: newDonorForm.vegetarian,
          multivitamins: newDonorForm.multivitamins,
          herbalHighDose: newDonorForm.herbalHighDose,
        },
        bloodExposure: {
          bloodProduct12m: newDonorForm.bloodProduct12m,
          needlePrick: newDonorForm.needlePrick,
          repeatedTransfusions: newDonorForm.repeatedTransfusions,
        },
      };
      setApplicants([newApplicant, ...applicants]);
    } else {
      setDonors([newDonor, ...donors]);
    }
    setIsRegisterOpen(false);
    // Reset form
    setNewDonorForm({
      name: '',
      dob: '',
      occupation: '',
      maritalStatus: 'Single',
      address: '',
      phone: '',
      email: '',
      travel: 'No',
      travelCountries: '',
      travelPurpose: '',
      donationReasons: '',
      spouseSupport: 'Yes',
      prevDonations: 'No',
      lastDonationDate: '',
      lastDonationLocation: '',
      stoppedReason: '',
      tuberculosis: 'No',
      hepatitisB: 'No',
      mastitis: 'No',
      syphilis: 'No',
      herpes: 'No',
      std: 'No',
      alcohol24h: 'No',
      smoke: 'No',
      illegalDrugs: 'No',
      intravenousDrugs: 'No',
      vegetarian: 'No',
      multivitamins: 'No',
      herbalHighDose: 'No',
      bloodProduct12m: 'No',
      needlePrick: 'No',
      repeatedTransfusions: 'No',
    });
    setRegisterTab(1);
  };

  // Mock status badge color mappings
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Inactive':
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex font-sans">
      
      {/* Sidebar Navigation */}
      <StaffSidebar activeItem={mode === 'donors' ? 'donors' : 'applicants-donors'} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* Header */}
        <header className="px-8 py-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {mode === 'donors' ? 'Donors List' : 'Applicants List'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-neutral-500 text-xs sm:text-sm font-medium">
              {currentTime || 'Loading date...'}
            </div>
            <Link
              href="/work/notification"
              className="relative p-2 text-neutral-500 hover:text-brand-teal hover:bg-neutral-100 rounded-full transition-all duration-200"
              data-testid="header-notification-btn"
              aria-label="View notifications"
            >
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full animate-ping" />
              <span className="absolute top-1 right-1 size-2 bg-brand-teal rounded-full" />
            </Link>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Action and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="flex flex-wrap items-center gap-3.5 flex-1 min-w-0">
              {/* Search */}
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by ID, name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-neutral-400"
                  data-testid="search-input"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-neutral-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-xl px-3.5 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-brand-teal/15 focus:border-brand-teal transition-all"
                  data-testid="status-select"
                >
                  <option value="All">All Statuses</option>
                  {mode === 'donors' ? (
                    <>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </>
                  ) : (
                    <>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  )}
                </select>
              </div>

              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="text-xs font-bold text-neutral-600 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-xl px-2.5 py-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-brand-teal/15 focus:border-brand-teal transition-all"
                  data-testid="limit-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            {/* New Donor button (mainly on donors list or both) */}
            {mode === 'applicants' && (
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all duration-200 shrink-0 shadow-[0_4px_12px_rgba(0,105,111,0.15)] hover:shadow-lg hover:-translate-y-0.5"
                data-testid="new-donor-btn"
              >
                <Plus className="size-4 stroke-[3px]" />
                New Donor
              </button>
            )}
          </div>

          {/* List Table Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="management-table">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold text-neutral-400 uppercase tracking-widest select-none">
                    {mode === 'donors' ? (
                      <>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('id')} data-testid="th-id">
                          ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('name')} data-testid="th-name">
                          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('status')} data-testid="th-status">
                          Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('dateJoined')} data-testid="th-date">
                          Date Joined {sortBy === 'dateJoined' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('lastDonation')} data-testid="th-last">
                          Last Donation {sortBy === 'lastDonation' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('id')} data-testid="th-id">
                          ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('name')} data-testid="th-name">
                          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('application_status')} data-testid="th-status">
                          Application Status {sortBy === 'application_status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('dateApplied')} data-testid="th-date">
                          Date Applied {sortBy === 'dateApplied' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-8 py-4 cursor-pointer hover:text-brand-teal" onClick={() => handleSort('email')} data-testid="th-email">
                          Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                  {pagedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => mode === 'donors' ? setSelectedDonor(item as Donor) : setSelectedApplicant(item as Applicant)}
                      className="hover:bg-slate-50/70 active:bg-slate-100/50 cursor-pointer transition-colors duration-150"
                      data-testid={`row-${item.id}`}
                    >
                      <td className="px-8 py-4.5 font-bold text-neutral-900">{item.id}</td>
                      <td className="px-8 py-4.5 font-bold text-neutral-900">{item.name}</td>
                      <td className="px-8 py-4.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(mode === 'donors' ? (item as Donor).status : (item as Applicant).application_status)}`}>
                          {mode === 'donors' ? (item as Donor).status : (item as Applicant).application_status}
                        </span>
                      </td>
                      <td className="px-8 py-4.5 text-neutral-500">
                        {mode === 'donors' ? (item as Donor).dateJoined : (item as Applicant).dateApplied}
                      </td>
                      <td className="px-8 py-4.5 text-neutral-500">
                        {mode === 'donors' ? (item as Donor).lastDonation : (item as Applicant).email}
                      </td>
                    </tr>
                  ))}

                  {pagedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-neutral-400 font-medium">
                        No records match the active search and filter settings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-neutral-50/50 border-t border-neutral-100 px-8 py-4.5 flex items-center justify-between gap-4 font-sans text-xs">
                <span className="text-neutral-500 font-bold">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} of {totalItems} entries
                </span>
                
                <div className="flex items-center gap-1.5" data-testid="pagination-nav">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-neutral-200 rounded-xl hover:bg-white text-neutral-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    data-testid="prev-btn"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx + 1)}
                      className={`size-8 font-bold border rounded-xl transition-all cursor-pointer ${
                        page === idx + 1
                          ? 'bg-brand-teal border-brand-teal text-white shadow-sm'
                          : 'border-neutral-200 hover:bg-white text-neutral-600'
                      }`}
                      data-testid={`page-btn-${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-neutral-200 rounded-xl hover:bg-white text-neutral-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    data-testid="next-btn"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* DETAIL MODAL (Olivia Carter style profile view) */}
      {(selectedDonor || selectedApplicant) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto" data-testid="detail-modal">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Modal Sticky Header */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 sticky top-0 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <User className="size-5.5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">
                  {mode === 'donors' ? 'Donor Profile' : 'Applicant Profile'}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedDonor(null); setSelectedApplicant(null); }}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                aria-label="Close Profile modal"
                data-testid="close-detail-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body Columns */}
            <div className="p-8 flex flex-col md:flex-row gap-8 overflow-y-auto">
              
              {/* Left Column: Side Profile */}
              <div className="w-full md:w-72 shrink-0 space-y-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col items-center gap-5 text-center shadow-sm">
                  {/* Avatar circle */}
                  <div className="size-36 rounded-full bg-slate-100 flex items-center justify-center font-bold text-neutral-700 text-3xl border border-neutral-200 select-none shadow-inner">
                    {(selectedDonor || selectedApplicant)?.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  
                  {/* Minimal metadata info */}
                  <div className="space-y-1.5 w-full">
                    <h4 className="font-bold text-neutral-950 text-base" data-testid="modal-profile-name">
                      {(selectedDonor || selectedApplicant)?.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-bold font-sans">
                      DTN ID: <span className="text-neutral-900" data-testid="modal-profile-id">{(selectedDonor || selectedApplicant)?.id}</span>
                    </p>
                    <div className="pt-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${getStatusBadge(
                        mode === 'donors' 
                          ? (selectedDonor as Donor)?.status 
                          : (selectedApplicant as Applicant)?.application_status
                      )}`} data-testid="modal-profile-status">
                        {mode === 'donors' ? (selectedDonor as Donor)?.status : (selectedApplicant as Applicant)?.application_status}
                      </span>
                    </div>
                  </div>

                  <hr className="w-full border-neutral-100" />
                  
                  <div className="w-full text-left space-y-2 text-xs">
                    <p className="text-neutral-500 font-bold font-sans uppercase text-[9px] tracking-widest">Profile Stats</p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400 font-semibold">Joined:</span>
                      <span className="font-bold text-neutral-700">
                        {mode === 'donors' ? (selectedDonor as Donor)?.dateJoined : (selectedApplicant as Applicant)?.dateApplied}
                      </span>
                    </p>
                    {mode === 'donors' && (
                      <p className="flex justify-between">
                        <span className="text-neutral-400 font-semibold">Last Donation:</span>
                        <span className="font-bold text-neutral-700">{(selectedDonor as Donor)?.lastDonation}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile actions */}
                <div className="space-y-3.5">
                  <button 
                    onClick={() => {
                      if (mode === 'donors' && selectedDonor) {
                        setDonors(donors.map((d) => d.id === selectedDonor.id ? { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' } : d));
                        setSelectedDonor(null);
                      } else if (mode === 'applicants' && selectedApplicant) {
                        setApplicants(applicants.map((a) => a.id === selectedApplicant.id ? { ...a, application_status: a.application_status === 'Approved' ? 'Pending' : 'Approved' } : a));
                        setSelectedApplicant(null);
                      }
                    }}
                    className="w-full py-2.5 text-xs font-bold text-neutral-600 hover:text-brand-teal bg-white border border-neutral-200 hover:border-brand-teal/30 hover:bg-brand-teal/5 rounded-xl transition-all shadow-sm"
                    data-testid="toggle-profile-status-btn"
                  >
                    {mode === 'donors' 
                      ? ((selectedDonor?.status === 'Active') ? 'Deactivate Profile' : 'Activate Profile')
                      : ((selectedApplicant?.application_status === 'Approved') ? 'Mark as Pending' : 'Approve Profile')
                    }
                  </button>
                  <button 
                    onClick={() => {
                      if (mode === 'donors' && selectedDonor) {
                        setDonors(donors.filter((d) => d.id !== selectedDonor.id));
                        setSelectedDonor(null);
                      } else if (mode === 'applicants' && selectedApplicant) {
                        setApplicants(applicants.filter((a) => a.id !== selectedApplicant.id));
                        setSelectedApplicant(null);
                      }
                    }}
                    className="w-full py-2.5 text-xs font-bold text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-neutral-200 hover:border-rose-600 rounded-xl transition-all shadow-sm"
                    data-testid="delete-profile-btn"
                  >
                    Delete Profile
                  </button>
                </div>
              </div>

              {/* Right Column: Main Collapsible Cards */}
              <div className="flex-1 space-y-6">
                
                {/* 1. Personal Information */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-personal">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Date of Birth:</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.dob}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Occupation:</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.occupation}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Marital Status:</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.maritalStatus}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Contact Information */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-contact">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <p className="text-neutral-400 font-semibold mb-0.5">Home Address:</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.address}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Phone Number:</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.phone}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Email Address:</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.email}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Traveling Information */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-travel">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                    Traveling Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <p className="text-neutral-400 font-semibold mb-1">Have you travelled outside the country in the last 5 years?</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.travel}</p>
                    </div>
                    {(selectedDonor || selectedApplicant)?.travel === 'Yes' && (
                      <>
                        <div>
                          <p className="text-neutral-400 font-semibold mb-0.5">Countries Visited:</p>
                          <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.travelCountries}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400 font-semibold mb-0.5">Purpose of Travel:</p>
                          <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.travelPurpose}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. Donation Information */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-donation">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                    Donation Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <p className="text-neutral-400 font-semibold mb-0.5">Reasons for donating:</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.donationReasons}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Spouse supports decision?</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.spouseSupport}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 font-semibold mb-0.5">Previously donated milk?</p>
                      <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.prevDonations}</p>
                    </div>
                    {(selectedDonor || selectedApplicant)?.prevDonations === 'Yes' && (
                      <>
                        <div>
                          <p className="text-neutral-400 font-semibold mb-0.5">Last donation date:</p>
                          <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.lastDonationDate}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400 font-semibold mb-0.5">Last donation location:</p>
                          <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.lastDonationLocation}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-neutral-400 font-semibold mb-0.5">Reason for stopping:</p>
                          <p className="font-bold text-neutral-800">{(selectedDonor || selectedApplicant)?.stoppedReason}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 5. Medical History tables */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="profile-section-medical">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                    Medical Checklists & Screening
                  </h4>
                  
                  <div className="space-y-6">
                    {/* table 1: Illnesses */}
                    <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-[11px] font-sans border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase tracking-wider">
                            <th className="px-4 py-2">Infectious & Medical Illness History</th>
                            <th className="px-4 py-2 text-right">Yes/No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-600 font-semibold">
                          <tr>
                            <td className="px-4 py-2">Tuberculosis</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.medicalHistory.tuberculosis}</td>
                          </tr>
                          <tr className="bg-neutral-50/30">
                            <td className="px-4 py-2">Hepatitis B</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.medicalHistory.hepatitisB}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Mastitis / Breast inflammation</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.medicalHistory.mastitis}</td>
                          </tr>
                          <tr className="bg-neutral-50/30">
                            <td className="px-4 py-2">Syphilis</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.medicalHistory.syphilis}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Herpes</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.medicalHistory.herpes}</td>
                          </tr>
                          <tr className="bg-neutral-50/30">
                            <td className="px-4 py-2">Sexually Transmitted Disease (STD)</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.medicalHistory.std}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* table 2: Habits */}
                    <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-[11px] font-sans border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase tracking-wider">
                            <th className="px-4 py-2">Substance Use & Habits</th>
                            <th className="px-4 py-2 text-right">Yes/No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-600 font-semibold">
                          <tr>
                            <td className="px-4 py-2">Consumed alcohol in the last 24 hours?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.habits.alcohol24h}</td>
                          </tr>
                          <tr className="bg-neutral-50/30">
                            <td className="px-4 py-2">Do you smoke?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.habits.smoke}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Use any illegal/prohibited drugs?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.habits.illegalDrugs}</td>
                          </tr>
                          <tr className="bg-neutral-50/30">
                            <td className="px-4 py-2">Intravenous drug use?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.habits.intravenousDrugs}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* table 3: Diet */}
                    <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-[11px] font-sans border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase tracking-wider">
                            <th className="px-4 py-2">Dietary & Supplement Tracking</th>
                            <th className="px-4 py-2 text-right">Yes/No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-600 font-semibold">
                          <tr>
                            <td className="px-4 py-2">Are you on a vegetarian diet?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.diet.vegetarian}</td>
                          </tr>
                          <tr className="bg-neutral-50/30">
                            <td className="px-4 py-2">Do you take multivitamins?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.diet.multivitamins}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Do you take herbal drugs or high-dose vitamins?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.diet.herbalHighDose}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* table 4: Blood Exposure */}
                    <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-[11px] font-sans border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold uppercase tracking-wider">
                            <th className="px-4 py-2">Blood Exposure & Transfusion History</th>
                            <th className="px-4 py-2 text-right">Yes/No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-600 font-semibold">
                          <tr>
                            <td className="px-4 py-2">Received blood/blood products in the past 12 months?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.bloodExposure.bloodProduct12m}</td>
                          </tr>
                          <tr className="bg-neutral-50/30">
                            <td className="px-4 py-2">Accidentally pricked by a needle contaminated with blood?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.bloodExposure.needlePrick}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">Received repeated blood transfusion?</td>
                            <td className="px-4 py-2 text-right font-bold">{(selectedDonor || selectedApplicant)?.bloodExposure.repeatedTransfusions}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* REGISTRATION MODAL (New Donor Tabbed Form) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto" data-testid="register-modal">
          <form 
            onSubmit={handleRegisterSubmit} 
            data-testid="register-form"
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 flex flex-col"
          >
            
            {/* Modal Header */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 sticky top-0 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Plus className="size-5 text-brand-teal" />
                <h3 className="text-lg font-bold text-neutral-900">New Donor Registration</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all"
                aria-label="Close registration modal"
                data-testid="close-register-btn"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Registration Tabs */}
            <div className="bg-slate-50 border-b border-neutral-100 px-6 py-2.5 flex gap-2 overflow-x-auto shrink-0 select-none">
              {[
                { tab: 1, label: '1. Personal & Contact' },
                { tab: 2, label: '2. Travel & Donation' },
                { tab: 3, label: '3. Medical History' },
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setRegisterTab(item.tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    registerTab === item.tab
                      ? 'bg-brand-teal text-white shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                  }`}
                  data-testid={`register-tab-${item.tab}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Modal Form Body */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              
              {/* TAB 1: Personal & Contact */}
              {registerTab === 1 && (
                <div className="space-y-6" data-testid="register-pane-1">
                  
                  {/* Personal details fields */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Personal Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-name" className="text-neutral-500">Full Name *</label>
                        <input
                          id="reg-name"
                          type="text"
                          required
                          value={newDonorForm.name}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, name: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-dob" className="text-neutral-500">Date of Birth *</label>
                        <input
                          id="reg-dob"
                          type="date"
                          required
                          value={newDonorForm.dob}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, dob: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-dob"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-occupation" className="text-neutral-500">Occupation</label>
                        <input
                          id="reg-occupation"
                          type="text"
                          value={newDonorForm.occupation}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, occupation: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-occupation"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-marital" className="text-neutral-500">Marital Status</label>
                        <select
                          id="reg-marital"
                          value={newDonorForm.maritalStatus}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, maritalStatus: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all cursor-pointer font-medium"
                          data-testid="input-marital"
                        >
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact details fields */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="reg-address" className="text-neutral-500">Home Address *</label>
                        <input
                          id="reg-address"
                          type="text"
                          required
                          value={newDonorForm.address}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, address: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-address"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-phone" className="text-neutral-500">Phone Number *</label>
                        <input
                          id="reg-phone"
                          type="text"
                          required
                          value={newDonorForm.phone}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, phone: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-phone"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-email" className="text-neutral-500">Email Address *</label>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={newDonorForm.email}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, email: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                          data-testid="input-email"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: Travel & Donation */}
              {registerTab === 2 && (
                <div className="space-y-6" data-testid="register-pane-2">
                  
                  {/* Travel details fields */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Traveling Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                      <div className="sm:col-span-2 space-y-2">
                        <span className="text-neutral-500 block">Have you travelled outside the country in the last 5 years? *</span>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map((choice) => (
                            <label key={choice} className="flex items-center gap-2 font-medium cursor-pointer">
                              <input
                                type="radio"
                                name="travel"
                                checked={newDonorForm.travel === choice}
                                onChange={() => setNewDonorForm({ ...newDonorForm, travel: choice as 'Yes' | 'No' })}
                                className="size-4 accent-brand-teal cursor-pointer"
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {newDonorForm.travel === 'Yes' && (
                        <>
                          <div className="space-y-1.5">
                            <label htmlFor="reg-countries" className="text-neutral-500">Countries Visited</label>
                            <input
                              id="reg-countries"
                              type="text"
                              value={newDonorForm.travelCountries}
                              onChange={(e) => setNewDonorForm({ ...newDonorForm, travelCountries: e.target.value })}
                              className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                              data-testid="input-travel-countries"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="reg-travel-purpose" className="text-neutral-500">Purpose of Travel</label>
                            <input
                              id="reg-travel-purpose"
                              type="text"
                              value={newDonorForm.travelPurpose}
                              onChange={(e) => setNewDonorForm({ ...newDonorForm, travelPurpose: e.target.value })}
                              className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                              data-testid="input-travel-purpose"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Donation Details fields */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Donation Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="reg-reasons" className="text-neutral-500">Reasons for donating</label>
                        <textarea
                          id="reg-reasons"
                          value={newDonorForm.donationReasons}
                          onChange={(e) => setNewDonorForm({ ...newDonorForm, donationReasons: e.target.value })}
                          className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium h-16 resize-none"
                          data-testid="input-donation-reasons"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-neutral-500 block">Spouse supports decision? *</span>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map((choice) => (
                            <label key={choice} className="flex items-center gap-2 font-medium cursor-pointer">
                              <input
                                type="radio"
                                name="spouseSupport"
                                checked={newDonorForm.spouseSupport === choice}
                                onChange={() => setNewDonorForm({ ...newDonorForm, spouseSupport: choice as 'Yes' | 'No' })}
                                className="size-4 accent-brand-teal cursor-pointer"
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-neutral-500 block">Previously donated milk? *</span>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map((choice) => (
                            <label key={choice} className="flex items-center gap-2 font-medium cursor-pointer">
                              <input
                                type="radio"
                                name="prevDonations"
                                checked={newDonorForm.prevDonations === choice}
                                onChange={() => setNewDonorForm({ ...newDonorForm, prevDonations: choice as 'Yes' | 'No' })}
                                className="size-4 accent-brand-teal cursor-pointer"
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      </div>

                      {newDonorForm.prevDonations === 'Yes' && (
                        <>
                          <div className="space-y-1.5">
                            <label htmlFor="reg-last-date" className="text-neutral-500">Last Donation Date</label>
                            <input
                              id="reg-last-date"
                              type="date"
                              value={newDonorForm.lastDonationDate}
                              onChange={(e) => setNewDonorForm({ ...newDonorForm, lastDonationDate: e.target.value })}
                              className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                              data-testid="input-last-date"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="reg-last-loc" className="text-neutral-500">Last Donation Location</label>
                            <input
                              id="reg-last-loc"
                              type="text"
                              value={newDonorForm.lastDonationLocation}
                              onChange={(e) => setNewDonorForm({ ...newDonorForm, lastDonationLocation: e.target.value })}
                              className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                              data-testid="input-last-location"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1.5">
                            <label htmlFor="reg-stopped-reason" className="text-neutral-500">Reason for stopping</label>
                            <input
                              id="reg-stopped-reason"
                              type="text"
                              value={newDonorForm.stoppedReason}
                              onChange={(e) => setNewDonorForm({ ...newDonorForm, stoppedReason: e.target.value })}
                              className="w-full border border-neutral-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
                              data-testid="input-stopped-reason"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: Medical History & Habits */}
              {registerTab === 3 && (
                <div className="space-y-6" data-testid="register-pane-3">
                  
                  {/* Medical Checklists Form */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5 shadow-sm text-xs font-bold">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">
                      Medical History Checklists (Yes/No)
                    </h4>

                    {/* Checkbox Groups stack */}
                    <div className="space-y-6">
                      {/* Section: Illnesses */}
                      <div className="space-y-3">
                        <p className="text-neutral-400 uppercase tracking-wider text-[10px]">Infectious Illnesses</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-1.5">
                          {[
                            { key: 'tuberculosis', label: 'Tuberculosis History' },
                            { key: 'hepatitisB', label: 'Hepatitis B Carrier' },
                            { key: 'mastitis', label: 'Mastitis / Breast Inflammation' },
                            { key: 'syphilis', label: 'Syphilis History' },
                            { key: 'herpes', label: 'Active Herpes Lesions' },
                            { key: 'std', label: 'Sexually Transmitted Disease (STD)' },
                          ].map((item) => (
                            <div key={item.key} className="flex justify-between items-center gap-4">
                              <span className="font-medium text-neutral-700">{item.label}</span>
                              <div className="flex gap-3">
                                {['Yes', 'No'].map((choice) => (
                                  <label key={choice} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={item.key}
                                      checked={newDonorForm[item.key as keyof typeof newDonorForm] === choice}
                                      onChange={() => setNewDonorForm({ ...newDonorForm, [item.key]: choice })}
                                      className="accent-brand-teal"
                                      data-testid={`checkbox-${item.key}-${choice.toLowerCase()}`}
                                    />
                                    <span className="text-[10px] font-medium">{choice}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-neutral-100" />

                      {/* Section: Habits */}
                      <div className="space-y-3">
                        <p className="text-neutral-400 uppercase tracking-wider text-[10px]">Substances & Habits</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-1.5">
                          {[
                            { key: 'alcohol24h', label: 'Alcohol in last 24 hours?' },
                            { key: 'smoke', label: 'Do you smoke tobacco?' },
                            { key: 'illegalDrugs', label: 'Prohibited / illegal drug use?' },
                            { key: 'intravenousDrugs', label: 'Intravenous drug use history?' },
                          ].map((item) => (
                            <div key={item.key} className="flex justify-between items-center gap-4">
                              <span className="font-medium text-neutral-700">{item.label}</span>
                              <div className="flex gap-3">
                                {['Yes', 'No'].map((choice) => (
                                  <label key={choice} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={item.key}
                                      checked={newDonorForm[item.key as keyof typeof newDonorForm] === choice}
                                      onChange={() => setNewDonorForm({ ...newDonorForm, [item.key]: choice })}
                                      className="accent-brand-teal"
                                    />
                                    <span className="text-[10px] font-medium">{choice}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-neutral-100" />

                      {/* Section: Diet */}
                      <div className="space-y-3">
                        <p className="text-neutral-400 uppercase tracking-wider text-[10px]">Diet & Supplements</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-1.5">
                          {[
                            { key: 'vegetarian', label: 'Strict vegetarian/vegan diet?' },
                            { key: 'multivitamins', label: 'Taking daily multivitamins?' },
                            { key: 'herbalHighDose', label: 'High-dose vitamins or herbal drugs?' },
                          ].map((item) => (
                            <div key={item.key} className="flex justify-between items-center gap-4">
                              <span className="font-medium text-neutral-700">{item.label}</span>
                              <div className="flex gap-3">
                                {['Yes', 'No'].map((choice) => (
                                  <label key={choice} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={item.key}
                                      checked={newDonorForm[item.key as keyof typeof newDonorForm] === choice}
                                      onChange={() => setNewDonorForm({ ...newDonorForm, [item.key]: choice })}
                                      className="accent-brand-teal"
                                    />
                                    <span className="text-[10px] font-medium">{choice}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-neutral-100" />

                      {/* Section: Blood Exposure */}
                      <div className="space-y-3">
                        <p className="text-neutral-400 uppercase tracking-wider text-[10px]">Blood & Transfusions</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-1.5">
                          {[
                            { key: 'bloodProduct12m', label: 'Blood transfusion past 12 months?' },
                            { key: 'needlePrick', label: 'Accidental contaminated needle prick?' },
                            { key: 'repeatedTransfusions', label: 'History of repeated transfusions?' },
                          ].map((item) => (
                            <div key={item.key} className="flex justify-between items-center gap-4">
                              <span className="font-medium text-neutral-700">{item.label}</span>
                              <div className="flex gap-3">
                                {['Yes', 'No'].map((choice) => (
                                  <label key={choice} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={item.key}
                                      checked={newDonorForm[item.key as keyof typeof newDonorForm] === choice}
                                      onChange={() => setNewDonorForm({ ...newDonorForm, [item.key]: choice })}
                                      className="accent-brand-teal"
                                    />
                                    <span className="text-[10px] font-medium">{choice}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Form Footer Sticky */}
            <div className="bg-slate-50 border-t border-neutral-100 px-6 py-4 flex items-center justify-between sticky bottom-0 z-10 shrink-0">
              <div className="flex gap-2">
                {registerTab > 1 && (
                  <button
                    type="button"
                    onClick={() => setRegisterTab((t) => Math.max(1, t - 1))}
                    className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all cursor-pointer"
                    data-testid="register-prev-btn"
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                
                {registerTab < 3 ? (
                  <button
                    type="button"
                    onClick={() => setRegisterTab((t) => Math.min(3, t + 1))}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all cursor-pointer"
                    data-testid="register-next-btn"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-darker rounded-xl transition-all shadow-[0_4px_12px_rgba(0,105,111,0.1)] cursor-pointer"
                    data-testid="register-submit-btn"
                  >
                    Submit Registration
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
