import React from "react";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiReactionPicker: React.FC<EmojiReactionPickerProps> = ({ onSelect }) => {
  return (
    <div
      role="menu"
      className="flex items-center gap-1 bg-base-100 border border-base-300 rounded-full px-2 py-1 shadow-lg"
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitem"
          aria-label={`React with ${emoji}`}
          className="hover:scale-125 transition-transform text-lg leading-none"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiReactionPicker;
