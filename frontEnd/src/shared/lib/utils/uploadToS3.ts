export async function uploadToS3(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}
