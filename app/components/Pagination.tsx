interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const isCurrent = i === currentPage;
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`
              cursor-pointer px-4 py-2 text-blue-600  border border-r-0 border-y-0 border-blue-600 focus:shadow-outline focus:opacity-50
              ${isCurrent ? 'bg-blue-600 text-white' : ' hover:bg-blue-100'}
              ${i === startPage && currentPage !== 1 ? '' : ''}
              ${i === endPage && currentPage !== totalPages ? '' : ''}
            `}
        >
          {i}
        </button>

      );
    }
    return buttons;
  };

  return (
    <div className="p-4 flex items-center flex-wrap justify-center">
      <nav aria-label="Page navigation">
        <ul className="inline-flex rounded-lg overflow-hidden border border-blue-600">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="cursor-pointer px-4 py-2 text-blue-600 focus:shadow-outline hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {renderPageButtons()}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="cursor-pointer px-4 py-2 text-blue-600 focus:shadow-outline hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </ul>
      </nav>
    </div>
  );
}
