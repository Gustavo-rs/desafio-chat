import React from 'react';

interface TypingUser {
  userId: string;
  username: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} está digitando`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} e ${typingUsers[1].username} estão digitando`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username} e ${typingUsers[2].username} estão digitando`;
    } else {
      return `${typingUsers[0].username}, ${typingUsers[1].username} e mais ${typingUsers.length - 2} pessoas estão digitando`;
    }
  };

  return (
    <div className="px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm text-gray-500 italic flex items-center gap-2 bg-gray-50 rounded-lg mx-2 md:mx-3 mb-1">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-violet-600 font-medium">{getTypingText()}...</span>
      <span className="text-xs text-gray-400">({typingUsers.length})</span>
    </div>
  );
}; 