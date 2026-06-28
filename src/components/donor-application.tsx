'use client';

import React, { useState } from 'react';
import Navbar from './ui/navbar';
import Footer from './ui/footer';
import { api } from '../utils/api';

export interface DonorApplicationProps {
  onSubmitSuccess?: (data: any) => void;
}

export default function DonorApplication({ onSubmitSuccess }: DonorApplicationProps) {
  // Active Tab State
  const [registerTab, setRegisterTab] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: '',
    occupation: '',
    maritalStatus: '',
    phoneNumber: '',
    emailAddress: '',
    homeAddress: '',

    // Traveling Info
    travelledOutside: '',
    countriesVisited: '',
    purposeOfTravel: '',

    // Donation Info
    reasonsForDonating: '',
    spouseSupport: '',
    previouslyDonated: '',
    lastDonationDate: '',
    donationLocation: '',
    whyStoppedDonating: '',

    // Medical History Questions
    tuberculosis: '',
    hepatitisB: '',
    mastitis: '',
    syphilis: '',
    herpes: '',
    std: '',

    alcohol24h: '',
    smoke: '',
    illegalDrugs: '',
    intravenousDrugs: '',

    vegetarianDiet: '',
    takeMultivitamins: '',
    takeHerbalDrugs: '',

    receivedBlood: '',
    accidentalNeedlePrick: '',
    repeatedTransfusions: '',

    birthControlPills: '',
    breastSurgery: '',
    breastImplant: '',

    tattoos: '',
    multiplePartners: '',
    partnerDiagnosedSti: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitError, setIsSubmitError] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Format phone number to E.164 (e.g. +639123456789)
      let caregiverPhone = formData.phoneNumber.replace(/[^\d+]/g, '');
      if (caregiverPhone.startsWith('0')) {
        caregiverPhone = '+63' + caregiverPhone.slice(1);
      } else if (/^[1-9]/.test(caregiverPhone) && !caregiverPhone.startsWith('+')) {
        caregiverPhone = '+63' + caregiverPhone;
      }

      // 2. Helper to map Yes/No to lowercase yes/no for backend validator
      const mapYesNo = (val: string) => {
        const clean = val.trim().toLowerCase();
        if (clean.startsWith('yes') || clean === 'y') return 'yes';
        if (clean.startsWith('no') || clean === 'n') return 'no';
        return undefined;
      };

      const registrationData = {
        name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}${formData.suffix ? ' ' + formData.suffix : ''}`.trim(),
        email: formData.emailAddress,
        phone: caregiverPhone,
        birth_date: formData.dateOfBirth,
        profile: {
          personal_information: {
            occupation: formData.occupation,
            marital_status: formData.maritalStatus,
            home_address: formData.homeAddress,
          },
          traveling_information: {
            travelled_recently: mapYesNo(formData.travelledOutside) || 'no',
            country_visited: formData.countriesVisited || undefined,
            purpose: formData.purposeOfTravel || undefined,
          },
          donation_information: {
            reason: formData.reasonsForDonating,
            spouse_consent: mapYesNo(formData.spouseSupport),
            previously_donated: mapYesNo(formData.previouslyDonated) || 'no',
            last_donation: formData.lastDonationDate ? formData.lastDonationDate : undefined,
            place_donated: formData.donationLocation || undefined,
            reason_for_stopping: formData.whyStoppedDonating || undefined,
          },
          medical_information: {
            infectious_medical_illness: {
              tuberculosis: mapYesNo(formData.tuberculosis),
              hepatitis_b: mapYesNo(formData.hepatitisB),
              mastitis: mapYesNo(formData.mastitis),
              syphilis: mapYesNo(formData.syphilis),
              herpes: mapYesNo(formData.herpes),
              std: mapYesNo(formData.std),
            },
            substance_user_habits: {
              consumed_alcohol: mapYesNo(formData.alcohol24h),
              smoke: mapYesNo(formData.smoke),
              illegal_drugs: mapYesNo(formData.illegalDrugs),
              intravenous_drug_use: mapYesNo(formData.intravenousDrugs),
            },
            diet_supplement_tracking: {
              vegetarian: mapYesNo(formData.vegetarianDiet),
              multivitamins: mapYesNo(formData.takeMultivitamins),
              herbal_drugs: mapYesNo(formData.takeHerbalDrugs),
            },
            blood_exposure_transfusion: {
              received_blood: mapYesNo(formData.receivedBlood),
              needle_contact: mapYesNo(formData.accidentalNeedlePrick),
              repeated_blood_transfusion: mapYesNo(formData.repeatedTransfusions),
            },
            surgical_specialized_medical_history: {
              hormone_control: mapYesNo(formData.birthControlPills),
              breast_surgery: mapYesNo(formData.breastSurgery),
              breast_implant: mapYesNo(formData.breastImplant),
            },
            exposure_behavior: {
              tattoos: mapYesNo(formData.tattoos),
              polygamy: mapYesNo(formData.multiplePartners),
              std: mapYesNo(formData.partnerDiagnosedSti),
            },
          },
        },
      };

      await api.post('/api/donors/public-register', registrationData);

      setSubmitMessage('Your donor application has been submitted successfully! We will contact you soon.');
      setIsSubmitError(false);

      if (onSubmitSuccess) {
        onSubmitSuccess(formData);
      }
    } catch (error: any) {
      console.error('Error submitting donor application:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while submitting your application. Please try again.';
      setSubmitMessage(errorMessage);
      setIsSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for rendering a medical history row
  const renderMedicalRow = (
    label: string,
    stateKey: keyof typeof formData,
    bgGray = false
  ) => {
    const currentValue = formData[stateKey];
    return (
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-neutral-100 ${
          bgGray ? 'bg-neutral-50/50' : 'bg-white'
        }`}
        key={stateKey}
      >
        <span className="text-neutral-700 font-sans text-sm md:text-base mb-2 sm:mb-0 max-w-2xl">
          {label}
        </span>
        <div className="flex items-center gap-6 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer font-sans text-sm font-medium text-neutral-800">
            <input
              type="radio"
              name={stateKey}
              checked={currentValue === 'Yes'}
              onChange={() => handleRadioChange(stateKey, 'Yes')}
              className="size-4 text-brand-teal focus:ring-brand-teal border-neutral-300"
              data-testid={`${stateKey}-yes`}
            />
            Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-sm font-medium text-neutral-800">
            <input
              type="radio"
              name={stateKey}
              checked={currentValue === 'No'}
              onChange={() => handleRadioChange(stateKey, 'No')}
              className="size-4 text-brand-teal focus:ring-brand-teal border-neutral-300"
              data-testid={`${stateKey}-no`}
            />
            No
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-white text-neutral-900 flex flex-col justify-between overflow-x-hidden">
      {/* Decorative Vector Curve Background */}
      <div 
        className="absolute top-[-270px] left-[-333px] w-[921px] h-[850px] pointer-events-none select-none opacity-95 z-0 hidden md:block"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bg_ellipse.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Floating Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Main Content Form */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="bg-white rounded-[30px] border border-neutral-100 shadow-[0px_10px_40px_rgba(0,0,0,0.06)] p-6 sm:p-10 lg:p-12">
          
          {/* Header */}
          <div className="border-b border-neutral-100 pb-6 mb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-sans font-bold text-neutral-950 uppercase tracking-wide">
              Donor Program
            </h1>
            <p className="text-neutral-500 font-sans text-sm sm:text-base mt-2">
              Please complete all sections of the application form. All information provided will be treated with absolute confidentiality.
            </p>
          </div>

          {submitMessage ? (
            <div className={`border rounded-2xl p-6 text-center animate-in fade-in duration-300 ${
              isSubmitError 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <h2 className={`font-bold text-xl mb-2 font-sans ${
                isSubmitError ? 'text-red-950' : 'text-emerald-950'
              }`}>
                {isSubmitError ? 'Submission Failed' : 'Submission Completed'}
              </h2>
              <p className="font-sans text-sm sm:text-base mb-6">
                {submitMessage}
              </p>
              <button
                onClick={() => setSubmitMessage(null)}
                className={`text-white font-sans font-semibold text-sm px-6 py-2 rounded-full transition-all ${
                  isSubmitError ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-teal hover:bg-brand-teal-dark'
                }`}
              >
                Go Back
              </button>
            </div>
          ) : (
            <>
              {/* Stepper Tabs */}
              <div className="bg-slate-50 border border-neutral-100 rounded-2xl px-6 py-2.5 flex gap-2 overflow-x-auto shrink-0 select-none mb-8">
                {[
                  { tab: 1, label: '1. Personal & Contact' },
                  { tab: 2, label: '2. Travel & Donation' },
                  { tab: 3, label: '3. Medical History' },
                ].map((item) => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => setRegisterTab(item.tab)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${registerTab === item.tab
                      ? 'bg-brand-teal text-white shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
              
               {/* SECTION 1: Personal Information */}
               {registerTab === 1 && (
                 <fieldset className="space-y-6 animate-in fade-in duration-200">
                   <legend className="text-lg sm:text-xl font-sans font-bold text-neutral-950 uppercase tracking-wide border-l-4 border-brand-teal pl-3">
                     Personal Information
                   </legend>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                     {/* First Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="firstName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         First Name
                       </label>
                       <input
                         required
                         type="text"
                         id="firstName"
                         name="firstName"
                         value={formData.firstName}
                         onChange={handleInputChange}
                         placeholder="Juana Josefina Leonora"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Middle Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="middleName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Middle Name
                       </label>
                       <input
                         type="text"
                         id="middleName"
                         name="middleName"
                         value={formData.middleName}
                         onChange={handleInputChange}
                         placeholder="Santos"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Last Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="lastName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Last Name
                       </label>
                       <input
                         required
                         type="text"
                         id="lastName"
                         name="lastName"
                         value={formData.lastName}
                         onChange={handleInputChange}
                         placeholder="Dela Cruz"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Suffix */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="suffix" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Suffix
                       </label>
                       <select
                         id="suffix"
                         name="suffix"
                         value={formData.suffix}
                         onChange={handleInputChange}
                         className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       >
                         <option value="">None</option>
                         <option value="Jr.">Jr.</option>
                         <option value="Sr.">Sr.</option>
                         <option value="II">II</option>
                         <option value="III">III</option>
                       </select>
                     </div>
                   </div>
   
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {/* Date of Birth */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="dateOfBirth" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Date Of Birth
                       </label>
                       <input
                         required
                         type="date"
                         id="dateOfBirth"
                         name="dateOfBirth"
                         value={formData.dateOfBirth}
                         onChange={handleInputChange}
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Occupation */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="occupation" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Occupation
                       </label>
                       <input
                         type="text"
                         id="occupation"
                         name="occupation"
                         value={formData.occupation}
                         onChange={handleInputChange}
                         placeholder="Nurse"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Marital Status */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="maritalStatus" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Marital Status
                       </label>
                       <select
                         id="maritalStatus"
                         name="maritalStatus"
                         value={formData.maritalStatus}
                         onChange={handleInputChange}
                         className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       >
                         <option value="">Choose an option</option>
                         <option value="Single">Single</option>
                         <option value="Married">Married</option>
                         <option value="Separated">Separated</option>
                         <option value="Widowed">Widowed</option>
                       </select>
                     </div>
                     {/* Phone Number */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="phoneNumber" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Phone Number
                       </label>
                       <input
                         required
                         type="tel"
                         id="phoneNumber"
                         name="phoneNumber"
                         value={formData.phoneNumber}
                         onChange={handleInputChange}
                         placeholder="+63 901 123 4567"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                   </div>
   
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Email Address */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="emailAddress" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Email Address
                       </label>
                       <input
                         required
                         type="email"
                         id="emailAddress"
                         name="emailAddress"
                         value={formData.emailAddress}
                         onChange={handleInputChange}
                         placeholder="juanadelacruz@gmail.com"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Home Address */}
                     <div className="lg:col-span-2 flex flex-col gap-1.5">
                       <label htmlFor="homeAddress" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Home Address
                       </label>
                       <input
                         required
                         type="text"
                         id="homeAddress"
                         name="homeAddress"
                         value={formData.homeAddress}
                         onChange={handleInputChange}
                         placeholder="eg. 123 Rizal Ave, Brgy. Bangkal, Makati City"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                   </div>
                 </fieldset>
               )}

              {/* SECTION 2: Traveling Information */}
              {registerTab === 2 && (
                <>
                  <fieldset className="space-y-6">
                    <legend className="text-lg sm:text-xl font-sans font-bold text-neutral-950 uppercase tracking-wide border-l-4 border-brand-teal pl-3">
                      Traveling Information
                    </legend>
    
                    <div className="grid grid-cols-1 gap-6">
                      {/* Travelled outside */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-neutral-700 font-sans text-sm font-semibold">
                          Have you travelled outside the country in the last 5 years?
                        </label>
                        <div className="flex gap-4 mt-1">
                          {['Yes', 'No'].map((choice) => (
                            <label key={choice} className="flex items-center gap-2 font-sans text-sm font-medium text-neutral-800 cursor-pointer">
                              <input
                                type="radio"
                                name="travelledOutside"
                                checked={formData.travelledOutside === choice}
                                onChange={() => handleRadioChange('travelledOutside', choice)}
                                className="size-4 text-brand-teal focus:ring-brand-teal border-neutral-300"
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      </div>

                      {formData.travelledOutside === 'Yes' && (
                        <>
                          {/* Country visited */}
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="countriesVisited" className="text-neutral-700 font-sans text-sm font-semibold">
                              What country have you visited?
                            </label>
                            <input
                              type="text"
                              id="countriesVisited"
                              name="countriesVisited"
                              value={formData.countriesVisited}
                              onChange={handleInputChange}
                              placeholder="List countries visited"
                              className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                            />
                          </div>
                          {/* Purpose of travel */}
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="purposeOfTravel" className="text-neutral-700 font-sans text-sm font-semibold">
                              What were the purpose of your travel?
                            </label>
                            <input
                              type="text"
                              id="purposeOfTravel"
                              name="purposeOfTravel"
                              value={formData.purposeOfTravel}
                              onChange={handleInputChange}
                              placeholder="eg. Vacation, Business, Medical..."
                              className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </fieldset>
    
                  {/* SECTION 3: Donation Information */}
                  <fieldset className="space-y-6">
                    <legend className="text-lg sm:text-xl font-sans font-bold text-neutral-950 uppercase tracking-wide border-l-4 border-brand-teal pl-3">
                      Donation Information
                    </legend>
    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Reasons for donating */}
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label htmlFor="reasonsForDonating" className="text-neutral-700 font-sans text-sm font-semibold">
                          What are your reasons for donating?
                        </label>
                        <input
                          type="text"
                          id="reasonsForDonating"
                          name="reasonsForDonating"
                          value={formData.reasonsForDonating}
                          onChange={handleInputChange}
                          placeholder="Express your motives or reasons"
                          className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                        />
                      </div>
                      {/* Spouse support */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-neutral-700 font-sans text-sm font-semibold">
                          Does your spouse support your decision to donate?
                        </label>
                        <div className="flex flex-wrap gap-4 mt-1">
                          {['Yes', 'No', 'Not Applicable'].map((choice) => (
                            <label key={choice} className="flex items-center gap-2 font-sans text-sm font-medium text-neutral-800 cursor-pointer">
                              <input
                                type="radio"
                                name="spouseSupport"
                                checked={formData.spouseSupport === choice}
                                onChange={() => handleRadioChange('spouseSupport', choice)}
                                className="size-4 text-brand-teal focus:ring-brand-teal border-neutral-300"
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Previously donated */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-neutral-700 font-sans text-sm font-semibold">
                          Have you previously donated milk?
                        </label>
                        <div className="flex gap-4 mt-1">
                          {['Yes', 'No'].map((choice) => (
                            <label key={choice} className="flex items-center gap-2 font-sans text-sm font-medium text-neutral-800 cursor-pointer">
                              <input
                                type="radio"
                                name="previouslyDonated"
                                checked={formData.previouslyDonated === choice}
                                onChange={() => handleRadioChange('previouslyDonated', choice)}
                                className="size-4 text-brand-teal focus:ring-brand-teal border-neutral-300"
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      </div>

                      {formData.previouslyDonated === 'Yes' && (
                        <>
                          {/* Last donation date */}
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lastDonationDate" className="text-neutral-700 font-sans text-sm font-semibold">
                              When was your last donation?
                            </label>
                            <input
                              type="date"
                              id="lastDonationDate"
                              name="lastDonationDate"
                              value={formData.lastDonationDate}
                              onChange={handleInputChange}
                              className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                            />
                          </div>
                          {/* Where did you donate */}
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="donationLocation" className="text-neutral-700 font-sans text-sm font-semibold">
                              Where did you donate?
                            </label>
                            <input
                              type="text"
                              id="donationLocation"
                              name="donationLocation"
                              value={formData.donationLocation}
                              onChange={handleInputChange}
                              placeholder="Specify clinic, center, or bank"
                              className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                            />
                          </div>
                          {/* Why did you stop donating */}
                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label htmlFor="whyStoppedDonating" className="text-neutral-700 font-sans text-sm font-semibold">
                              Why did you stop donating?
                            </label>
                            <input
                              type="text"
                              id="whyStoppedDonating"
                              name="whyStoppedDonating"
                              value={formData.whyStoppedDonating}
                              onChange={handleInputChange}
                              placeholder="Reason for stopping your previous donation"
                              className="border border-neutral-300 rounded-[5px] px-3 py-2.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                            />
                          </div>
                        </>
                      )}
                    </div>
    
                    {/* Form Actions Footer */}
                    <div className="flex justify-between pt-6 border-t border-neutral-100">
                      <div>
                        {registerTab > 1 && (
                          <button
                            key="register-prev-btn"
                            type="button"
                            onClick={() => setRegisterTab((t) => Math.max(1, t - 1))}
                            className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all cursor-pointer"
                          >
                            Previous
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          key="register-next-btn"
                          type="button"
                          onClick={() => setRegisterTab((t) => Math.min(3, t + 1))}
                          className="px-6 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-dark rounded-xl transition-all cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </>
              )}

               {/* SECTION 3: Medical History */}
               {registerTab === 3 && (
                 <div className="space-y-12 animate-in fade-in duration-200">
                   <div className="space-y-6">
                     <h3 className="text-lg sm:text-xl font-sans font-bold text-neutral-950 uppercase tracking-wide border-l-4 border-brand-teal pl-3">
                       Medical History Questionnaire
                     </h3>
                     
                     <div className="border border-neutral-100 rounded-[20px] overflow-hidden shadow-sm">
                       {/* Category 1: Infectious & Medical Illness History */}
                       <div>
                         <div className="bg-neutral-100/70 p-4 font-sans font-bold text-neutral-900 text-sm sm:text-base">
                           Infectious & Medical Illness History
                         </div>
                         <div>
                           {renderMedicalRow('History of Tuberculosis?', 'tuberculosis', false)}
                           {renderMedicalRow('Hepatitis B Carrier?', 'hepatitisB', true)}
                           {renderMedicalRow('Mastitis / Breast inflammation?', 'mastitis', false)}
                           {renderMedicalRow('History of Syphilis?', 'syphilis', true)}
                           {renderMedicalRow('Active Herpes Lesions?', 'herpes', false)}
                           {renderMedicalRow('Sexually Transmitted Disease (STD)?', 'std', true)}
                         </div>
                       </div>
     
                       {/* Category 2: Substance Use & Habits */}
                       <div>
                         <div className="bg-neutral-100/70 p-4 font-sans font-bold text-neutral-900 text-sm sm:text-base">
                           Substance Use & Habits
                         </div>
                         <div>
                           {renderMedicalRow('Consumed alcohol in the past 24 hours?', 'alcohol24h', false)}
                           {renderMedicalRow('Do you smoke?', 'smoke', true)}
                           {renderMedicalRow('Use any illegal/prohibited drugs?', 'illegalDrugs', false)}
                           {renderMedicalRow('Intravenous drug use?', 'intravenousDrugs', true)}
                         </div>
                       </div>
     
                       {/* Category 3: Dietary & Supplement Tracking */}
                       <div>
                         <div className="bg-neutral-100/70 p-4 font-sans font-bold text-neutral-900 text-sm sm:text-base">
                           Dietary & Supplement Tracking
                         </div>
                         <div>
                           {renderMedicalRow('Are you on a vegetarian diet?', 'vegetarianDiet', false)}
                           {renderMedicalRow('Do you take multivitamins?', 'takeMultivitamins', true)}
                           {renderMedicalRow('Do you take herbal drugs or high-dose vitamins?', 'takeHerbalDrugs', false)}
                         </div>
                       </div>
     
                       {/* Category 4: Blood Exposure & Transfusion History */}
                       <div>
                         <div className="bg-neutral-100/70 p-4 font-sans font-bold text-neutral-900 text-sm sm:text-base">
                           Blood Exposure & Transfusion History
                         </div>
                         <div>
                           {renderMedicalRow('Have you received blood or blood products in the past 12 months?', 'receivedBlood', false)}
                           {renderMedicalRow('Have you ever been accidentally pricked by a needle contaminated with blood?', 'accidentalNeedlePrick', true)}
                           {renderMedicalRow('Received repeated blood transfusion?', 'repeatedTransfusions', false)}
                         </div>
                       </div>
     
                       {/* Category 5: Surgical & Specialized Medical History */}
                       <div>
                         <div className="bg-neutral-100/70 p-4 font-sans font-bold text-neutral-900 text-sm sm:text-base">
                           Surgical & Specialized Medical History
                         </div>
                         <div>
                           {renderMedicalRow('Do you take birth control pills or hormone replacement therapy?', 'birthControlPills', false)}
                           {renderMedicalRow('Have you had breast surgery?', 'breastSurgery', true)}
                           {renderMedicalRow('Was a breast implant placed?', 'breastImplant', false)}
                         </div>
                       </div>
     
                       {/* Category 6: High-Risk Exposure & Behavioral Factors */}
                       <div>
                         <div className="bg-neutral-100/70 p-4 font-sans font-bold text-neutral-900 text-sm sm:text-base">
                           High-Risk Exposure & Behavioral Factors
                         </div>
                         <div>
                           {renderMedicalRow('Do you have any tattoos on any part of your body?', 'tattoos', false)}
                           {renderMedicalRow('Have you had sexual contact with more than one partner?', 'multiplePartners', true)}
                           {renderMedicalRow('Sexual contact with a partner diagnosed with STI/AIDS/HIV?', 'partnerDiagnosedSti', false)}
                         </div>
                       </div>
     
                     </div>
     
                     <div className="text-neutral-500 font-sans text-sm italic mt-4 text-center sm:text-left">
                       Note: A medical professional will follow up to review these details in person. Donors must NOT use illegal drugs, smoke, or consume excess alcohol.
                     </div>
                   </div>
     
                   {/* Form Actions Footer */}
                   <div className="flex justify-between pt-6 border-t border-neutral-100">
                     <div>
                       {registerTab > 1 && (
                         <button
                           key="register-prev-btn"
                           type="button"
                           onClick={() => setRegisterTab((t) => Math.max(1, t - 1))}
                           className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all cursor-pointer"
                         >
                           Previous
                         </button>
                       )}
                     </div>
     
                     <div className="flex gap-3">
                       <button
                         key="register-submit-btn"
                         type="submit"
                         disabled={isSubmitting}
                         className="bg-brand-teal hover:bg-brand-teal-dark disabled:bg-neutral-300 text-white font-sans font-bold text-base px-10 py-3 rounded-[10px] transition-all duration-200 shadow-[0_4px_14_rgba(0,175,185,0.25)] hover:shadow-[0_4px_20px_rgba(0,175,185,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
                       >
                         {isSubmitting ? 'Submitting...' : 'Submit Application'}
                       </button>
                     </div>
                   </div>
                 </div>
               )}

             </form>
           </>
          )}

        </div>
      </main>

      {/* Footer copyright */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
