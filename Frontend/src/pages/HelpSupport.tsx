import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  BookOpenIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const HelpSupport: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const faqs: FAQ[] = [
    {
      id: 1,
      question: 'How do I add an expense?',
      answer: 'Go to the dashboard and use the Add Expense feature. You can enter the amount, category, description, and date. The expense will be automatically added to your financial records.'
    },
    {
      id: 2,
      question: 'What are anomaly alerts?',
      answer: 'The system detects unusual spending patterns using AI. When your spending in a category suddenly increases or decreases significantly compared to your normal patterns, you\'ll receive an anomaly alert to help you stay aware of potential issues.'
    },
    {
      id: 3,
      question: 'How do predictions work?',
      answer: 'The app analyzes past spending data to predict future spending trends. Using machine learning algorithms, it forecasts your likely expenses for the upcoming month based on your historical patterns, helping you budget better.'
    }
  ];

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally send the data to your backend
    console.log('Contact form submitted:', contactForm);
    setFormSubmitted(true);
    setContactForm({ name: '', email: '', message: '' });
    
    // Reset success message after 5 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Help & Support</h1>
          <p className="text-gray-600">Find answers to common questions or contact support</p>
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <QuestionMarkCircleIcon className="h-6 w-6 text-primary-600" />
        </div>
      </div>

      {/* Section 1: FAQ */}
      <div className="card">
        <div className="flex items-center mb-6">
          <QuestionMarkCircleIcon className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{faq.question}</span>
                {expandedFAQ === faq.id ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: App Guide */}
      <div className="card">
        <div className="flex items-center mb-6">
          <BookOpenIcon className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">App Guide</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Expense Tracking</h3>
            <p className="text-gray-600 text-sm">
              Easily add and categorize your expenses. Track where your money goes with detailed transaction history and category-wise spending analysis.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">AI Spending Prediction</h3>
            <p className="text-gray-600 text-sm">
              Get intelligent predictions about your future spending based on historical data. Plan your budget better with AI-powered insights.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Anomaly Detection</h3>
            <p className="text-gray-600 text-sm">
              Receive alerts for unusual spending patterns. Our AI system helps you identify potential fraud or budget issues in real-time.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Weekly Financial Reports</h3>
            <p className="text-gray-600 text-sm">
              Get comprehensive weekly reports on your financial health. Track income, expenses, savings, and spending trends over time.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Contact Support Form */}
      <div className="card">
        <div className="flex items-center mb-6">
          <EnvelopeIcon className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Contact Support</h2>
        </div>
        
        {formSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Message Sent Successfully!</h3>
            <p className="text-green-700">Your message has been sent successfully. Our support team will get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                required
                rows={6}
                className="input-field resize-none"
                placeholder="Describe your issue or question in detail..."
              />
            </div>
            
            <button
              type="submit"
              className="btn-primary"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HelpSupport;
