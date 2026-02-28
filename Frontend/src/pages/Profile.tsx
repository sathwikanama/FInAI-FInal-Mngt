import React, { useState, useEffect } from "react";
import { UserCircleIcon, PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  occupation: string;
}

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    occupation: ""
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  // ✅ FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5001/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.success && data.data) {
          setProfile(data.data);
          setEditedProfile(data.data);

          // Save globally
          localStorage.setItem("profile", JSON.stringify(data.data));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // ✅ SAVE PROFILE
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5001/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editedProfile)
      });

      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
        setEditedProfile(data.data);
        setIsEditing(false);

        // ⭐ update everywhere instantly
        localStorage.setItem("profile", JSON.stringify(data.data));

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.name = data.data.full_name;
        localStorage.setItem("user", JSON.stringify(storedUser));

        // ⭐ notify Navbar + Sidebar
        window.dispatchEvent(new Event("profileUpdated"));

        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600">View and manage your account details</p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <UserCircleIcon className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      {/* CARD */}
      <div className="card">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">User Information</h2>

          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* NAME */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Full Name</label>
            <input
              value={isEditing ? editedProfile.full_name : profile.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              disabled={!isEditing}
              className="input-field w-full"
            />
          </div>

          {/* EMAIL */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Email</label>
            <input
              value={
                profile.email ||
                JSON.parse(localStorage.getItem("user") || "{}")?.email ||
                ""
              }
              disabled
              className="input-field w-full bg-gray-50"
            />
          </div>

          {/* PHONE */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Phone</label>
            <input
              value={isEditing ? editedProfile.phone : profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={!isEditing}
              className="input-field w-full"
            />
          </div>

          {/* COUNTRY */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Country</label>
            <input
              value={isEditing ? editedProfile.country : profile.country}
              onChange={(e) => handleChange("country", e.target.value)}
              disabled={!isEditing}
              className="input-field w-full"
            />
          </div>

          {/* CITY */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">City</label>
            <input
              value={isEditing ? editedProfile.city : profile.city}
              onChange={(e) => handleChange("city", e.target.value)}
              disabled={!isEditing}
              className="input-field w-full"
            />
          </div>

          {/* OCCUPATION */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Occupation</label>
            <input
              value={isEditing ? editedProfile.occupation : profile.occupation}
              onChange={(e) => handleChange("occupation", e.target.value)}
              disabled={!isEditing}
              className="input-field w-full"
            />
          </div>

        </div>

        {/* ACTION BUTTONS */}
        {isEditing && (
          <div className="mt-8 pt-6 border-t flex gap-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </button>

            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;