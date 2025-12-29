export interface UserSummaryProfileResponse {
  nickname: string;
  profileImg: string;
  imageWarningShown: boolean;
}

export interface UserProfileResponse {
  email: string;
  nickname: string;
  profileImg: string;
  profileImageStatus: string;
  createdAt: string;
  provider: string;
  totalTodos: number;
  completedTodos: number;
  categories: number;
}
