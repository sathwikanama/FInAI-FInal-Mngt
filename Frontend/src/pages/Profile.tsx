import React, { useState, useEffect } from 'react';
import { UserCircleIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  studentId: string;
  institution: string;
  course: string;
  year: string;
}

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
    institution: '',
    course: '',
    year: ''
  });

  // Load user data from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfile({
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        studentId: user.studentId || '',
        institution: user.institution || '',
        course: user.course || '',
        year: user.year || ''
      });
    }
  }, []);

  const [editedProfile, setEditedProfile] = useState<UserProfile>({ ...profile });

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // Send PUT request to backend API
      const response = await fetch('http://localhost:5001/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editedProfile.fullName,
          email: editedProfile.email,
          phone: editedProfile.phone,
          studentId: editedProfile.studentId,
          institution: editedProfile.institution,
          course: editedProfile.course,
          year: editedProfile.year
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update localStorage with new user data
        const updatedUser = {
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          name: editedProfile.fullName,
          email: editedProfile.email,
          phone: editedProfile.phone,
          studentId: editedProfile.studentId,
          institution: editedProfile.institution,
          course: editedProfile.course,
          year: editedProfile.year
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setProfile({ ...editedProfile });
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600">View and manage your account details</p>
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <UserCircleIcon className="h-6 w-6 text-primary-600" />
        </div>
      </div>

      {/* User Information Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={isEditing ? editedProfile.fullName : profile.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={isEditing ? editedProfile.email : profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={isEditing ? editedProfile.phone : profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student ID
            </label>
            <input
              type="text"
              value={isEditing ? editedProfile.studentId : profile.studentId}
              onChange={(e) => handleChange('studentId', e.target.value)}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution
            </label>
            <input
              type="text"
              value={isEditing ? editedProfile.institution : profile.institution}
              onChange={(e) => handleChange('institution', e.target.value)}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <input
              type="text"
              value={isEditing ? editedProfile.course : profile.course}
              onChange={(e) => handleChange('course', e.target.value)}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={isEditing ? editedProfile.year : profile.year}
              onChange={(e) => handleChange('year', e.target.value)}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            >
              <option>First Year</option>
              <option>Second Year</option>
              <option>Third Year</option>
              <option>Final Year</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
          </div>
        )}

        {!isEditing && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
