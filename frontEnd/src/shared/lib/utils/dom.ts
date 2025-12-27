// 스크롤 최상단 이동
/**
 * 현재 브라우저 뷰포트의 스크롤을 페이지의 가장 위(최상단)로 부드럽게 이동시킵니다.
 */
export const scrollTop = () => {
  // window.scrollTo: 윈도우 스크롤 위치를 지정하는 메서드입니다.
  window.scrollTo({
    top: 0, // 수직 스크롤 위치를 0 (최상단)으로 설정
    behavior: 'smooth', // 스크롤 애니메이션을 부드럽게(smooth) 적용
  });
};

// 특정 요소로 스크롤 이동
/**
 * 지정된 ID를 가진 HTML 요소가 보이도록 화면을 부드럽게 스크롤 이동시킵니다.
 *
 * @param id 스크롤을 이동할 대상 HTML 요소의 ID 문자열
 */
export const scrollToElement = (id: string) => {
  // 1. document.getElementById(id): 주어진 ID를 가진 요소를 DOM에서 찾습니다.
  const el = document.getElementById(id);

  // 2. 요소가 존재하는지 확인합니다.
  if (el) {
    // 3. scrollIntoView(): 해당 요소가 사용자에게 보이도록 스크롤 위치를 조정합니다.
    el.scrollIntoView({
      behavior: 'smooth', // 스크롤 애니메이션을 부드럽게(smooth) 적용
    });
  }
};
