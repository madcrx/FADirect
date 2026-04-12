export { apiClient } from './client';
export type { ApiError } from './client';

export { authApi } from './auth';
export type {
  User,
  SendCodeResponse,
  VerifyCodeResponse,
  CurrentUserResponse,
  LogoutResponse,
} from './auth';

export { usersApi } from './users';
export type {
  UserProfile,
  UpdateProfileData,
  UpdateProfileResponse,
} from './users';

export { arrangementsApi } from './arrangements';
export type {
  Arrangement,
  ArrangementsListResponse,
  ArrangementResponse,
  CreateArrangementData,
  UpdateArrangementData,
} from './arrangements';

export { messagesApi } from './messages';
export type {
  Message,
  MessagesListResponse,
  SendMessageData,
  SendMessageResponse,
  MarkReadResponse,
} from './messages';

export { documentsApi } from './documents';
export type {
  Document,
  DocumentsListResponse,
  UploadDocumentResponse,
} from './documents';
