import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Pause, Play, Download, X } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedItems: string[];
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkToggleStatus?: () => void;
  onBulkExport?: () => void;
  itemType: 'licenses' | 'sessions' | 'errors';
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedItems,
  onClearSelection,
  onBulkDelete,
  onBulkToggleStatus,
  onBulkExport,
  itemType
}) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-slate-800/90 to-blue-900/90 border border-cyan-400/30 backdrop-blur-sm rounded-lg p-4 sm:p-5 mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto">
          <span className="text-cyan-200 font-jetbrains font-bold text-sm sm:text-base tracking-wider">
            {selectedItems.length} {itemType.toUpperCase()} SELECTED
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm min-h-[44px] px-5 rounded-lg"
            title="Clear selection"
          >
            <X className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline font-semibold">CLEAR</span>
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {onBulkExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              className="bg-blue-600/30 border-blue-400/40 text-blue-300 hover:bg-blue-600/50 hover:border-blue-300/60 backdrop-blur-sm min-h-[44px] px-5 flex-1 sm:flex-initial rounded-lg"
              title="Export selected items"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline font-semibold">EXPORT</span>
            </Button>
          )}
          
          {onBulkToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkToggleStatus}
              className="bg-yellow-600/30 border-yellow-400/40 text-yellow-300 hover:bg-yellow-600/50 hover:border-yellow-300/60 backdrop-blur-sm min-h-[44px] px-5 flex-1 sm:flex-initial rounded-lg"
              title="Toggle status of selected items"
            >
              <Pause className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline font-semibold">TOGGLE</span>
            </Button>
          )}
          
          {onBulkDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="bg-red-600/30 border-red-400/40 text-red-300 hover:bg-red-600/50 hover:border-red-300/60 backdrop-blur-sm min-h-[44px] px-5 flex-1 sm:flex-initial rounded-lg"
              title="Delete selected items"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline font-semibold">DELETE</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};