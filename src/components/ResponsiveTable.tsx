import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  mobileLayout?: React.ReactNode;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  priority?: 'high' | 'medium' | 'low';
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn(
    "w-full rounded-lg border border-blue-500/30 overflow-hidden bg-slate-900/40 backdrop-blur-lg",
    className
  )}>
    <div className="overflow-x-auto scrollbar-hidden">
      <table className="w-full min-w-[320px] sm:min-w-[600px] lg:min-w-[800px]">
        {children}
      </table>
    </div>
  </div>
);

export const ResponsiveTableHeader: React.FC<ResponsiveTableHeaderProps> = ({ 
  children, 
  className 
}) => (
  <thead className={cn(
    "bg-gradient-to-r from-slate-800/90 to-blue-900/90",
    className
  )}>
    {children}
  </thead>
);

export const ResponsiveTableBody: React.FC<ResponsiveTableBodyProps> = ({ 
  children, 
  className 
}) => (
  <tbody className={cn("divide-y divide-blue-500/20", className)}>
    {children}
  </tbody>
);

export const ResponsiveTableRow: React.FC<ResponsiveTableRowProps> = ({ 
  children, 
  className,
  mobileLayout 
}) => (
  <>
    {/* Desktop layout */}
    <tr className={cn(
      "hidden sm:table-row hover:bg-slate-800/30 transition-colors duration-200",
      className
    )}>
      {children}
    </tr>
    
    {/* Mobile card layout */}
    {mobileLayout && (
      <tr className="sm:hidden">
        <td colSpan={100} className="p-0">
          <div className="bg-slate-800/40 backdrop-blur-sm border-b border-blue-500/20 p-4 space-y-3">
            {mobileLayout}
          </div>
        </td>
      </tr>
    )}
  </>
);

export const ResponsiveTableCell: React.FC<ResponsiveTableCellProps> = ({ 
  children, 
  className,
  label,
  priority = 'medium'
}) => (
  <td className={cn(
    "px-2 py-3 text-sm sm:px-4",
    // Responsive column hiding
    priority === 'low' && "hidden lg:table-cell",
    priority === 'medium' && "hidden sm:table-cell",
    // High priority always visible
    className
  )}>
    {label && (
      <div className="font-medium text-cyan-300 text-xs uppercase tracking-wider mb-1 sm:hidden">
        {label}
      </div>
    )}
    <div className="min-w-0">
      {children}
    </div>
  </td>
);

export const ResponsiveTableHeaderCell: React.FC<ResponsiveTableCellProps> = ({ 
  children, 
  className,
  priority = 'medium'
}) => (
  <th className={cn(
    "px-2 py-3 text-left text-xs font-bold text-cyan-200 uppercase tracking-wider sm:px-4",
    // Responsive column hiding
    priority === 'low' && "hidden lg:table-cell",
    priority === 'medium' && "hidden sm:table-cell",
    // High priority always visible
    className
  )}>
    <div className="min-w-0 truncate">
      {children}
    </div>
  </th>
);