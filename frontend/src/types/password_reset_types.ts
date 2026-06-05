export interface PasswordResetRequest {
	email: string;
}

export interface PasswordResetRequestResponse {
	message: string;
	reset_link?: string | null;
}

export interface PasswordResetConfirm {
	token: string;
	password: string;
}