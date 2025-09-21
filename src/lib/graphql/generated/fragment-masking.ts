/** @file src/lib/graphql/generated/fragment-masking.ts */
/* eslint-disable */
import type { FragmentDefinitionNode } from 'graphql';
import type { Incremental } from './graphql';

// Define our own DocumentTypeDecoration to avoid external dependency
export interface DocumentTypeDecoration<TResult, TVariables> {
	__apiType?: (variables: TVariables) => TResult;
}

export type FragmentType<TDocumentType extends DocumentTypeDecoration<any, any>> =
	TDocumentType extends DocumentTypeDecoration<infer TType, any>
		? [TType] extends [{ ' $fragmentName'?: infer TKey }]
			? TKey extends string
				? { ' $fragmentRefs'?: { [key in TKey]: TType } }
				: never
			: never
		: never;

export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: FragmentType<DocumentTypeDecoration<TType, any>> | null | undefined
): TType | null | undefined {
	return fragmentType as any;
}

export function makeFragmentData<F extends DocumentTypeDecoration<any, any>, FT extends any>(
	data: FT,
	_fragment: F
): FragmentType<F> {
	return data as FragmentType<F>;
}

export function isFragmentReady(): boolean {
	return true;
}
