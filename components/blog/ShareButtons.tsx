'use client';

import { useState } from 'react';
import { Twitter, Linkedin, Facebook, Link as LinkIcon, Check, Mail, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareTitle = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-[#1DA1F2]/20 text-gray-300 hover:text-[#1DA1F2] rounded-lg text-sm transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
        Twitter
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-[#0A66C2]/20 text-gray-300 hover:text-[#0A66C2] rounded-lg text-sm transition-colors"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
        LinkedIn
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-[#1877F2]/20 text-gray-300 hover:text-[#1877F2] rounded-lg text-sm transition-colors"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
        Facebook
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-[#25D366]/20 text-gray-300 hover:text-[#25D366] rounded-lg text-sm transition-colors"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>
      <a
        href={`mailto:?subject=${shareTitle}&body=Check%20out%20this%20article:%20${shareUrl}`}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
        title="Share via Email"
      >
        <Mail className="w-4 h-4" />
        Email
      </a>
      <button
        onClick={copyToClipboard}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
        title="Copy link"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4" />
            Copy Link
          </>
        )}
      </button>
    </div>
  );
}
