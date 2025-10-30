import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

export interface CardCommentsProps {
	todo: TodoFieldsFragment;
	lang: string;
}
