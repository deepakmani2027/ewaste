"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  FileCheck2
} from "lucide-react";
import { VendorSidebar } from "@/components/vendor-sidebar";
import type { Vendor } from "@/lib/types";
import DashboardHeader from "@/components/dashboard-header";
import DashboardTabNav2 from "@/components/dashboard-tab-nav2";

export default function VendorProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editForm, setEditForm] = useState({ name: "", contact: "" });

  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        if (!user) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        // Simulate API call
        setTimeout(() => {
          const fakeVendor: Vendor = {
            id: user?._id || "",
            name: "ABC Vendor",
            contact: "9876543210"
          };
          setVendor(fakeVendor);
          setEditForm({ name: fakeVendor.name, contact: fakeVendor.contact });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to fetch vendor profile.");
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchVendorProfile();
    }
  }, [isAuthenticated, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsUploading(true);

      // Simulate upload
      setTimeout(() => {
        setIsUploading(false);
        setMessage({ type: "success", text: `${file.name} uploaded successfully.` });
      }, 1500);
    }
  };

  const handleUpdateProfile = () => {
    setMessage({ type: "success", text: "Profile updated successfully." });
  };

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <Loader2 className="w-12 h-12 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <VendorSidebar />
        <div className="flex-1">
          <DashboardHeader />
          <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
              <p className="text-muted-foreground mt-1">
                Manage your vendor profile and compliance documents.
              </p>
            </header>
            <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <VendorSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <div className="p-4 md:p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your vendor profile and compliance documents.
            </p>
          </header>
          <div className="mb-4">
            <DashboardTabNav2 />
          </div>
          <hr className="mb-3"/>
          {/* Profile Edit Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Contact</Label>
                <Input
                  value={editForm.contact}
                  onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateProfile}>Update Profile</Button>
              {message && <p className="text-green-600 text-sm">{message.text}</p>}
            </CardContent>
          </Card>

          {/* Compliance Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="application/pdf,image/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-5 h-5 mr-2" /> Upload Document
                </Button>
                {fileName && <span className="text-sm text-gray-700">{fileName}</span>}
                {isUploading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-2" />}
              </div>
              {message && message.type === "success" && fileName && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <FileCheck2 className="w-4 h-4" />
                  {fileName} has been submitted for verification.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}