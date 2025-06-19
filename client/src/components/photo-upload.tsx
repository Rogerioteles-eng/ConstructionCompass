import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Camera, Upload, X, Image } from "lucide-react";

interface PhotoUploadProps {
  onPhotoCapture: (base64: string) => void;
  onRemove?: () => void;
  currentPhoto?: string;
  label?: string;
  multiple?: boolean;
  onMultiplePhotos?: (photos: string[]) => void;
}

export default function PhotoUpload({ 
  onPhotoCapture, 
  onRemove, 
  currentPhoto, 
  label = "Foto",
  multiple = false,
  onMultiplePhotos
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          
          if (multiple) {
            const newPhotos = [...photos, base64];
            setPhotos(newPhotos);
            onMultiplePhotos?.(newPhotos);
          } else {
            onPhotoCapture(base64);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removePhoto = (index?: number) => {
    if (multiple && typeof index === 'number') {
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
      onMultiplePhotos?.(newPhotos);
    } else {
      onRemove?.();
    }
  };

  const renderPhotoPreview = (photo: string, index?: number) => (
    <div key={index || 0} className="relative group">
      <img 
        src={photo} 
        alt={`${label} ${index !== undefined ? index + 1 : ''}`}
        className="w-20 h-20 object-cover rounded-lg border"
      />
      <button
        type="button"
        onClick={() => removePhoto(index)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Upload Buttons */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCameraCapture}
          className="flex items-center space-x-1"
        >
          <Camera className="h-4 w-4" />
          <span>Tirar Foto</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFileUpload}
          className="flex items-center space-x-1"
        >
          <Upload className="h-4 w-4" />
          <span>Buscar Arquivo</span>
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Previews */}
      {multiple ? (
        photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, index) => renderPhotoPreview(photo, index))}
          </div>
        )
      ) : (
        currentPhoto && (
          <div className="flex items-center space-x-2">
            {renderPhotoPreview(currentPhoto)}
          </div>
        )
      )}

      {/* Photo Count for Multiple */}
      {multiple && photos.length > 0 && (
        <p className="text-sm text-gray-500">
          {photos.length} foto{photos.length !== 1 ? 's' : ''} selecionada{photos.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}