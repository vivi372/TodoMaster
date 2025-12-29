export interface UserSummaryProfileResponse {
  nickname: string;
  profileImg: string;
  imageWarningShown: boolean;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  nickname: string;
  profileImg: string;
  provider: string;
}
