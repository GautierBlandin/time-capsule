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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">
        Time Capsules
      </h1>

      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <p className="text-blue-800">
          A time capsule is a message you can send to the future. Write a note
          to your future self, a friend, or a loved one, and we'll deliver it at
          the exact date and time you specify. It's like sending a letter
          through time!
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="message"
            className="block mb-2 font-medium text-gray-700"
          >
            What message would you like to send to the future?
          </label>
          <textarea
            id="message"
            {...register('message', { required: 'Your message is required' })}
            className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300"
            rows={4}
          />
          {errors.message && (
            <span className="text-red-500 text-sm">
              {errors.message.message}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="recipientEmail"
            className="block mb-2 font-medium text-gray-700"
          >
            Who should receive this message? (Email address)
          </label>
          <input
            type="email"
            id="recipientEmail"
            {...register('recipientEmail', {
              required: 'Recipient email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Please enter a valid email address',
              },
            })}
            className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300"
          />
          {errors.recipientEmail && (
            <span className="text-red-500 text-sm">
              {errors.recipientEmail.message}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="scheduledDate"
            className="block mb-2 font-medium text-gray-700"
          >
            When do you want your time capsule to be delivered?
          </label>
          <input
            type="datetime-local"
            id="scheduledDate"
            {...register('scheduledDate', {
              required: 'Delivery date and time are required',
            })}
            className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300"
          />
          {errors.scheduledDate && (
            <span className="text-red-500 text-sm">
              {errors.scheduledDate.message}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="senderName"
            className="block mb-2 font-medium text-gray-700"
          >
            Your name (as it will appear to the recipient)
          </label>
          <input
            type="text"
            id="senderName"
            {...register('senderName', { required: 'Your name is required' })}
            className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300"
          />
          {errors.senderName && (
            <span className="text-red-500 text-sm">
              {errors.senderName.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition duration-300"
        >
          Send My Time Capsule
        </button>
      </form>

      {submitStatus === 'success' && (
        <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-md">
          Your time capsule has been successfully scheduled! It will be
          delivered at the specified time.
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md">
          An error occurred while scheduling your time capsule. Please try again
          later.
        </div>
      )}
    </div>
  );
}

export default App;
