import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";


interface EditRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  record: Record | null;
  onUpdate: (updatedRecord: Record) => void;
}

interface Record {
  id: string;
  type: string;
  details: any;
  uploaded_file_url?: string;
}

export default function EditRecordForm({ isOpen, onClose, record, onUpdate }: EditRecordFormProps) {
  const [formData, setFormData] = useState<Record | null>(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    onUpdate(formData);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, details: { ...prev.details, [name]: value } } : null);
  };


  if (!formData) return null;
  const renderFormFields = () => {
    switch (formData.type.toLowerCase()) {
      case 'lab_report':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="labName">Lab Name</Label>
              <Input
                id="labName"
                name="labName"
                value={formData.details.labName || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.details.notes || ''}
                onChange={handleInputChange}
              />
            </div>
          </>
        );

      case 'consultation':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="doctorName">Doctor's Name</Label>
              <Input
                id="doctorName"
                name="doctorName"
                value={formData.details.doctorName || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultationDate">Consultation Date</Label>
              <Input
                id="consultationDate"
                name="consultationDate"
                type="date"
                value={formData.details.consultationDate || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorNote">Doctor's Note</Label>
              <Textarea
                id="doctorNote"
                name="doctorNote"
                value={formData.details.doctorNote || ''}
                onChange={handleInputChange}
              />
            </div>
          </>
        );
      case 'surgery':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="surgeryDate">Surgery Date</Label>
              <Input
                id="surgeryDate"
                name="surgeryDate"
                type="date"
                value={formData.details.surgeryDate || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surgeryDetails">Surgery Details</Label>
              <Textarea
                id="surgeryDetails"
                name="surgeryDetails"
                value={formData.details.surgeryDetails || ''}
                onChange={handleInputChange}
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
          <DialogTitle className="text-2xl font-bold text-blue-600">Edit {formData.type} Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ScrollArea className="h-[60vh] pr-4">
            {renderFormFields()}
          </ScrollArea>
          <DialogFooter>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              Update Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}