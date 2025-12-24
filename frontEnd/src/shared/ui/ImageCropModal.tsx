import * as React from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { Button } from './button';
import { getCroppedImageBlob } from '../utils/cropUtils';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from './modal';

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (file: File) => void;
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ImageCropModalProps) {
  // 크롭 상태 (위치)
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  // 확대/축소 비율
  const [zoom, setZoom] = React.useState(1);
  // 크롭이 완료된 후 픽셀 정보 (Blob 생성에 사용)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // 크롭 영역이 변경될 때마다 호출되는 핸들러
  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  // 줌 비율이 변경될 때마다 호출되는 핸들러
  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  // 크롭 작업이 끝났을 때(마우스를 놓았을 때) 호출되어 픽셀 정보를 저장
  const onCropCompleteHandler = React.useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // =================================================================
  // 크롭 완료 및 압축 처리 핸들러
  // =================================================================
  const handleFinalCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setIsLoading(true);

    try {
      // 1. 크롭된 영역의 Blob 생성
      const croppedBlob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const croppedFileForCompression = new File([croppedBlob], `profile_temp.jpeg`, {
        type: 'image/jpeg',
      });

      // 2. 압축 및 해상도 조절
      const options = {
        /* ... */
      };
      const compressionResult = await imageCompression(croppedFileForCompression, options);

      // 3. 🟢 핵심 수정: 압축 결과를 File 객체로 다시 변환 🟢
      // Blob이든 File이든, RHF에 전달할 최종 File 객체를 생성합니다.
      const finalFile = new File(
        [compressionResult],
        `profile_${Date.now()}.jpeg`, // 최종 파일 이름 지정
        { type: compressionResult.type || 'image/jpeg', lastModified: Date.now() },
      );

      // 4. 부모 컴포넌트로 최종 File 객체 전달
      onCropComplete(finalFile); // 🟢 finalFile 전달

      // 5. 모달 닫기
      onOpenChange(false);
    } catch (error) {
      console.error('이미지 크롭 및 압축 실패:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl" showClose={true}>
        <ModalHeader variant="default">
          <ModalTitle>프로필 이미지 자르기 및 조정</ModalTitle>
        </ModalHeader>
        <ModalBody className="p-4 flex flex-col items-center">
          {/* 🟢 react-easy-crop 컴포넌트 사용 */}
          <div className="relative w-full aspect-square max-h-[60vh] bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // 1:1 비율
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteHandler}
              cropShape="round" // 원형 크롭 UI도 가능
              showGrid={false}
              classes={{
                containerClassName: 'w-full h-full',
              }}
            />
          </div>

          {/* 줌 슬라이더 (선택 사항) */}
          <div className="w-full flex justify-center py-4 px-2">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                onZoomChange(Number(e.target.value));
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm"
            />
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            이미지를 드래그하거나 슬라이더를 사용하여 원하는 영역을 조정하세요.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleFinalCrop} disabled={isLoading || !croppedAreaPixels}>
            {isLoading ? '처리 중...' : '확인 및 저장'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
