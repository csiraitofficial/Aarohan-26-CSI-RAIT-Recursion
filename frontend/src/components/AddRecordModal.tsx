import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ScrollArea } from "@/components/ui/scroll-area";
import { HEALTH_ENDPOINTS } from "@/lib/config";

import { getAuth } from "firebase/auth";
interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordAdded: () => void;
}

export default function AddRecordModal({
  isOpen,
  onClose,
  onRecordAdded,
}: AddRecordModalProps) {
  const [recordType, setRecordType] = useState("");
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recordDetails = {
      ...formData,
    };

    const formPayload = new FormData();
    formPayload.append("type", recordType);
    formPayload.append("details", JSON.stringify(recordDetails)); // Include medicines/tests
    if (formData.file) {
      formPayload.append("file", formData.file);
    }
    console.log(formPayload);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No logged-in user. Please sign in first.");
      }

      const token = await user.getIdToken();
      const response = await fetch(HEALTH_ENDPOINTS.records, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formPayload,
      });
      console.log(formPayload);

      const result = await response.json();
      if (response.ok) {
        console.log("Record added successfully:", result);
        onRecordAdded(); // Call the callback function
        onClose();
      } else {
        console.error("Error adding record:", result.error);
      }
      onClose();
    } catch (error) {
      console.error("Error:", error);
    }
  };


  const renderFormFields = () => {
    switch (recordType) {
      case "lab_report":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="labName">Lab Name</Label>
              <Input
                id="labName"
                value={formData.labName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, labName: e.target.value })
                }
                placeholder="e.g. Pathology Lab, Diagnostics Center"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labNotes">Notes (optional)</Label>
              <Textarea
                id="labNotes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional details about this report..."
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case "consultation":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="doctorName">Doctor's Name</Label>
              <Input
                id="doctorName"
                value={formData.doctorName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, doctorName: e.target.value })
                }
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultationDate">Consultation Date</Label>
              <Input
                id="consultationDate"
                type="date"
                value={formData.consultationDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, consultationDate: e.target.value })
                }
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:invert-0 [&::-webkit-calendar-picker-indicator]:brightness-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorNote">Doctor's Note</Label>
              <Textarea
                id="doctorNote"
                value={formData.doctorNote || ""}
                onChange={(e) =>
                  setFormData({ ...formData, doctorNote: e.target.value })
                }
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        );
      case "surgery":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="surgeryDetails">Surgery Details</Label>
              <Textarea
                id="surgeryDetails"
                value={formData.surgeryDetails || ""}
                onChange={(e) =>
                  setFormData({ ...formData, surgeryDetails: e.target.value })
                }
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surgeryDate">Surgery Date</Label>
              <Input
                id="surgeryDate"
                type="date"
                value={formData.surgeryDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, surgeryDate: e.target.value })
                }
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600">
            Add New Medical Record
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recordType" className="text-gray-700">
              Record Type
            </Label>
            <Select onValueChange={setRecordType} required>
              <SelectTrigger
                id="recordType"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <SelectValue placeholder="Select record type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lab_report">Lab Report</SelectItem>
                <SelectItem value="consultation">Doctor's Consultation</SelectItem>
                <SelectItem value="surgery">Surgery Record</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Dynamic Fields (Doctor's Note, etc.) */}
              {renderFormFields()}

              {/* The ONLY File Upload - positioned right after the notes */}
              {recordType && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="file" className="text-gray-700">
                    Upload Attachment (Reports/Notes)
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) =>
                      setFormData({ ...formData, file: e.target.files?.[0] })
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* REMOVED: The duplicate file input block was here. 
           It is now correctly inside the ScrollArea. 
        */}

          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700 w-full"
            >
              Add Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
