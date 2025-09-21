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

// return non-nullable if `fragmentType` is non-nullable
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: FragmentType<DocumentTypeDecoration<TType, any>>
): TType;
// return nullable if `fragmentType` is undefined
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: FragmentType<DocumentTypeDecoration<TType, any>> | undefined
): TType | undefined;
// return nullable if `fragmentType` is nullable
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: FragmentType<DocumentTypeDecoration<TType, any>> | null
): TType | null;
// return nullable if `fragmentType` is nullable or undefined
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: FragmentType<DocumentTypeDecoration<TType, any>> | null | undefined
): TType | null | undefined;
// return array of non-nullable if `fragmentType` is array of non-nullable
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: Array<FragmentType<DocumentTypeDecoration<TType, any>>>
): Array<TType>;
// return array of nullable if `fragmentType` is array of nullable
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: Array<FragmentType<DocumentTypeDecoration<TType, any>>> | null | undefined
): Array<TType> | null | undefined;
// return readonly array of non-nullable if `fragmentType` is array of non-nullable
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>>
): ReadonlyArray<TType>;
// return readonly array of nullable if `fragmentType` is array of nullable
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType: ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>> | null | undefined
): ReadonlyArray<TType> | null | undefined;
export function useFragment<TType>(
	_documentNode: DocumentTypeDecoration<TType, any>,
	fragmentType:
		| FragmentType<DocumentTypeDecoration<TType, any>>
		| Array<FragmentType<DocumentTypeDecoration<TType, any>>>
		| ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>>
		| null
		| undefined
): TType | Array<TType> | ReadonlyArray<TType> | null | undefined {
	return fragmentType as any;
}

export function makeFragmentData
	F extends DocumentTypeDecoration<any, any>,
	FT extends any
>(data: FT, _fragment: F): FragmentType<F> {
	return data as FragmentType<F>;
};

export function isFragmentReady<TQuery, TFrag>(
	queryNode: DocumentTypeDecoration<TQuery, any>,
	fragmentNode: any,
	data: any
): boolean {
	return true; // Simplified implementation
}