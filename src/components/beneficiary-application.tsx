'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle, Trash2 } from 'lucide-react';
import Navbar from './ui/navbar';
import Footer from './ui/footer';
import {api} from '../utils/api';

export interface BeneficiaryApplicationProps {
  onSubmitSuccess?: (data: any) => void;
}


export default function BeneficiaryApplication({ onSubmitSuccess }: BeneficiaryApplicationProps) {
  // Active Tab State
  const [registerTab, setRegisterTab] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    // Infant info
    infantFirstName: '',
    infantMiddleName: '',
    infantLastName: '',
    infantSuffix: '',
    infantDateOfBirth: '',
    infantWeight: '',
    feedingRequirement: '',

    // Parent info
    parentFirstName: '',
    parentMiddleName: '',
    parentLastName: '',
    parentSuffix: '',
    parentHomeAddress: '',
    parentPhoneNumber: '',
    parentEmailAddress: '',
  });

  // Files State
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [clinicalAbstractFile, setClinicalAbstractFile] = useState<File | null>(null);

  // Drag states
  const [dragPrescription, setDragPrescription] = useState(false);
  const [dragAbstract, setDragAbstract] = useState(false);

  // Input refs
  const prescriptionRef = useRef<HTMLInputElement>(null);
  const abstractRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'prescription' | 'abstract') => {
    const file = e.target.files?.[0] || null;
    if (fileType === 'prescription') {
      setPrescriptionFile(file);
    } else {
      setClinicalAbstractFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent, fileType: 'prescription' | 'abstract') => {
    e.preventDefault();
    if (fileType === 'prescription') {
      setDragPrescription(true);
    } else {
      setDragAbstract(true);
    }
  };

  const handleDragLeave = (fileType: 'prescription' | 'abstract') => {
    if (fileType === 'prescription') {
      setDragPrescription(false);
    } else {
      setDragAbstract(false);
    }
  };

  const handleDrop = (e: React.DragEvent, fileType: 'prescription' | 'abstract') => {
    e.preventDefault();
    if (fileType === 'prescription') {
      setDragPrescription(false);
      const file = e.dataTransfer.files?.[0] || null;
      setPrescriptionFile(file);
    } else {
      setDragAbstract(false);
      const file = e.dataTransfer.files?.[0] || null;
      setClinicalAbstractFile(file);
    }
  };

  const removeFile = (fileType: 'prescription' | 'abstract') => {
    if (fileType === 'prescription') {
      setPrescriptionFile(null);
      if (prescriptionRef.current) prescriptionRef.current.value = '';
    } else {
      setClinicalAbstractFile(null);
      if (abstractRef.current) abstractRef.current.value = '';
    }
  };

  const [isSubmitError, setIsSubmitError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Format phone number to E.164 (e.g. +639171234567)
      let caregiverPhone = formData.parentPhoneNumber.replace(/[^\d+]/g, '');
      if (caregiverPhone.startsWith('0')) {
        caregiverPhone = '+63' + caregiverPhone.slice(1);
      } else if (/^[1-9]/.test(caregiverPhone) && !caregiverPhone.startsWith('+')) {
        caregiverPhone = '+63' + caregiverPhone;
      }

      // 2. Parse weight into kilograms.
      // If user inputs a value > 30, we assume it's in grams and divide by 1000.
      const weightVal = parseFloat(formData.infantWeight.replace(/[^\d.]/g, ''));
      const weight_kg = isNaN(weightVal) ? 0 : (weightVal > 30 ? parseFloat((weightVal / 1000).toFixed(2)) : weightVal);

      // 3. Parse feeding requirement to a numeric ml value
      const feedingVal = parseFloat(formData.feedingRequirement.replace(/[^\d.]/g, ''));
      const feeding_requirement_ml = isNaN(feedingVal) ? 0 : feedingVal;

      const registrationData = {
        name: `${formData.infantFirstName} ${formData.infantMiddleName ? formData.infantMiddleName + ' ' : ''}${formData.infantLastName}${formData.infantSuffix ? ' ' + formData.infantSuffix : ''}`.trim(),
        caregiver: `${formData.parentFirstName} ${formData.parentMiddleName ? formData.parentMiddleName + ' ' : ''}${formData.parentLastName}${formData.parentSuffix ? ' ' + formData.parentSuffix : ''}`.trim(),
        caregiver_email: formData.parentEmailAddress,
        caregiver_phone: caregiverPhone,
        birth_date: formData.infantDateOfBirth,
        weight_kg,
        feeding_requirement_ml,
        profile: {}, // Initialize to avoid backend TypeError when setting uploaded file URLs
      };

      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify(registrationData));

      if (prescriptionFile) {
        formDataToSend.append('prescription_details', prescriptionFile);
      }
      if (clinicalAbstractFile) {
        formDataToSend.append('clinical_abstract', clinicalAbstractFile);
      }

      const response = await api.post('/api/beneficiaries/public-register', formDataToSend);
      
      setSubmitMessage('Your beneficiary application has been submitted successfully! We will review it shortly.');
      setIsSubmitError(false);

      if (onSubmitSuccess) {
        onSubmitSuccess({
          ...formData,
          prescriptionFileName: prescriptionFile?.name || '',
          clinicalAbstractFileName: clinicalAbstractFile?.name || '',
        });
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while submitting your application. Please try again.';
      setSubmitMessage(errorMessage);
      setIsSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to render file upload zone
  const renderUploadZone = (
    fileType: 'prescription' | 'abstract',
    file: File | null,
    dragActive: boolean,
    inputRef: React.RefObject<HTMLInputElement | null>,
    testId: string
  ) => {
    const title = fileType === 'prescription' ? 'Prescription Details' : 'Clinical Abstract';
    const label = fileType === 'prescription' ? 'prescription' : 'clinical abstract';

    return (
      <div className="flex flex-col gap-3">
        <label className="text-neutral-700 font-sans text-sm font-semibold">
          {title} <span className="text-red-500">*</span>
        </label>

        {file ? (
          <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50/30 rounded-2xl p-4 sm:p-5 transition-all animate-in fade-in duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shrink-0">
                <FileText className="size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-neutral-900 font-sans font-semibold text-sm truncate" data-testid={`${testId}-name`}>
                  {file.name}
                </p>
                <p className="text-neutral-500 font-sans text-xs">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFile(fileType)}
              className="text-neutral-400 hover:text-red-500 p-2 hover:bg-neutral-100 rounded-full transition-colors shrink-0"
              aria-label={`Remove ${label}`}
              data-testid={`${testId}-remove-btn`}
            >
              <Trash2 className="size-5" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => handleDragOver(e, fileType)}
            onDragLeave={() => handleDragLeave(fileType)}
            onDrop={(e) => handleDrop(e, fileType)}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer group ${
              dragActive
                ? 'border-brand-teal bg-brand-teal/5'
                : 'border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 hover:border-brand-teal'
            }`}
            data-testid={`${testId}-zone`}
          >
            <input
              required
              type="file"
              ref={inputRef}
              onChange={(e) => handleFileChange(e, fileType)}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              data-testid={`${testId}-input`}
            />
            <div className="bg-white group-hover:scale-105 transition-transform duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-3.5 rounded-2xl text-neutral-400 group-hover:text-brand-teal mb-4 border border-neutral-100 shrink-0">
              <UploadCloud className="size-7" />
            </div>
            <p className="text-neutral-900 font-sans font-semibold text-sm mb-1">
              Click to upload or drag & drop
            </p>
            <p className="text-neutral-400 font-sans text-xs">
              Supported formats: PDF, PNG, JPG, JPEG (Max. 5MB)
            </p>
          </div>
        )}
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
              Beneficiary Program
            </h1>
            <p className="text-neutral-500 font-sans text-sm sm:text-base mt-2">
              Please fill out the details about the infant and parent/guardian. You are required to upload a verified doctor's prescription and clinical abstract.
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
                  { tab: 1, label: "1. Infant's Details" },
                  { tab: 2, label: '2. Parent Details' },
                  { tab: 3, label: '3. Clinical Documents' },
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
              
               {/* SECTION 1: Infant's Information */}
               {registerTab === 1 && (
                 <fieldset className="space-y-6 animate-in fade-in duration-200">
                   <legend className="text-lg sm:text-xl font-sans font-bold text-neutral-950 uppercase tracking-wide border-l-4 border-brand-teal pl-3">
                     Infant’s Information
                   </legend>
   
                   <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                     {/* Infant First Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="infantFirstName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         First Name
                       </label>
                       <input
                         required
                         type="text"
                         id="infantFirstName"
                         name="infantFirstName"
                         value={formData.infantFirstName}
                         onChange={handleInputChange}
                         placeholder="First Name"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Infant Middle Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="infantMiddleName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Middle Name
                       </label>
                       <input
                         type="text"
                         id="infantMiddleName"
                         name="infantMiddleName"
                         value={formData.infantMiddleName}
                         onChange={handleInputChange}
                         placeholder="Middle Name"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Infant Last Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="infantLastName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Last Name
                       </label>
                       <input
                         required
                         type="text"
                         id="infantLastName"
                         name="infantLastName"
                         value={formData.infantLastName}
                         onChange={handleInputChange}
                         placeholder="Last Name"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Infant Suffix */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="infantSuffix" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Suffix
                       </label>
                       <select
                         id="infantSuffix"
                         name="infantSuffix"
                         value={formData.infantSuffix}
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
   
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     {/* Date of Birth */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="infantDateOfBirth" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Date Of Birth
                       </label>
                       <input
                         required
                         type="date"
                         id="infantDateOfBirth"
                         name="infantDateOfBirth"
                         value={formData.infantDateOfBirth}
                         onChange={handleInputChange}
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Weight */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="infantWeight" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Weight (g)
                       </label>
                       <input
                         required
                         type="text"
                         id="infantWeight"
                         name="infantWeight"
                         value={formData.infantWeight}
                         onChange={handleInputChange}
                         placeholder="eg. 2500"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Feeding Requirement */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="feedingRequirement" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Feeding Requirement
                       </label>
                       <input
                         required
                         type="text"
                         id="feedingRequirement"
                         name="feedingRequirement"
                         value={formData.feedingRequirement}
                         onChange={handleInputChange}
                         placeholder="eg. 150ml/day"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                   </div>
                   
                   {/* Form Actions Footer */}
                   <div className="flex justify-between pt-6 border-t border-neutral-100">
                     <div />
                     <div className="flex gap-3">
                       <button
                         key="register-next-btn"
                         type="button"
                         onClick={() => setRegisterTab(2)}
                         className="px-6 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-dark rounded-xl transition-all cursor-pointer"
                       >
                         Next
                       </button>
                     </div>
                   </div>
                 </fieldset>
               )}

               {/* SECTION 2: Parent/Guardian Information */}
               {registerTab === 2 && (
                 <fieldset className="space-y-6 animate-in fade-in duration-200">
                   <legend className="text-lg sm:text-xl font-sans font-bold text-neutral-950 uppercase tracking-wide border-l-4 border-brand-teal pl-3">
                     Parent/Guardian Information
                   </legend>
   
                   <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                     {/* Parent First Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="parentFirstName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         First Name
                       </label>
                       <input
                         required
                         type="text"
                         id="parentFirstName"
                         name="parentFirstName"
                         value={formData.parentFirstName}
                         onChange={handleInputChange}
                         placeholder="First Name"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Parent Middle Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="parentMiddleName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Middle Name
                       </label>
                       <input
                         type="text"
                         id="parentMiddleName"
                         name="parentMiddleName"
                         value={formData.parentMiddleName}
                         onChange={handleInputChange}
                         placeholder="Middle Name"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Parent Last Name */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="parentLastName" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Last Name
                       </label>
                       <input
                         required
                         type="text"
                         id="parentLastName"
                         name="parentLastName"
                         value={formData.parentLastName}
                         onChange={handleInputChange}
                         placeholder="Last Name"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Parent Suffix */}
                     <div className="sm:col-span-3 flex flex-col gap-1.5">
                       <label htmlFor="parentSuffix" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Suffix
                       </label>
                       <select
                         id="parentSuffix"
                         name="parentSuffix"
                         value={formData.parentSuffix}
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
   
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     {/* Home Address */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="parentHomeAddress" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Home Address
                       </label>
                       <input
                         required
                         type="text"
                         id="parentHomeAddress"
                         name="parentHomeAddress"
                         value={formData.parentHomeAddress}
                         onChange={handleInputChange}
                         placeholder="Home Address"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Phone Number */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="parentPhoneNumber" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Phone Number
                       </label>
                       <input
                         required
                         type="tel"
                         id="parentPhoneNumber"
                         name="parentPhoneNumber"
                         value={formData.parentPhoneNumber}
                         onChange={handleInputChange}
                         placeholder="Phone Number"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                     {/* Email */}
                     <div className="flex flex-col gap-1.5">
                       <label htmlFor="parentEmailAddress" className="text-neutral-500 font-sans text-xs font-bold uppercase">
                         Email
                       </label>
                       <input
                         required
                         type="email"
                         id="parentEmailAddress"
                         name="parentEmailAddress"
                         value={formData.parentEmailAddress}
                         onChange={handleInputChange}
                         placeholder="Email"
                         className="border border-neutral-300 rounded-[5px] px-3 py-2 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal"
                       />
                     </div>
                   </div>
                   
                   {/* Form Actions Footer */}
                   <div className="flex justify-between pt-6 border-t border-neutral-100">
                     <div>
                       <button
                         key="register-prev-btn"
                         type="button"
                         onClick={() => setRegisterTab(1)}
                         className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all cursor-pointer"
                       >
                         Previous
                       </button>
                     </div>
                     <div className="flex gap-3">
                       <button
                         key="register-next-btn"
                         type="button"
                         onClick={() => setRegisterTab(3)}
                         className="px-6 py-2.5 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal-dark rounded-xl transition-all cursor-pointer"
                       >
                         Next
                       </button>
                     </div>
                   </div>
                 </fieldset>
               )}

               {/* SECTIONS 3 & 4: Prescription & Clinical Abstract File Uploads */}
               {registerTab === 3 && (
                 <div className="space-y-12 animate-in fade-in duration-200">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {renderUploadZone('prescription', prescriptionFile, dragPrescription, prescriptionRef, 'prescription')}
                     {renderUploadZone('abstract', clinicalAbstractFile, dragAbstract, abstractRef, 'abstract')}
                   </div>
   
                   {/* Form Actions Footer */}
                   <div className="flex justify-between pt-6 border-t border-neutral-100">
                     <div>
                       <button
                         key="register-prev-btn"
                         type="button"
                         onClick={() => setRegisterTab(2)}
                         className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all cursor-pointer"
                       >
                         Previous
                       </button>
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
