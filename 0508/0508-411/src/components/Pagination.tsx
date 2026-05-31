import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  pageSize = 20
}: PaginationProps) {
  const showFirst = currentPage > 2;
  const showLast = currentPage < totalPages - 1;
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {totalItems !== undefined && (
        <div className="text-sm text-dark-400 text-center sm:text-left">
        共 <span className="text-accent-400 font-medium">{totalItems}</span> 条记录，
        每页 <span className="text-accent-400 font-medium">{pageSize}</span> 条
      </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            flex items-center gap-1 px-3 py-2 rounded-lg
            bg-dark-700 hover:bg-dark-600
            text-dark-300 hover:text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">上一页</span>
        </button>

        {showFirst && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="
                w-10 h-10 rounded-lg
                bg-dark-700 hover:bg-dark-600
                text-dark-300 hover:text-white
                transition-all duration-200
              "
            >
              1
            </button>
            {currentPage > 3 && (
              <span className="text-dark-500 px-2">...</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-10 h-10 rounded-lg font-medium
              transition-all duration-200
              ${page === currentPage
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white'
              }
            `}
          >
            {page}
          </button>
        ))}

        {showLast && (
          <>
            {currentPage < totalPages - 2 && (
              <span className="text-dark-500 px-2">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="
                w-10 h-10 rounded-lg
                bg-dark-700 hover:bg-dark-600
                text-dark-300 hover:text-white
                transition-all duration-200
              "
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            flex items-center gap-1 px-3 py-2 rounded-lg
            bg-dark-700 hover:bg-dark-600
            text-dark-300 hover:text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          <span className="hidden sm:inline">下一页</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
