// app/(main)/contact/page.tsx
'use client';

import { useState } from 'react';
import TransitionLayout from '../../components/TransitionLayout';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    console.log('Submitting form...');
    
    try {
      // Send the form data to our API endpoint
      const response = await fetch ('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
        
      })
      console.log('Response received:', response);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send your message.');
      }

      // Reset form and show success message
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Failed to send your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<TransitionLayout>
    <div className="container mx-auto m-20 mb-30 p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-10 text-center">Nous contacter</h1>
      
      {submitSuccess && (
        <div className="border alert-validation px-4 py-3 rounded mb-6">
         Votre message a été envoyé avec succès. Nous vous répondrons dès que possible.
        </div>
      )}
      
      {submitError && (
        <div className="border alert-error px-4 py-3 rounded mb-6">
          {submitError}
        </div>
      )}
      
      <div className="bg-greenwhite shadow-2xl rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-bold mb-2">
              Nom
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="shadow-sm inputfocus appearance-none input rounded w-full py-2 px-3 leading-tight"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="shadow-sm appearance-none input rounded w-full py-2 px-3 leading-tight inputfocus"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-bold mb-2">
              Objet
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="shadow-sm appearance-none input rounded w-full py-2 px-3 leading-tight inputfocus"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-bold mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="shadow-sm appearance-none input inputfocus rounded w-full py-2 px-3 leading-tight"
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-darkgreenbutton bg-darkgreenbutton-hover font-bold py-2 px-6 rounded shadow-md w-full md:w-auto"
            >
              {isSubmitting ? "En cours d'envoi" : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </TransitionLayout>
  );
}