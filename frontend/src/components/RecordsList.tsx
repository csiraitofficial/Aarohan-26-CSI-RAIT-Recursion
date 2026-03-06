import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar, FileText, MoreVertical, Pencil, Stethoscope,
  Trash2, ExternalLink, Clock, User, Clipboard
} from 'lucide-react';
import { getAuth } from "firebase/auth";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HEALTH_ENDPOINTS } from "@/lib/config";
import EditRecordForm from "./EditRecordForm";

interface Record {
  id: string;
  type: string;
  details: any;
  uploaded_file_url?: string;
}

interface RecordsListProps {
  records: Record[];
  setRecords: React.Dispatch<React.SetStateAction<Record[]>>;
}

export default function RecordsList({ records, setRecords }: RecordsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<Record | null>(null);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);

  const recordsPerPage = 3;

  const sortRecordsByDate = (records: Record[]) => {
    return [...records].sort((a, b) => {
      const getDate = (record: Record) => {
        const details = record.details;
        return details.consultationDate ||
          details.surgeryDate ||
          new Date().toISOString();
      };
      return new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime();
    });
  };

  const handleDelete = async (recordId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${HEALTH_ENDPOINTS.records}/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRecords(records.filter(record => record.id !== recordId));
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const handleEdit = (record: Record) => {
    setRecordToEdit(record);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (updatedRecord: Record) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${HEALTH_ENDPOINTS.records}/${updatedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: updatedRecord.type,
          details: updatedRecord.details,
          uploaded_file_url: updatedRecord.uploaded_file_url
        }),
      });

      if (response.ok) {
        setRecords(prevRecords =>
          sortRecordsByDate(prevRecords.map(record =>
            record.id === updatedRecord.id ? { ...updatedRecord } : record
          ))
        );
      }
    } catch (error) {
      console.error("Error updating record:", error);
    }
    setEditDialogOpen(false);
    setRecordToEdit(null);
  };

  const getRecordTheme = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
      case 'test': return { icon: <FileText className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50", stripe: "bg-amber-500" };
      case 'consultation': return { icon: <Stethoscope className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50", stripe: "bg-blue-500" };
      case 'surgery': return { icon: <Calendar className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50", stripe: "bg-rose-500" };
      default: return { icon: <Clipboard className="h-5 w-5" />, color: "text-slate-600", bg: "bg-slate-50", stripe: "bg-slate-400" };
    }
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / recordsPerPage);

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i} className="cursor-pointer">
          <PaginationLink onClick={() => setCurrentPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  const renderTestDetails = (details: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
      {details.tests?.map((test: any, index: number) => (
        <div key={index} className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{test.parameter}</span>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-slate-700">{test.value}</span>
            <Badge variant={test.result === 'normal' ? 'outline' : 'destructive'} className="capitalize">
              {test.result}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );

  const renderConsultationDetails = (details: any) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-700 font-medium">
        <User className="h-4 w-4 text-blue-500" /> {details.doctorName}
      </div>
      <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm italic text-slate-600 text-sm leading-relaxed">
        "{details.doctorNote}"
      </div>
    </div>
  );

  const renderSurgeryDetails = (details: any) => (
    <div className="space-y-3">
      <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
        <h4 className="text-xs font-bold uppercase text-rose-400 mb-2">Procedure Details</h4>
        <p className="text-slate-700 text-sm leading-relaxed">{details.surgeryDetails}</p>
      </div>
    </div>
  );

  const renderDetails = (record: Record) => {
    const type = record.type.toLowerCase();
    switch (type) {
      case 'test': return renderTestDetails(record.details);
      case 'consultation': return renderConsultationDetails(record.details);
      case 'surgery': return renderSurgeryDetails(record.details);
      default:
        return (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Note</h4>
            <p className="text-slate-700 text-sm leading-relaxed">
              {record.details.notes || "No additional information provided."}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Medical Records</h2>
          <p className="text-slate-500 mt-1 text-sm">Manage and track your health history in one place.</p>
        </div>
        <Badge variant="secondary" className="h-fit px-3 py-1">
          {records.length} Total Records
        </Badge>
      </div>

      <div className="grid gap-6">
        {currentRecords.length > 0 ? (
          currentRecords.map((record) => {
            const theme = getRecordTheme(record.type);
            const date = record.details.consultationDate || record.details.surgeryDate;

            return (
              <Card key={record.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 ring-1 ring-slate-200">
                <div className={`h-1.5 w-full ${theme.stripe}`} />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-2xl ${theme.bg} ${theme.color} transition-transform group-hover:scale-110 duration-300`}>
                      {theme.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold text-slate-800 capitalize">{record.type}</CardTitle>
                        {record.uploaded_file_url && <Badge variant="outline" className="text-[10px] uppercase">Attachment</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Clock className="h-3 w-3" />
                        {date ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date set'}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100">
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleEdit(record)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Edit Record
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 cursor-pointer"
                        onClick={() => { setRecordToDelete(record.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent className="pt-2 pb-6">
                  {renderDetails(record)}

                  {record.uploaded_file_url && (
                    <div className="mt-6">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setViewingDocument(record.uploaded_file_url!)}
                        className="w-full md:w-auto bg-slate-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Quick View Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl border-slate-200">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clipboard className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No records found</h3>
            <p className="text-slate-500">Your health records will appear here once added.</p>
          </div>
        )}
      </div>

      {/* Document View Modal */}
      <Dialog open={!!viewingDocument} onOpenChange={(open) => { if (!open) setViewingDocument(null); }}>
        <DialogContent
          className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col rounded-2xl border-none shadow-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-4 border-b bg-white flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Document Viewer
            </DialogTitle>
            {/* <Button size="sm" asChild>
              <a href={viewingDocument!} target="_blank" rel="noopener noreferrer">
                Open in Full Tab
              </a>
            </Button> */}
          </DialogHeader>

          <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden relative">
            {viewingDocument && (
              viewingDocument.toLowerCase().includes('.pdf') ? (
                <object
                  data={viewingDocument}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center justify-center text-white p-6 text-center">
                    <FileText className="h-12 w-12 mb-4 text-slate-500" />
                    <p className="mb-4">Inline PDF viewing is not supported in this browser.</p>
                    <Button asChild variant="secondary">
                      <a href={viewingDocument} target="_blank" rel="noopener noreferrer">
                        Open Document
                      </a>
                    </Button>
                  </div>
                </object>
              ) : (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                  <img
                    src={viewingDocument}
                    alt="Medical Document"
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                    loading="lazy"
                  />
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {records.length > recordsPerPage && (
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. All data associated with this medical record will be removed from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep Record</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recordToDelete && handleDelete(recordToDelete)}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditRecordForm
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        record={recordToEdit}
        onUpdate={handleUpdate}
      />
    </div>
  );
}