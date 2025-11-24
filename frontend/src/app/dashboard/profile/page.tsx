"use client";

import { Button, Loader, TextInput, Divider } from "@mantine/core";
import { useState } from "react";

import { DashboardNavBar } from "@/components/DashboardNavBar";

interface ClinicianProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialty: string;
}

interface InfoRowProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

const initialProfile: ClinicianProfile = {
  first_name: "John",
  last_name: "Smith",
  email: "john.smith@example.com",
  phone: "0412356789",
  specialty: "Cardiologist",
};

function InfoRow({ label, value, isEditing, onChange }: InfoRowProps) {
  return (
    <div className="flex items-center py-2">
      <div className="font-semibold w-40 text-gray-700">{label}:</div>
      <div className="flex-1">
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={!isEditing}
          className="max-w-xl "
          styles={{
            input: {
              backgroundColor: isEditing ? "white" : "#f8f9fa",
              color: "#1f2937", // gray-800
              cursor: isEditing ? "text" : "default",
            },
          }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [backupProfile, setBackupProfile] = useState(initialProfile);

  const updateField = (field: keyof ClinicianProfile) => (value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setBackupProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    // API call to save changes would go here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfile(backupProfile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col px-40 py-25 overflow-y-auto">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold ">Clinician Profile</h1>
        </div>

        {/* Clinician Details */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="xl" />
          </div>
        ) : (
          <section>
            <h2 className="text-3xl font-bold mb-4"> Personal Information </h2>
            <Divider className="my-4" />
            <div className="bg-gray-50 p-6 rounded-xl border border-transparent shadow-md relative">
              <div className="space-y-2">
                <InfoRow
                  label="First Name"
                  value={profile.first_name}
                  isEditing={isEditing}
                  onChange={updateField("first_name")}
                />
                <InfoRow
                  label="Last Name"
                  value={profile.last_name}
                  isEditing={isEditing}
                  onChange={updateField("last_name")}
                />
                <InfoRow
                  label="Email"
                  value={profile.email}
                  isEditing={isEditing}
                  onChange={updateField("email")}
                />
                <InfoRow
                  label="Specialty"
                  value={profile.specialty}
                  isEditing={isEditing}
                  onChange={updateField("specialty")}
                />
                <InfoRow
                  label="Phone"
                  value={profile.phone}
                  isEditing={isEditing}
                  onChange={updateField("phone")}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {isEditing && (
                  <Button onClick={handleCancel} variant="default">
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={isEditing ? handleSave : handleEdit}
                  color={isEditing ? "green" : "primary"}
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
