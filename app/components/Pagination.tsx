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
              cursor-pointer px-4 py-2 text-gray-500  border border-r-0 border-y-0 border-gray-600 focus:shadow-outline focus:opacity-50
              ${isCurrent ? 'bg-gray-800 text-white' : ' hover:bg-gray-700'}
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
        <ul className="inline-flex rounded-lg overflow-hidden border border-gray-600">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="cursor-pointer px-4 py-2 text-gray-500 focus:shadow-outline hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {renderPageButtons()}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="cursor-pointer border border-y-0 border-r-0 border-gray-600 px-4 py-2 text-gray-500 focus:shadow-outline hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </ul>
      </nav>
    </div>
  );
}
