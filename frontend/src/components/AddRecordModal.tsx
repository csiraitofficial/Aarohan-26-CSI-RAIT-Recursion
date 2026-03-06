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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HEALTH_ENDPOINTS } from "@/lib/config";
import { Plus, X } from "lucide-react";
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
  const [tests, setTests] = useState([
    { parameter: "", value: "", result: "" },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recordDetails = {
      tests: tests || [],
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


  const addTest = () => {
    setTests([...tests, { parameter: "", value: "", result: "" }]);
  };

  const removeTest = (index: number) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  const updateTest = (index: number, field: string, value: string) => {
    const updatedTests = [...tests];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    setTests(updatedTests);
  };

  const renderFormFields = () => {
    switch (recordType) {
      case "test":
        return (
          <>
            {tests.map((test, index) => (
              <div
                key={index}
                className="space-y-4 p-4 bg-blue-50 rounded-lg mb-4"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold text-blue-600">
                    Test {index + 1}
                  </Label>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTest(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`testParameter-${index}`}>
                    Test Parameter
                  </Label>
                  <Input
                    id={`testParameter-${index}`}
                    value={test.parameter}
                    onChange={(e) =>
                      updateTest(index, "parameter", e.target.value)
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`testValue-${index}`}>Test Value</Label>
                  <Input
                    id={`testValue-${index}`}
                    value={test.value}
                    onChange={(e) => updateTest(index, "value", e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Result</Label>
                  <RadioGroup
                    value={test.result}
                    onValueChange={(value) =>
                      updateTest(index, "result", value)
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="normal"
                        id={`normal-${index}`}
                        className={`${test.result === "normal"
                            ? "bg-blue-100 text-white border-blue-600"
                            : "bg-white text-blue-600 border-blue-600"
                          } border-2 focus:ring-blue-500 rounded-full w-6 h-6 flex items-center justify-center`}
                      />
                      <Label
                        htmlFor={`normal-${index}`}
                        className="cursor-pointer"
                      >
                        Normal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="increased"
                        id={`increased-${index}`}
                        className={`${test.result === "increased"
                            ? "bg-blue-100 text-white border-blue-600"
                            : "bg-white text-blue-600 border-blue-600"
                          } border-2 focus:ring-blue-500 rounded-full w-6 h-6 flex items-center justify-center`}
                      />
                      <Label
                        htmlFor={`increased-${index}`}
                        className="cursor-pointer"
                      >
                        Increased
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="decreased"
                        id={`decreased-${index}`}
                        className={`${test.result === "decreased"
                            ? "bg-blue-100 text-white border-blue-600"
                            : "bg-white text-blue-600 border-blue-600"
                          } border-2 focus:ring-blue-500 rounded-full w-6 h-6 flex items-center justify-center`}
                      />
                      <Label
                        htmlFor={`decreased-${index}`}
                        className="cursor-pointer"
                      >
                        Decreased
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={addTest}
              className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Another Test
            </Button>
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
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                <SelectItem value="test">Test</SelectItem>

                <SelectItem value="consultation">
                  Doctor's Consultation
                </SelectItem>
                <SelectItem value="surgery">Surgery Record</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[60vh] pr-4">
            {renderFormFields()}
          </ScrollArea>
          <div className="space-y-2">
            <Label htmlFor="file" className="text-gray-700">
              Upload File (optional)
            </Label>
            <Input
              id="file"
              type="file"
              onChange={(e) =>
                setFormData({ ...formData, file: e.target.files?.[0] })
              }
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
