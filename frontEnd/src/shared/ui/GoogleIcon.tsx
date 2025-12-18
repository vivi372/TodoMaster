import { type SVGProps, type FC } from 'react';

// 1. Props 인터페이스 정의
interface GoogleIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

// 2. 함수 컴포넌트 정의 및 구조 분해 할당을 이용한 기본값 설정
const GoogleIcon: FC<GoogleIconProps> = ({
  className = '', // className에 기본값 설정
  size = 24, // size에 기본값 24 설정
  ...props
}) => {
  // 인라인 스타일 객체를 생성합니다.
  const iconStyle = {
    display: 'block',
    // 🌟 size prop을 인라인 스타일로 적용합니다.
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={iconStyle}
      className={className}
      {...props} // 나머지 모든 SVG 속성을 SVG 요소에 전달
    >
      {/* Red */}
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      {/* Blue */}
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      {/* Yellow */}
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      {/* Green */}
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      {/* Transparent Path (Original SVG에 포함된 숨겨진 패스) */}
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
};

export default GoogleIcon;
