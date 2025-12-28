export interface UserSummaryProfileResponse {
  nickname: string;
  profileImg: string;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  nickname: string;
  profileImg: string;
  provider: string;
}
