import { useState } from 'react';
import type { ApplicationRequest } from '../types';

export interface FormErrors {
  company?: string;
  role?: string;
  status?: string;
}

const defaultValues: ApplicationRequest = {
  company: '',
  role: '',
  status: 'APPLIED',
  jobDescriptionText: '',
  notes: '',
  appliedDate: '',
};

export function useApplicationForm(initial?: ApplicationRequest) {
  const [form, setForm] = useState<ApplicationRequest>(initial ?? defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field as soon as the user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.company.trim()) newErrors.company = 'Company name is required';
    if (!form.role.trim())    newErrors.role    = 'Role is required';
    if (!form.status)         newErrors.status  = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setForm(defaultValues);
    setErrors({});
  };

  const populateForm = (data: ApplicationRequest) => {
    setForm(data);
  };

  return { form, errors, handleChange, validate, reset, populateForm };
}