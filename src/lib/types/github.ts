export interface GitHubTokenResponse {
	access_token?: string;
	error?: string;
}

export interface GitHubUser {
	login: string;
	id: number;
	name: string | null;
	email: string | null;
}

export interface GetUserResult {
	users_by_pk: {
		id: string;
		settings: any; // TODO: porn
	} | null;
}

export interface GetUserGithubTokenResult {
    users_by_pk: {
        id: string;
        settings: {
            tokens?: {
                github?: {
                    encrypted: string;
                    username: string;
                    connectedAt: string;
                };
            };
        };
    } | null;
}
