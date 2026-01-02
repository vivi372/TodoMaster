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
export interface RequestEmailVerificationBody {
  email: string;
  currentPassword?: string;
}

export interface ResendVerificationCodeBody {
  email: string;
}


export interface RequestKakaoEmailChangeVerificationBody {
  newEmail: string;
}

export interface ExecuteEmailChangeBody {
  newEmail: string;
  verificationCode: string;
}

export interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

