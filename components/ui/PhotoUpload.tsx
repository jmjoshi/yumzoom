'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  maxSizeKB?: number;
  className?: string;
}

export function PhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 3, 
  maxSizeKB = 5000,
  className = '' 
}: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    const newPreviews: string[] = [...previews];

    // Check if adding these files would exceed the limit
    if (photos.length + newFiles.length > maxPhotos) {
      newErrors.push(`You can only upload up to ${maxPhotos} photos`);
      setErrors(newErrors);
      return;
    }

    newFiles.forEach((file, index) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        newErrors.push(`File ${file.name} is not an image`);
        return;
      }

      // Check file size
      if (file.size > maxSizeKB * 1024) {
        newErrors.push(`File ${file.name} is too large (max ${maxSizeKB}KB)`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newPreviews.push(result);
        
        // Update previews when all files are processed
        if (newPreviews.length === previews.length + validFiles.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);

      validFiles.push(file);
    });

    // Update photos and errors
    onPhotosChange([...photos, ...validFiles]);
    setErrors(newErrors);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    onPhotosChange(newPhotos);
    setPreviews(newPreviews);
    
    // Clear any errors if we're under the limit now
    if (newPhotos.length < maxPhotos) {
      setErrors([]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={openFileDialog}
      >
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Add photos to your review ({photos.length}/{maxPhotos})
          </p>
          <p className="text-xs text-gray-500">
            Click to browse or drag and drop images here
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max {maxSizeKB}KB per photo, up to {maxPhotos} photos
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center text-red-600 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Photo Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mobile-friendly upload button */}
      {photos.length < maxPhotos && (
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          className="w-full sm:w-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          {photos.length === 0 ? 'Add Photos' : 'Add More Photos'}
        </Button>
      )}
    </div>
  );
}
