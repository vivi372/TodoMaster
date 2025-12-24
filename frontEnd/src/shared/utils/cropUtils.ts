/**
 * 크롭 영역 정보를 기반으로 캔버스에 이미지를 그리고 Blob 객체를 반환합니다.
 * @param {string} imageSrc - 원본 이미지의 Data URL
 * @param {object} pixelCrop - 크롭 라이브러리에서 제공하는 픽셀 영역 정보 {x, y, width, height}
 * @returns {Promise<Blob>} - 크롭된 이미지의 Blob 객체
 */
export function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Canvas context not available'));
      }

      // 캔버스 크기를 크롭 영역 크기로 설정
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // 크롭된 영역만 캔버스에 그립니다.
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      ctx.drawImage(
        image,
        pixelCrop.x, // sx: 원본 이미지의 시작 X 좌표
        pixelCrop.y, // sy: 원본 이미지의 시작 Y 좌표
        pixelCrop.width, // sWidth: 원본에서 가져올 너비
        pixelCrop.height, // sHeight: 원본에서 가져올 높이
        0, // dx: 캔버스에 그릴 시작 X 좌표
        0, // dy: 캔버스에 그릴 시작 Y 좌표
        pixelCrop.width, // dWidth: 캔버스에 그릴 너비
        pixelCrop.height, // dHeight: 캔버스에 그릴 높이
      );

      // 캔버스 내용을 Blob (파일 데이터)으로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas to Blob failed'));
          }
          resolve(blob);
        },
        'image/jpeg',
        0.9,
      ); // JPEG 형식, 90% 품질로 압축
    };
    image.onerror = (error) => reject(error);
  });
}
