import React from "react";

interface RoomSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const RoomSearch: React.FC<RoomSearchProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="mb-3 md:mb-4">
      <input
        type="text"
        placeholder="Pesquisar..."
        className="w-full px-3 md:px-4 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs md:text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}; 