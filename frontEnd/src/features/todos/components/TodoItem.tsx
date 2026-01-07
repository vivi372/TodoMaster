import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flag, Repeat, BellRing, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import type { TodoResponse } from '@/features/todos/api/todoApi';
import { appToast } from '@/shared/utils/appToast';

/**
 * @description 우선순위 키 타입을 정의합니다.
 */
type Priority = 'high' | 'medium' | 'low';

/**
 * @description 우선순위 설정 객체의 타입 정의
 */
interface PriorityConfig {
  [key: string]: { label: string; color: string };
}

/**
 * @description Todo 항목의 우선순위에 따른 UI 설정을 정의합니다.
 * 이 설정은 컴포넌트 내에서만 사용되므로 여기에 유지합니다.
 */
const priorityConfig: PriorityConfig = {
  high: { label: '높음', color: 'text-red-500' },
  medium: { label: '보통', color: 'text-amber-500' },
  low: { label: '낮음', color: 'text-blue-500' },
};

/**
 * @description 백엔드에서 받은 숫자 우선순위(0, 1, 2)를 프론트엔드 `priorityConfig`에서 사용하는 키('low', 'medium', 'high')로 변환합니다.
 * @param {number | undefined} priorityValue - 백엔드에서 받은 priority 값.
 * @returns {Priority} - 'low', 'medium', 'high' 중 하나의 문자열. 값이 없거나 범위 밖이면 'low'를 반환합니다.
 */
const convertPriorityToKey = (priorityValue?: number): Priority => {
  switch (priorityValue) {
    case 2:
      return 'high';
    case 1:
      return 'medium';
    case 0:
    default:
      return 'low';
  }
};

/**
 * @description TodoItem 컴포넌트의 Props 정의
 */
export interface TodoItemProps {
  todo: TodoResponse; // 표시할 Todo 데이터
  /**
   * 완료 상태 변경 핸들러입니다.
   * 백엔드 스키마 변경에 따라, 완료 상태를 'Y' 또는 'N'으로 전달합니다.
   */
  onToggle: (id: number, isCompleted: 'Y' | 'N') => void;
  onDelete: (id: number) => void; // 삭제 핸들러
  onEdit: (todo: TodoResponse) => void; // 수정 핸들러
}

/**
 * @description 개별 Todo 항목을 표시하고 상호작용하는 UI 컴포넌트.
 * @param {TodoItemProps} props - todo 데이터 및 이벤트 핸들러
 */
export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  /**
   * @description 백엔드로부터 받은 숫자 priority 값을 'low', 'medium', 'high' 키로 변환합니다.
   * 이 키를 사용하여 priorityConfig에서 해당 우선순위의 라벨과 색상 정보를 가져옵니다.
   * 만약 `todo.priority` 값이 없거나 유효하지 않은 경우, `convertPriorityToKey` 함수가 'low'를 기본값으로 반환하여
   * 렌더링 오류를 방지합니다.
   */
  const priorityKey = convertPriorityToKey(todo.priority);
  const priorityInfo = priorityConfig[priorityKey];

  /**
   * @description 날짜 문자열을 '오늘', '내일' 등 상대적인 시간으로 변환하는 함수.
   */
  const formatDueDate = useCallback((dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`;
    if (diffDays <= 7) return `${diffDays}일 후`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }, []);

  const dueDateText = formatDueDate(todo.dueDate);
  // isCompleted가 'N'이고 마감일이 지났을 때 overdue로 처리합니다.
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && todo.isCompleted === 'N';



  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group bg-white rounded-xl border border-border p-4 transition-all hover:shadow-md',
        // isCompleted가 'Y'일 때 스타일을 적용합니다.
        todo.isCompleted === 'Y' && 'opacity-60',
        isOverdue && 'border-red-200 bg-red-50/30',
      )}
    >
      <div className="flex items-start gap-3">
        {/* 완료/미완료 토글 체크박스 */}
        <motion.div whileTap={{ scale: 0.9 }} className="flex-shrink-0 mt-1">
          <Checkbox
            // isCompleted는 이제 'Y'/'N'이므로, 'Y'일 때 checked 되도록 변환합니다.
            checked={todo.isCompleted === 'Y'}
            // 체크박스 상태 변경 시, 현재 상태에 따라 'Y' 또는 'N'을 토글하여 전달합니다.
            onCheckedChange={() => onToggle(todo.todoId, todo.isCompleted === 'Y' ? 'N' : 'Y')}
            className="h-5 w-5 rounded-md"
          />
        </motion.div>

        {/* Todo 주요 정보 (제목, 날짜, 태그 등) */}
        <div className="flex-1 min-w-0 space-y-2">
          <h3
            className={cn(
              'text-sm font-medium text-foreground leading-relaxed transition-all duration-300',
              // isCompleted가 'Y'일 때 취소선을 적용합니다.
              todo.isCompleted === 'Y' && 'line-through text-muted-foreground',
            )}
          >
            {todo.title}
          </h3>

          {/* 
            [반응형 디자인 수정]
            - `flex-wrap` 클래스를 추가하여 작은 화면(320px)에서 아이템들이 줄바꿈되도록 합니다.
            - `gap-x-3`으로 가로 간격, `gap-y-2`로 세로(줄바꿈 시) 간격을 설정합니다.
            - `mt-1`을 추가하여 제목과의 상단 간격을 확보합니다.
          */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1 text-xs text-muted-foreground">
            {/* 마감일 */}
            {todo.dueDate && (
              <div
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-red-500 font-medium',
                  !isOverdue && dueDateText === '오늘' && 'text-amber-500 font-medium',
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{dueDateText}</span>
              </div>
            )}

            {/* 우선순위 */}
            <div className={cn('flex items-center gap-1', priorityInfo.color)}>
              <Flag className="h-3.5 w-3.5" />
              <span>{priorityInfo.label}</span>
            </div>

            {/* 반복 (미개발) */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 text-blue-500 cursor-pointer"
              onClick={() => appToast.info({ message: '반복 설정 기능은 추후 개발 예정입니다.' })}
              title="반복 설정"
            >
              <Repeat className="h-3.5 w-3.5" />
            </motion.div>

            {/* 알림 (미개발) */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 text-purple-500 cursor-pointer"
              onClick={() => appToast.info({ message: '알림 설정 기능은 추후 개발 예정입니다.' })}
              title="알림 설정"
            >
              <BellRing className="h-3.5 w-3.5" />
            </motion.div>

            {/* 카테고리 (임시) */}
            <Badge variant="secondary" className="text-xs py-0 h-5">
              기본
            </Badge>
          </div>
        </div>

        {/* 더보기 메뉴 (수정/삭제) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => onEdit(todo)}>
              <Edit className="h-4 w-4" /> 수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive"
              onClick={() => onDelete(todo.todoId)}
            >
              <Trash2 className="h-4 w-4" /> 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
