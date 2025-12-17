'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  notificationApi,
  StoredImage,
  ImageUsage
} from '@/lib/api/notifications';
import { ImageIcon, Upload, X, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onClear: () => void;
}

export function ImageUploader({ value, onChange, onClear }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ImageUsage | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    notificationApi.getImageUsage()
      .then(setUsage)
      .catch((err) => console.error('Failed to fetch image usage:', err));
  }, []);

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const signature = await notificationApi.getUploadSignature();

      if (!signature.canUpload) {
        throw new Error(`Image limit reached (${usage?.limit || 50}). Please delete unused images.`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('signature', signature.signature);
      formData.append('folder', signature.folder);
      // Add transformation - MUST match what backend signed
      formData.append('transformation', 'c_limit,w_1024,h_1024,q_auto:good,f_auto');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      await notificationApi.registerImage({
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        size: result.bytes,
        width: result.width,
        height: result.height,
        format: result.format
      });

      const newUsage = await notificationApi.getImageUsage();
      setUsage(newUsage);

      onChange(result.secure_url);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    await uploadToCloudinary(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleSelectFromLibrary = (image: StoredImage) => {
    onChange(image.url);
    setShowLibrary(false);
  };

  const handleRemoveImage = () => {
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <ImageIcon className="w-4 h-4 text-slate-500" />
          Image
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        {usage && (
          <span className="text-xs text-slate-500">
            {usage.used}/{usage.limit} images used
          </span>
        )}
      </div>

      {value ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden group">
          <img
            src={value}
            alt="Notification image"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
            isDragActive
              ? 'border-violet-500 bg-violet-50'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="w-10 h-10 text-violet-600 mx-auto animate-spin" />
              <p className="text-sm text-slate-600">Uploading...</p>
            </div>
          ) : isDragActive ? (
            <div className="space-y-2">
              <Upload className="w-10 h-10 text-violet-500 mx-auto" />
              <p className="text-sm text-violet-600 font-medium">Drop the image here...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Drag & drop an image, or{' '}
                <span className="text-violet-600 font-medium">browse</span>
              </p>
              <p className="text-xs text-slate-400">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}
        </div>
      )}

      {!value && usage && usage.used > 0 && (
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Select from library ({usage.used} images)
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {usage && usage.remaining <= 5 && usage.remaining > 0 && (
        <p className="text-xs text-amber-600">
          Only {usage.remaining} image slots remaining
        </p>
      )}

      {usage && usage.remaining === 0 && (
        <p className="text-xs text-red-600">
          Image limit reached. Delete unused images to upload more.
        </p>
      )}

      {showLibrary && (
        <ImageLibraryModal
          onSelect={handleSelectFromLibrary}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

function ImageLibraryModal({
  onSelect,
  onClose
}: {
  onSelect: (image: StoredImage) => void;
  onClose: () => void;
}) {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    notificationApi.getStoredImages()
      .then(data => setImages(data.images))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      await notificationApi.deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Image Library</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">No images uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200"
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => onSelect(image)}
                        className="px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {image.usedIn !== 'unused' && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full">
                        In use
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
