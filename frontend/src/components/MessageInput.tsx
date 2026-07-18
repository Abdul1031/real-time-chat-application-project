import React, { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { emitStopTyping, emitTyping, useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB, comfortably under the backend's 10mb JSON body limit

const MessageInput: React.FC = () => {
  // store text of message
  const [text, setText] = useState<string>("");

  // store picture preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // file input for upload img
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, selectedUser, replyingTo, setReplyingTo } = useChatStore();

  // stop the typing indicator if the user navigates away mid-type
  useEffect(() => {
    return () => {
      if (selectedUser) emitStopTyping(selectedUser._id);
    };
  }, [selectedUser]);

  // when user pick image
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // check file is image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large (max 5MB)");
      return;
    }

    // read img and show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // remove selected image
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (selectedUser) emitTyping(selectedUser._id);
  };

  // when send btn press
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return; // nothing to send

    if (selectedUser) emitStopTyping(selectedUser._id);

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // reset after send
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* reply preview banner */}
      {replyingTo && (
        <div className="mb-3 flex items-center justify-between gap-2 bg-base-200 rounded-lg px-3 py-2 border-l-4 border-primary">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">Replying to</p>
            <p className="text-sm truncate text-base-content/70">
              {replyingTo.text || (replyingTo.image ? "Image" : "")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
            className="btn btn-xs btn-circle btn-ghost"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* show image preview if any */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* message form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          {/* text input */}
          <input
            type="text"
            aria-label="Type a message"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
          />
          {/* hidden file input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {/* image upload btn */}
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach an image"
          >
            <Image size={20} />
          </button>
        </div>

        {/* send message btn */}
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
          aria-label="Send message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
