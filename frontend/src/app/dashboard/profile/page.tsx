"use client";

import {
  Button,
  Loader,
  TextInput,
  Divider,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";

import { DashboardNavBar } from "@/components/DashboardNavBar";
import { useAuth } from "@/context/AuthContext";

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

const API_BASE = "/api";

function InfoRow({ label, value, isEditing, onChange }: InfoRowProps) {
  return (
    <div className="flex items-center py-2">
      <div className="font-semibold w-40 text-gray-700">{label}:</div>
      <div className="flex-1">
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={!isEditing}
          className="max-w-xl"
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
  const { user } = useAuth(); // { clinician_id, email, name }
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ClinicianProfile>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialty: "",
  });
  const [backupProfile, setBackupProfile] = useState<ClinicianProfile | null>(
    null
  );

  const updateField = (field: keyof ClinicianProfile) => (value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // Load clinician profile from backend
  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/clinician/${user.clinician_id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        throw new Error(json.message || "Failed to load profile.");
      }

      const data = json.data as ClinicianProfile;
      setProfile({
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        specialty: data.specialty ?? "",
      });
      setBackupProfile(data);
    } catch (err) {
      console.error("Error fetching clinician profile:", err);
      notifications.show({
        title: "Error",
        message: "Failed to load clinician profile.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleEdit = () => {
    setBackupProfile(profile);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;

    const sanitizedPhone = profile.phone.replace(/\D/g, "");

    if (!sanitizedPhone) {
      notifications.show({
        title: "Invalid phone",
        message: "Phone numbers must contain digits only.",
        color: "red",
      });
      return;
    }

    const payload = { ...profile, phone: sanitizedPhone };

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/clinician/${user.clinician_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        throw new Error(json.message || "Failed to update profile.");
      }

      notifications.show({
        title: "Profile Updated",
        message: "Your profile details have been saved successfully.",
        color: "green",
      });

      setProfile(payload);
      setBackupProfile(payload);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      notifications.show({
        title: "Update Failed",
        message:
          err instanceof Error ? err.message : "Could not save profile.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (backupProfile) {
      setProfile(backupProfile);
    }
    setIsEditing(false);
  };

  return (
    <div className="h-screen flex overflow-hidden">
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
            <h2 className="text-3xl font-bold mb-4">Personal Information</h2>
            <Divider className="my-4" />
            <div className="bg-slate-50 p-6 rounded-xl border border-transparent shadow-md relative">
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
