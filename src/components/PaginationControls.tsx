import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-cyan-400/30 bg-slate-800/50 backdrop-blur-sm">
      <div className="text-sm text-cyan-300 font-jetbrains tracking-wide">
        Showing {startItem}-{endItem} of {totalItems} entries
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm disabled:opacity-50 px-3 py-2 h-9"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm disabled:opacity-50 px-3 py-2 h-9"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={pageNum === currentPage 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-jetbrains font-bold px-4 py-2 h-9 min-w-[2.5rem]"
                  : "bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm px-4 py-2 h-9 min-w-[2.5rem]"
                }
                title={`Go to page ${pageNum}`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm disabled:opacity-50 px-3 py-2 h-9"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm disabled:opacity-50 px-3 py-2 h-9"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};