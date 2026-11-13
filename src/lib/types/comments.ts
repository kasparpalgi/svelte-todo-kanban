import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

export interface CardCommentsProps {
	todo: TodoFieldsFragment;
	lang: string;
	/** Viewers may delete only their own comments (#239). */
	readOnly?: boolean;
}
