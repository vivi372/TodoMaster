import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react'; // 아이콘 라이브러리 (lucide-react)
import { ImageCropModal } from '@/shared/ui/ImageCropModal';

// =================================================================
// 1. Props 타입 정의 (RHF Controller와 연동)
// =================================================================

interface ProfileImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  onBlur: () => void;
  defaultPreview?: string | null;
  size?: 'sm' | 'md' | 'lg';
  disabled: boolean;
}

export function ProfileImageUpload({
  value,
  onChange,
  onBlur,
  defaultPreview = null,
  size = 'md',
  disabled = false,
}: ProfileImageUploadProps) {
  // 현재 화면에 표시할 미리보기 URL (Data URL 또는 URL)
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultPreview || null);
  // 크롭 모달 열림 상태
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  // 크롭 모달에 넘겨줄 원본 이미지 Data URL
  const [imageToCropSrc, setImageToCropSrc] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  // =================================================================
  // 2. useEffect: RHF Value 변경 감지 및 미리보기 설정
  // =================================================================

  useEffect(() => {
    // RHF의 value가 File 객체로 존재할 때 미리보기 업데이트
    if (value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else if (!value) {
      setPreviewUrl(defaultPreview);
    }
  }, [value, defaultPreview]);

  // =================================================================
  // 3. 파일 선택 및 모달 열기 로직
  // =================================================================

  const processFileAndOpenModal = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 최소 사이즈 제한 (선택 사항 - 작은 이미지 확대 방지)
    // const img = new Image();
    // img.onload = () => {
    //   if (img.width < 200 || img.height < 200) {
    //     alert('이미지는 최소 200x200 픽셀 이상이어야 합니다.');
    //     return;
    //   }
    //   // ... Data URL 생성 및 모달 열기
    // };
    // img.src = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;

      // 🟢 크롭 모달에 넘길 Data URL을 설정하고 모달을 엽니다.
      setImageToCropSrc(result);
      setIsCropModalOpen(true);
      onBlur(); // 파일을 선택하는 순간 onBlur 발생
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileAndOpenModal(file);
    }
    // 동일 파일 재선택을 위해 input value 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =================================================================
  // 4. 크롭 모달 완료 후 최종 처리 핸들러
  // =================================================================

  /**
   * ImageCropModal에서 최종 압축된 File 객체를 받은 후 실행됩니다.
   * @param {File} finalFile - 압축 및 크롭이 완료된 File 객체
   */
  const handleCropComplete = (finalFile: File) => {
    // 🟢 RHF의 onChange 함수를 호출하여 최종 File 객체를 전달
    onChange(finalFile);
    // 미리보기는 useEffect에 의해 RHF value가 업데이트될 때 자동으로 갱신됩니다.
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(defaultPreview || null);
    onChange(null); // RHF 파일 삭제
    onBlur();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // ... (드래그 앤 드롭 로직은 이전과 동일하게 handleDragOver/Leave/Drop 사용)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFileAndOpenModal(file);
    }
  };

  // =================================================================
  // 5. 렌더링
  // =================================================================

  return (
    <>
      <div className={`flex flex-col items-center gap-3 relative ${disabled ? '' : 'group'}`}>
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            ${sizeClasses[size]}
            rounded-full
            ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-accent/50'}
            ${disabled ? '' : 'cursor-pointer'}
            flex items-center justify-center
            relative
            overflow-hidden
            transition-all duration-200
            hover:border-primary hover:bg-primary/5
          `}
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="프로필 미리보기" className="w-full h-full object-cover" />
              {/* 오버레이 및 삭제 버튼 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Camera className="w-10 h-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center px-2">이미지 업로드</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className={`
          absolute           
          right-0 top-0           
          transform -translate-x-1/2 translate-y-1/2           
          bg-destructive text-destructive-foreground rounded-full p-1.5 
          hover:bg-destructive/90 z-50
          ${value ? 'opacity-0 group-hover:opacity-100 transition-opacity' : 'opacity-0 pointer-events-none'} 
        `}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">클릭하거나 드래그하여 업로드</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF 등</p>
        </div>
      </div>

      {/* 6. Image Crop Modal */}
      {isCropModalOpen && imageToCropSrc && (
        <ImageCropModal
          open={isCropModalOpen}
          onOpenChange={setIsCropModalOpen}
          imageSrc={imageToCropSrc}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
