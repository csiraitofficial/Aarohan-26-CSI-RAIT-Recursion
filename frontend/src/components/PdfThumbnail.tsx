import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface PdfThumbnailProps {
    url: string;
    onClick?: () => void;
    className?: string;
}

export default function PdfThumbnail({ url, onClick, className = "" }: PdfThumbnailProps) {
    const [imgError, setImgError] = useState(false);
    const isPdf = url.toLowerCase().includes(".pdf");

    // For non-PDF files (images), render directly
    if (!isPdf) {
        return (
            <div
                className={`relative cursor-pointer overflow-hidden bg-slate-100 ${className}`}
                onClick={onClick}
            >
                {!imgError ? (
                    <img
                        src={url}
                        alt="Document"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-2">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                        <span className="text-xs text-slate-400">Image</span>
                    </div>
                )}
            </div>
        );
    }

    // For PDFs, use an embed element to show the first page
    return (
        <div
            className={`relative cursor-pointer overflow-hidden bg-white ${className}`}
            onClick={onClick}
        >
            {/* Transparent overlay to capture clicks instead of the embed */}
            <div className="absolute inset-0 z-10" />

            {/* PDF embed — wider than container so scrollbar is clipped off */}
            <embed
                src={`${url}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                className="pointer-events-none"
                style={{ width: "calc(100% + 20px)", height: "250px", border: "none" }}
            />
        </div>
    );
}
