import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface FormData {
  message: string;
  recipientEmail: string;
  scheduledDate: string;
  senderName: string;
}

export function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const onSubmit = async (data: FormData) => {
    try {
      const response = await axios.post('./api/timecapsule', {
        message: data.message,
        recipientEmail: data.recipientEmail,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        senderName: data.senderName,
      });

      if (response.status === 201) {
        setSubmitStatus('success');
        reset(); // Clear the form fields
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Time Capsule Messages</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="message" className="block mb-1">
            Message:
          </label>
          <textarea
            id="message"
            {...register('message', { required: 'Message is required' })}
            className="w-full p-2 border rounded"
          />
          {errors.message && (
            <span className="text-red-500">{errors.message.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="recipientEmail" className="block mb-1">
            Recipient Email:
          </label>
          <input
            type="email"
            id="recipientEmail"
            {...register('recipientEmail', {
              required: 'Email is required',
              pattern: /^\S+@\S+$/i,
            })}
            className="w-full p-2 border rounded"
          />
          {errors.recipientEmail && (
            <span className="text-red-500">
              {errors.recipientEmail.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="scheduledDate" className="block mb-1">
            Scheduled Date and Time:
          </label>
          <input
            type="datetime-local"
            id="scheduledDate"
            {...register('scheduledDate', {
              required: 'Scheduled date is required',
            })}
            className="w-full p-2 border rounded"
          />
          {errors.scheduledDate && (
            <span className="text-red-500">{errors.scheduledDate.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="senderName" className="block mb-1">
            Sender Name:
          </label>
          <input
            type="text"
            id="senderName"
            {...register('senderName', { required: 'Sender name is required' })}
            className="w-full p-2 border rounded"
          />
          {errors.senderName && (
            <span className="text-red-500">{errors.senderName.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Submit Time Capsule
        </button>
      </form>

      {submitStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          Your time capsule has been successfully scheduled!
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          An error occurred while scheduling your time capsule. Please try
          again.
        </div>
      )}
    </div>
  );
}

export default App;
