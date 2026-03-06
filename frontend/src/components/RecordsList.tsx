import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Trash2, Clock, User, Clipboard, FlaskConical
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
import PdfThumbnail from "./PdfThumbnail";

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

  const recordsPerPage = 6;

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
      case 'lab_report': return { icon: <FlaskConical className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50", stripe: "bg-amber-500", accent: "bg-amber-100" };
      case 'consultation': return { icon: <Stethoscope className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50", stripe: "bg-blue-500", accent: "bg-blue-100" };
      case 'surgery': return { icon: <Calendar className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50", stripe: "bg-rose-500", accent: "bg-rose-100" };
      default: return { icon: <Clipboard className="h-5 w-5" />, color: "text-slate-600", bg: "bg-slate-50", stripe: "bg-slate-400", accent: "bg-slate-100" };
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

  const renderLabReportDetails = (details: any) => (
    <div className="space-y-1.5">
      {details.tests?.slice(0, 3).map((test: any, index: number) => (
        <div key={index} className="flex justify-between items-center text-xs">
          <span className="text-slate-500 truncate mr-2">{test.parameter}</span>
          <Badge variant={test.result === 'normal' ? 'outline' : 'destructive'} className="capitalize text-[10px] px-1.5 py-0">
            {test.result}
          </Badge>
        </div>
      ))}
      {details.tests?.length > 3 && (
        <p className="text-[10px] text-slate-400">+{details.tests.length - 3} more</p>
      )}
    </div>
  );

  const renderConsultationDetails = (details: any) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <User className="h-3 w-3 text-blue-500 shrink-0" />
        <span className="truncate">{details.doctorName}</span>
      </div>
      {details.doctorNote && (
        <p className="text-xs text-slate-500 italic line-clamp-2">"{details.doctorNote}"</p>
      )}
    </div>
  );

  const renderSurgeryDetails = (details: any) => (
    <div className="space-y-1.5">
      {details.surgeryDetails && (
        <p className="text-xs text-slate-500 line-clamp-3">{details.surgeryDetails}</p>
      )}
    </div>
  );

  const renderDetails = (record: Record) => {
    const type = record.type.toLowerCase();
    switch (type) {
      case 'lab_report': return renderLabReportDetails(record.details);
      case 'consultation': return renderConsultationDetails(record.details);
      case 'surgery': return renderSurgeryDetails(record.details);
      default:
        return (
          <p className="text-xs text-slate-500 line-clamp-2">
            {record.details.notes || "No additional information."}
          </p>
        );
    }
  };

  return (
    <div className="w-full px-2 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Medical Records</h2>
          <p className="text-slate-500 mt-1 text-sm">Manage and track your health history in one place.</p>
        </div>
        <Badge variant="secondary" className="h-fit px-3 py-1">
          {records.length} Total Records
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentRecords.length > 0 ? (
          currentRecords.map((record) => {
            const theme = getRecordTheme(record.type);
            const date = record.details.consultationDate || record.details.surgeryDate;

            return (
              <Card
                key={record.id}
                className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 ring-1 ring-slate-200 flex flex-col"
              >
                {/* Top: PDF thumbnail or placeholder */}
                <div className="relative h-44 w-full overflow-hidden">
                  {record.uploaded_file_url ? (
                    <PdfThumbnail
                      url={record.uploaded_file_url}
                      onClick={() => setViewingDocument(record.uploaded_file_url!)}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className={`h-full w-full flex flex-col items-center justify-center ${theme.accent} transition-colors`}>
                      <div className={`p-4 rounded-2xl ${theme.bg} ${theme.color} mb-2`}>
                        {React.cloneElement(theme.icon as React.ReactElement, { className: "h-8 w-8" })}
                      </div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{record.type} Record</span>
                    </div>
                  )}

                  {/* Colored stripe at top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${theme.stripe}`} />

                  {/* 3-dot menu overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="h-8 w-8 p-0 rounded-full shadow-md bg-white/90 hover:bg-white">
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleEdit(record)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" /> Edit
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
                  </div>

                  {/* Attachment badge */}
                  {record.uploaded_file_url && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-slate-700 text-[10px] shadow-sm hover:bg-white">
                        <FileText className="h-3 w-3 mr-1" /> PDF
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Bottom: Details */}
                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 capitalize text-sm">{record.type}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                      </div>
                    </div>
                    <div className={`p-1.5 rounded-lg ${theme.bg} ${theme.color}`}>
                      {theme.icon}
                    </div>
                  </div>

                  <div className="flex-1">
                    {renderDetails(record)}
                  </div>

                  {record.uploaded_file_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingDocument(record.uploaded_file_url!)}
                      className="w-full text-xs mt-auto h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      View Document
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 border-2 border-dashed rounded-3xl border-slate-200">
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