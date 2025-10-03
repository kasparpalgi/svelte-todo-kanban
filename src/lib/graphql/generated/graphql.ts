/* eslint-disable */
import type { DocumentTypeDecoration } from "./fragment-masking";
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  bigint: { input: number; output: number; }
  jsonb: { input: any; output: any; }
  timestamptz: { input: string; output: string; }
  uuid: { input: string; output: string; }
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _gt?: InputMaybe<Scalars['Boolean']['input']>;
  _gte?: InputMaybe<Scalars['Boolean']['input']>;
  _in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Boolean']['input']>;
  _lte?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "accounts" */
export type Accounts = {
  __typename?: 'accounts';
  access_token?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['timestamptz']['output'];
  expires_at?: Maybe<Scalars['bigint']['output']>;
  id: Scalars['uuid']['output'];
  id_token?: Maybe<Scalars['String']['output']>;
  provider: Scalars['String']['output'];
  providerAccountId: Scalars['String']['output'];
  refresh_token?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  session_state?: Maybe<Scalars['String']['output']>;
  token_type?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  user: Users;
  userId: Scalars['uuid']['output'];
};

/** aggregated selection of "accounts" */
export type Accounts_Aggregate = {
  __typename?: 'accounts_aggregate';
  aggregate?: Maybe<Accounts_Aggregate_Fields>;
  nodes: Array<Accounts>;
};

export type Accounts_Aggregate_Bool_Exp = {
  count?: InputMaybe<Accounts_Aggregate_Bool_Exp_Count>;
};

export type Accounts_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Accounts_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Accounts_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "accounts" */
export type Accounts_Aggregate_Fields = {
  __typename?: 'accounts_aggregate_fields';
  avg?: Maybe<Accounts_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Accounts_Max_Fields>;
  min?: Maybe<Accounts_Min_Fields>;
  stddev?: Maybe<Accounts_Stddev_Fields>;
  stddev_pop?: Maybe<Accounts_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Accounts_Stddev_Samp_Fields>;
  sum?: Maybe<Accounts_Sum_Fields>;
  var_pop?: Maybe<Accounts_Var_Pop_Fields>;
  var_samp?: Maybe<Accounts_Var_Samp_Fields>;
  variance?: Maybe<Accounts_Variance_Fields>;
};


/** aggregate fields of "accounts" */
export type Accounts_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Accounts_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "accounts" */
export type Accounts_Aggregate_Order_By = {
  avg?: InputMaybe<Accounts_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Accounts_Max_Order_By>;
  min?: InputMaybe<Accounts_Min_Order_By>;
  stddev?: InputMaybe<Accounts_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Accounts_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Accounts_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Accounts_Sum_Order_By>;
  var_pop?: InputMaybe<Accounts_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Accounts_Var_Samp_Order_By>;
  variance?: InputMaybe<Accounts_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "accounts" */
export type Accounts_Arr_Rel_Insert_Input = {
  data: Array<Accounts_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Accounts_On_Conflict>;
};

/** aggregate avg on columns */
export type Accounts_Avg_Fields = {
  __typename?: 'accounts_avg_fields';
  expires_at?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "accounts" */
export type Accounts_Avg_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "accounts". All fields are combined with a logical 'AND'. */
export type Accounts_Bool_Exp = {
  _and?: InputMaybe<Array<Accounts_Bool_Exp>>;
  _not?: InputMaybe<Accounts_Bool_Exp>;
  _or?: InputMaybe<Array<Accounts_Bool_Exp>>;
  access_token?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  expires_at?: InputMaybe<Bigint_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  id_token?: InputMaybe<String_Comparison_Exp>;
  provider?: InputMaybe<String_Comparison_Exp>;
  providerAccountId?: InputMaybe<String_Comparison_Exp>;
  refresh_token?: InputMaybe<String_Comparison_Exp>;
  scope?: InputMaybe<String_Comparison_Exp>;
  session_state?: InputMaybe<String_Comparison_Exp>;
  token_type?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  userId?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "accounts" */
export enum Accounts_Constraint {
  /** unique or primary key constraint on columns "id" */
  AccountsPkey = 'accounts_pkey',
  /** unique or primary key constraint on columns "provider", "providerAccountId" */
  AccountsProviderProvideraccountidKey = 'accounts_provider_provideraccountid_key'
}

/** input type for incrementing numeric columns in table "accounts" */
export type Accounts_Inc_Input = {
  expires_at?: InputMaybe<Scalars['bigint']['input']>;
};

/** input type for inserting data into table "accounts" */
export type Accounts_Insert_Input = {
  access_token?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires_at?: InputMaybe<Scalars['bigint']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  id_token?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  refresh_token?: InputMaybe<Scalars['String']['input']>;
  scope?: InputMaybe<Scalars['String']['input']>;
  session_state?: InputMaybe<Scalars['String']['input']>;
  token_type?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  userId?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Accounts_Max_Fields = {
  __typename?: 'accounts_max_fields';
  access_token?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires_at?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  id_token?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  providerAccountId?: Maybe<Scalars['String']['output']>;
  refresh_token?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  session_state?: Maybe<Scalars['String']['output']>;
  token_type?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  userId?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "accounts" */
export type Accounts_Max_Order_By = {
  access_token?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  id_token?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  providerAccountId?: InputMaybe<Order_By>;
  refresh_token?: InputMaybe<Order_By>;
  scope?: InputMaybe<Order_By>;
  session_state?: InputMaybe<Order_By>;
  token_type?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  userId?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Accounts_Min_Fields = {
  __typename?: 'accounts_min_fields';
  access_token?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires_at?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  id_token?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  providerAccountId?: Maybe<Scalars['String']['output']>;
  refresh_token?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  session_state?: Maybe<Scalars['String']['output']>;
  token_type?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  userId?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "accounts" */
export type Accounts_Min_Order_By = {
  access_token?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  id_token?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  providerAccountId?: InputMaybe<Order_By>;
  refresh_token?: InputMaybe<Order_By>;
  scope?: InputMaybe<Order_By>;
  session_state?: InputMaybe<Order_By>;
  token_type?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  userId?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "accounts" */
export type Accounts_Mutation_Response = {
  __typename?: 'accounts_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Accounts>;
};

/** on_conflict condition type for table "accounts" */
export type Accounts_On_Conflict = {
  constraint: Accounts_Constraint;
  update_columns?: Array<Accounts_Update_Column>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};

/** Ordering options when selecting data from "accounts". */
export type Accounts_Order_By = {
  access_token?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  id_token?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  providerAccountId?: InputMaybe<Order_By>;
  refresh_token?: InputMaybe<Order_By>;
  scope?: InputMaybe<Order_By>;
  session_state?: InputMaybe<Order_By>;
  token_type?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  userId?: InputMaybe<Order_By>;
};

/** primary key columns input for table: accounts */
export type Accounts_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "accounts" */
export enum Accounts_Select_Column {
  /** column name */
  AccessToken = 'access_token',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  ExpiresAt = 'expires_at',
  /** column name */
  Id = 'id',
  /** column name */
  IdToken = 'id_token',
  /** column name */
  Provider = 'provider',
  /** column name */
  ProviderAccountId = 'providerAccountId',
  /** column name */
  RefreshToken = 'refresh_token',
  /** column name */
  Scope = 'scope',
  /** column name */
  SessionState = 'session_state',
  /** column name */
  TokenType = 'token_type',
  /** column name */
  Type = 'type',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "accounts" */
export type Accounts_Set_Input = {
  access_token?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires_at?: InputMaybe<Scalars['bigint']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  id_token?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  refresh_token?: InputMaybe<Scalars['String']['input']>;
  scope?: InputMaybe<Scalars['String']['input']>;
  session_state?: InputMaybe<Scalars['String']['input']>;
  token_type?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  userId?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate stddev on columns */
export type Accounts_Stddev_Fields = {
  __typename?: 'accounts_stddev_fields';
  expires_at?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "accounts" */
export type Accounts_Stddev_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Accounts_Stddev_Pop_Fields = {
  __typename?: 'accounts_stddev_pop_fields';
  expires_at?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "accounts" */
export type Accounts_Stddev_Pop_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Accounts_Stddev_Samp_Fields = {
  __typename?: 'accounts_stddev_samp_fields';
  expires_at?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "accounts" */
export type Accounts_Stddev_Samp_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "accounts" */
export type Accounts_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Accounts_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Accounts_Stream_Cursor_Value_Input = {
  access_token?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires_at?: InputMaybe<Scalars['bigint']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  id_token?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  refresh_token?: InputMaybe<Scalars['String']['input']>;
  scope?: InputMaybe<Scalars['String']['input']>;
  session_state?: InputMaybe<Scalars['String']['input']>;
  token_type?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  userId?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate sum on columns */
export type Accounts_Sum_Fields = {
  __typename?: 'accounts_sum_fields';
  expires_at?: Maybe<Scalars['bigint']['output']>;
};

/** order by sum() on columns of table "accounts" */
export type Accounts_Sum_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** update columns of table "accounts" */
export enum Accounts_Update_Column {
  /** column name */
  AccessToken = 'access_token',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  ExpiresAt = 'expires_at',
  /** column name */
  Id = 'id',
  /** column name */
  IdToken = 'id_token',
  /** column name */
  Provider = 'provider',
  /** column name */
  ProviderAccountId = 'providerAccountId',
  /** column name */
  RefreshToken = 'refresh_token',
  /** column name */
  Scope = 'scope',
  /** column name */
  SessionState = 'session_state',
  /** column name */
  TokenType = 'token_type',
  /** column name */
  Type = 'type',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'userId'
}

export type Accounts_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Accounts_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Accounts_Set_Input>;
  /** filter the rows which have to be updated */
  where: Accounts_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Accounts_Var_Pop_Fields = {
  __typename?: 'accounts_var_pop_fields';
  expires_at?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "accounts" */
export type Accounts_Var_Pop_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Accounts_Var_Samp_Fields = {
  __typename?: 'accounts_var_samp_fields';
  expires_at?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "accounts" */
export type Accounts_Var_Samp_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Accounts_Variance_Fields = {
  __typename?: 'accounts_variance_fields';
  expires_at?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "accounts" */
export type Accounts_Variance_Order_By = {
  expires_at?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bigint']['input']>;
  _gt?: InputMaybe<Scalars['bigint']['input']>;
  _gte?: InputMaybe<Scalars['bigint']['input']>;
  _in?: InputMaybe<Array<Scalars['bigint']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['bigint']['input']>;
  _lte?: InputMaybe<Scalars['bigint']['input']>;
  _neq?: InputMaybe<Scalars['bigint']['input']>;
  _nin?: InputMaybe<Array<Scalars['bigint']['input']>>;
};

/** Tracks pending and processed invitations to boards */
export type Board_Invitations = {
  __typename?: 'board_invitations';
  /** An object relationship */
  board: Boards;
  board_id: Scalars['uuid']['output'];
  created_at: Scalars['timestamptz']['output'];
  expires_at: Scalars['timestamptz']['output'];
  id: Scalars['uuid']['output'];
  invitee_email?: Maybe<Scalars['String']['output']>;
  invitee_username?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  inviter: Users;
  inviter_id: Scalars['uuid']['output'];
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role: Scalars['String']['output'];
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status: Scalars['String']['output'];
  /** Secure token for invitation links */
  token: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
};

/** aggregated selection of "board_invitations" */
export type Board_Invitations_Aggregate = {
  __typename?: 'board_invitations_aggregate';
  aggregate?: Maybe<Board_Invitations_Aggregate_Fields>;
  nodes: Array<Board_Invitations>;
};

export type Board_Invitations_Aggregate_Bool_Exp = {
  count?: InputMaybe<Board_Invitations_Aggregate_Bool_Exp_Count>;
};

export type Board_Invitations_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Board_Invitations_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "board_invitations" */
export type Board_Invitations_Aggregate_Fields = {
  __typename?: 'board_invitations_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Board_Invitations_Max_Fields>;
  min?: Maybe<Board_Invitations_Min_Fields>;
};


/** aggregate fields of "board_invitations" */
export type Board_Invitations_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "board_invitations" */
export type Board_Invitations_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Board_Invitations_Max_Order_By>;
  min?: InputMaybe<Board_Invitations_Min_Order_By>;
};

/** input type for inserting array relation for remote table "board_invitations" */
export type Board_Invitations_Arr_Rel_Insert_Input = {
  data: Array<Board_Invitations_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Board_Invitations_On_Conflict>;
};

/** Boolean expression to filter rows from the table "board_invitations". All fields are combined with a logical 'AND'. */
export type Board_Invitations_Bool_Exp = {
  _and?: InputMaybe<Array<Board_Invitations_Bool_Exp>>;
  _not?: InputMaybe<Board_Invitations_Bool_Exp>;
  _or?: InputMaybe<Array<Board_Invitations_Bool_Exp>>;
  board?: InputMaybe<Boards_Bool_Exp>;
  board_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  expires_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  invitee_email?: InputMaybe<String_Comparison_Exp>;
  invitee_username?: InputMaybe<String_Comparison_Exp>;
  inviter?: InputMaybe<Users_Bool_Exp>;
  inviter_id?: InputMaybe<Uuid_Comparison_Exp>;
  role?: InputMaybe<String_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  token?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "board_invitations" */
export enum Board_Invitations_Constraint {
  /** unique or primary key constraint on columns "id" */
  BoardInvitationsPkey = 'board_invitations_pkey',
  /** unique or primary key constraint on columns "token" */
  BoardInvitationsTokenKey = 'board_invitations_token_key'
}

/** input type for inserting data into table "board_invitations" */
export type Board_Invitations_Insert_Input = {
  board?: InputMaybe<Boards_Obj_Rel_Insert_Input>;
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  invitee_email?: InputMaybe<Scalars['String']['input']>;
  invitee_username?: InputMaybe<Scalars['String']['input']>;
  inviter?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  inviter_id?: InputMaybe<Scalars['uuid']['input']>;
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role?: InputMaybe<Scalars['String']['input']>;
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status?: InputMaybe<Scalars['String']['input']>;
  /** Secure token for invitation links */
  token?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate max on columns */
export type Board_Invitations_Max_Fields = {
  __typename?: 'board_invitations_max_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  invitee_email?: Maybe<Scalars['String']['output']>;
  invitee_username?: Maybe<Scalars['String']['output']>;
  inviter_id?: Maybe<Scalars['uuid']['output']>;
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role?: Maybe<Scalars['String']['output']>;
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status?: Maybe<Scalars['String']['output']>;
  /** Secure token for invitation links */
  token?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "board_invitations" */
export type Board_Invitations_Max_Order_By = {
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  invitee_email?: InputMaybe<Order_By>;
  invitee_username?: InputMaybe<Order_By>;
  inviter_id?: InputMaybe<Order_By>;
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role?: InputMaybe<Order_By>;
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status?: InputMaybe<Order_By>;
  /** Secure token for invitation links */
  token?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Board_Invitations_Min_Fields = {
  __typename?: 'board_invitations_min_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  invitee_email?: Maybe<Scalars['String']['output']>;
  invitee_username?: Maybe<Scalars['String']['output']>;
  inviter_id?: Maybe<Scalars['uuid']['output']>;
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role?: Maybe<Scalars['String']['output']>;
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status?: Maybe<Scalars['String']['output']>;
  /** Secure token for invitation links */
  token?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "board_invitations" */
export type Board_Invitations_Min_Order_By = {
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  invitee_email?: InputMaybe<Order_By>;
  invitee_username?: InputMaybe<Order_By>;
  inviter_id?: InputMaybe<Order_By>;
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role?: InputMaybe<Order_By>;
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status?: InputMaybe<Order_By>;
  /** Secure token for invitation links */
  token?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "board_invitations" */
export type Board_Invitations_Mutation_Response = {
  __typename?: 'board_invitations_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Board_Invitations>;
};

/** on_conflict condition type for table "board_invitations" */
export type Board_Invitations_On_Conflict = {
  constraint: Board_Invitations_Constraint;
  update_columns?: Array<Board_Invitations_Update_Column>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};

/** Ordering options when selecting data from "board_invitations". */
export type Board_Invitations_Order_By = {
  board?: InputMaybe<Boards_Order_By>;
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  invitee_email?: InputMaybe<Order_By>;
  invitee_username?: InputMaybe<Order_By>;
  inviter?: InputMaybe<Users_Order_By>;
  inviter_id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  token?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: board_invitations */
export type Board_Invitations_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "board_invitations" */
export enum Board_Invitations_Select_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  ExpiresAt = 'expires_at',
  /** column name */
  Id = 'id',
  /** column name */
  InviteeEmail = 'invitee_email',
  /** column name */
  InviteeUsername = 'invitee_username',
  /** column name */
  InviterId = 'inviter_id',
  /** column name */
  Role = 'role',
  /** column name */
  Status = 'status',
  /** column name */
  Token = 'token',
  /** column name */
  UpdatedAt = 'updated_at'
}

/** input type for updating data in table "board_invitations" */
export type Board_Invitations_Set_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  invitee_email?: InputMaybe<Scalars['String']['input']>;
  invitee_username?: InputMaybe<Scalars['String']['input']>;
  inviter_id?: InputMaybe<Scalars['uuid']['input']>;
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role?: InputMaybe<Scalars['String']['input']>;
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status?: InputMaybe<Scalars['String']['input']>;
  /** Secure token for invitation links */
  token?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** Streaming cursor of the table "board_invitations" */
export type Board_Invitations_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Board_Invitations_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Board_Invitations_Stream_Cursor_Value_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  invitee_email?: InputMaybe<Scalars['String']['input']>;
  invitee_username?: InputMaybe<Scalars['String']['input']>;
  inviter_id?: InputMaybe<Scalars['uuid']['input']>;
  /** Role to assign when invitation is accepted (editor/viewer, not owner) */
  role?: InputMaybe<Scalars['String']['input']>;
  /** pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled */
  status?: InputMaybe<Scalars['String']['input']>;
  /** Secure token for invitation links */
  token?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** update columns of table "board_invitations" */
export enum Board_Invitations_Update_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  ExpiresAt = 'expires_at',
  /** column name */
  Id = 'id',
  /** column name */
  InviteeEmail = 'invitee_email',
  /** column name */
  InviteeUsername = 'invitee_username',
  /** column name */
  InviterId = 'inviter_id',
  /** column name */
  Role = 'role',
  /** column name */
  Status = 'status',
  /** column name */
  Token = 'token',
  /** column name */
  UpdatedAt = 'updated_at'
}

export type Board_Invitations_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Board_Invitations_Set_Input>;
  /** filter the rows which have to be updated */
  where: Board_Invitations_Bool_Exp;
};

/** Tracks board membership and user roles (owner/editor/viewer) */
export type Board_Members = {
  __typename?: 'board_members';
  /** An object relationship */
  board: Boards;
  board_id: Scalars['uuid']['output'];
  created_at: Scalars['timestamptz']['output'];
  id: Scalars['uuid']['output'];
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  user: Users;
  user_id: Scalars['uuid']['output'];
};

/** aggregated selection of "board_members" */
export type Board_Members_Aggregate = {
  __typename?: 'board_members_aggregate';
  aggregate?: Maybe<Board_Members_Aggregate_Fields>;
  nodes: Array<Board_Members>;
};

export type Board_Members_Aggregate_Bool_Exp = {
  count?: InputMaybe<Board_Members_Aggregate_Bool_Exp_Count>;
};

export type Board_Members_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Board_Members_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Board_Members_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "board_members" */
export type Board_Members_Aggregate_Fields = {
  __typename?: 'board_members_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Board_Members_Max_Fields>;
  min?: Maybe<Board_Members_Min_Fields>;
};


/** aggregate fields of "board_members" */
export type Board_Members_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Board_Members_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "board_members" */
export type Board_Members_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Board_Members_Max_Order_By>;
  min?: InputMaybe<Board_Members_Min_Order_By>;
};

/** input type for inserting array relation for remote table "board_members" */
export type Board_Members_Arr_Rel_Insert_Input = {
  data: Array<Board_Members_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Board_Members_On_Conflict>;
};

/** Boolean expression to filter rows from the table "board_members". All fields are combined with a logical 'AND'. */
export type Board_Members_Bool_Exp = {
  _and?: InputMaybe<Array<Board_Members_Bool_Exp>>;
  _not?: InputMaybe<Board_Members_Bool_Exp>;
  _or?: InputMaybe<Array<Board_Members_Bool_Exp>>;
  board?: InputMaybe<Boards_Bool_Exp>;
  board_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  role?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "board_members" */
export enum Board_Members_Constraint {
  /** unique or primary key constraint on columns "user_id", "board_id" */
  BoardMembersBoardUserUnique = 'board_members_board_user_unique',
  /** unique or primary key constraint on columns "id" */
  BoardMembersPkey = 'board_members_pkey'
}

/** input type for inserting data into table "board_members" */
export type Board_Members_Insert_Input = {
  board?: InputMaybe<Boards_Obj_Rel_Insert_Input>;
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Board_Members_Max_Fields = {
  __typename?: 'board_members_max_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "board_members" */
export type Board_Members_Max_Order_By = {
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Board_Members_Min_Fields = {
  __typename?: 'board_members_min_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "board_members" */
export type Board_Members_Min_Order_By = {
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "board_members" */
export type Board_Members_Mutation_Response = {
  __typename?: 'board_members_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Board_Members>;
};

/** on_conflict condition type for table "board_members" */
export type Board_Members_On_Conflict = {
  constraint: Board_Members_Constraint;
  update_columns?: Array<Board_Members_Update_Column>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};

/** Ordering options when selecting data from "board_members". */
export type Board_Members_Order_By = {
  board?: InputMaybe<Boards_Order_By>;
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: board_members */
export type Board_Members_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "board_members" */
export enum Board_Members_Select_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Role = 'role',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "board_members" */
export type Board_Members_Set_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "board_members" */
export type Board_Members_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Board_Members_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Board_Members_Stream_Cursor_Value_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  /** User role: owner (full control), editor (can modify), viewer (read-only) */
  role?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "board_members" */
export enum Board_Members_Update_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Role = 'role',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

export type Board_Members_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Board_Members_Set_Input>;
  /** filter the rows which have to be updated */
  where: Board_Members_Bool_Exp;
};

/** columns and relationships of "boards" */
export type Boards = {
  __typename?: 'boards';
  alias: Scalars['String']['output'];
  /** When true and is_public=true, non-members can comment on todos */
  allow_public_comments: Scalars['Boolean']['output'];
  /** An array relationship */
  board_invitations: Array<Board_Invitations>;
  /** An aggregate relationship */
  board_invitations_aggregate: Board_Invitations_Aggregate;
  /** An array relationship */
  board_members: Array<Board_Members>;
  /** An aggregate relationship */
  board_members_aggregate: Board_Members_Aggregate;
  created_at: Scalars['timestamptz']['output'];
  github?: Maybe<Scalars['String']['output']>;
  id: Scalars['uuid']['output'];
  /** When true, board is viewable by anyone (read-only unless member) */
  is_public: Scalars['Boolean']['output'];
  /** An array relationship */
  labels: Array<Labels>;
  /** An aggregate relationship */
  labels_aggregate: Labels_Aggregate;
  /** An array relationship */
  lists: Array<Lists>;
  /** An aggregate relationship */
  lists_aggregate: Lists_Aggregate;
  name: Scalars['String']['output'];
  sort_order: Scalars['Int']['output'];
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  user: Users;
  user_id: Scalars['uuid']['output'];
};


/** columns and relationships of "boards" */
export type BoardsBoard_InvitationsArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


/** columns and relationships of "boards" */
export type BoardsBoard_Invitations_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


/** columns and relationships of "boards" */
export type BoardsBoard_MembersArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


/** columns and relationships of "boards" */
export type BoardsBoard_Members_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


/** columns and relationships of "boards" */
export type BoardsLabelsArgs = {
  distinct_on?: InputMaybe<Array<Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Labels_Order_By>>;
  where?: InputMaybe<Labels_Bool_Exp>;
};


/** columns and relationships of "boards" */
export type BoardsLabels_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Labels_Order_By>>;
  where?: InputMaybe<Labels_Bool_Exp>;
};


/** columns and relationships of "boards" */
export type BoardsListsArgs = {
  distinct_on?: InputMaybe<Array<Lists_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lists_Order_By>>;
  where?: InputMaybe<Lists_Bool_Exp>;
};


/** columns and relationships of "boards" */
export type BoardsLists_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lists_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lists_Order_By>>;
  where?: InputMaybe<Lists_Bool_Exp>;
};

/** aggregated selection of "boards" */
export type Boards_Aggregate = {
  __typename?: 'boards_aggregate';
  aggregate?: Maybe<Boards_Aggregate_Fields>;
  nodes: Array<Boards>;
};

export type Boards_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Boards_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Boards_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Boards_Aggregate_Bool_Exp_Count>;
};

export type Boards_Aggregate_Bool_Exp_Bool_And = {
  arguments: Boards_Select_Column_Boards_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Boards_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Boards_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Boards_Select_Column_Boards_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Boards_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Boards_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Boards_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Boards_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "boards" */
export type Boards_Aggregate_Fields = {
  __typename?: 'boards_aggregate_fields';
  avg?: Maybe<Boards_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Boards_Max_Fields>;
  min?: Maybe<Boards_Min_Fields>;
  stddev?: Maybe<Boards_Stddev_Fields>;
  stddev_pop?: Maybe<Boards_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Boards_Stddev_Samp_Fields>;
  sum?: Maybe<Boards_Sum_Fields>;
  var_pop?: Maybe<Boards_Var_Pop_Fields>;
  var_samp?: Maybe<Boards_Var_Samp_Fields>;
  variance?: Maybe<Boards_Variance_Fields>;
};


/** aggregate fields of "boards" */
export type Boards_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Boards_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "boards" */
export type Boards_Aggregate_Order_By = {
  avg?: InputMaybe<Boards_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Boards_Max_Order_By>;
  min?: InputMaybe<Boards_Min_Order_By>;
  stddev?: InputMaybe<Boards_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Boards_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Boards_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Boards_Sum_Order_By>;
  var_pop?: InputMaybe<Boards_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Boards_Var_Samp_Order_By>;
  variance?: InputMaybe<Boards_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "boards" */
export type Boards_Arr_Rel_Insert_Input = {
  data: Array<Boards_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Boards_On_Conflict>;
};

/** aggregate avg on columns */
export type Boards_Avg_Fields = {
  __typename?: 'boards_avg_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "boards" */
export type Boards_Avg_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "boards". All fields are combined with a logical 'AND'. */
export type Boards_Bool_Exp = {
  _and?: InputMaybe<Array<Boards_Bool_Exp>>;
  _not?: InputMaybe<Boards_Bool_Exp>;
  _or?: InputMaybe<Array<Boards_Bool_Exp>>;
  alias?: InputMaybe<String_Comparison_Exp>;
  allow_public_comments?: InputMaybe<Boolean_Comparison_Exp>;
  board_invitations?: InputMaybe<Board_Invitations_Bool_Exp>;
  board_invitations_aggregate?: InputMaybe<Board_Invitations_Aggregate_Bool_Exp>;
  board_members?: InputMaybe<Board_Members_Bool_Exp>;
  board_members_aggregate?: InputMaybe<Board_Members_Aggregate_Bool_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  github?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  is_public?: InputMaybe<Boolean_Comparison_Exp>;
  labels?: InputMaybe<Labels_Bool_Exp>;
  labels_aggregate?: InputMaybe<Labels_Aggregate_Bool_Exp>;
  lists?: InputMaybe<Lists_Bool_Exp>;
  lists_aggregate?: InputMaybe<Lists_Aggregate_Bool_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  sort_order?: InputMaybe<Int_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "boards" */
export enum Boards_Constraint {
  /** unique or primary key constraint on columns "alias" */
  BoardsAliasKey = 'boards_alias_key',
  /** unique or primary key constraint on columns "id" */
  BoardsPkey = 'boards_pkey'
}

/** input type for incrementing numeric columns in table "boards" */
export type Boards_Inc_Input = {
  sort_order?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "boards" */
export type Boards_Insert_Input = {
  alias?: InputMaybe<Scalars['String']['input']>;
  /** When true and is_public=true, non-members can comment on todos */
  allow_public_comments?: InputMaybe<Scalars['Boolean']['input']>;
  board_invitations?: InputMaybe<Board_Invitations_Arr_Rel_Insert_Input>;
  board_members?: InputMaybe<Board_Members_Arr_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  github?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  /** When true, board is viewable by anyone (read-only unless member) */
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  labels?: InputMaybe<Labels_Arr_Rel_Insert_Input>;
  lists?: InputMaybe<Lists_Arr_Rel_Insert_Input>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Boards_Max_Fields = {
  __typename?: 'boards_max_fields';
  alias?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  github?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "boards" */
export type Boards_Max_Order_By = {
  alias?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  github?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Boards_Min_Fields = {
  __typename?: 'boards_min_fields';
  alias?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  github?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "boards" */
export type Boards_Min_Order_By = {
  alias?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  github?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "boards" */
export type Boards_Mutation_Response = {
  __typename?: 'boards_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Boards>;
};

/** input type for inserting object relation for remote table "boards" */
export type Boards_Obj_Rel_Insert_Input = {
  data: Boards_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Boards_On_Conflict>;
};

/** on_conflict condition type for table "boards" */
export type Boards_On_Conflict = {
  constraint: Boards_Constraint;
  update_columns?: Array<Boards_Update_Column>;
  where?: InputMaybe<Boards_Bool_Exp>;
};

/** Ordering options when selecting data from "boards". */
export type Boards_Order_By = {
  alias?: InputMaybe<Order_By>;
  allow_public_comments?: InputMaybe<Order_By>;
  board_invitations_aggregate?: InputMaybe<Board_Invitations_Aggregate_Order_By>;
  board_members_aggregate?: InputMaybe<Board_Members_Aggregate_Order_By>;
  created_at?: InputMaybe<Order_By>;
  github?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_public?: InputMaybe<Order_By>;
  labels_aggregate?: InputMaybe<Labels_Aggregate_Order_By>;
  lists_aggregate?: InputMaybe<Lists_Aggregate_Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: boards */
export type Boards_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "boards" */
export enum Boards_Select_Column {
  /** column name */
  Alias = 'alias',
  /** column name */
  AllowPublicComments = 'allow_public_comments',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Github = 'github',
  /** column name */
  Id = 'id',
  /** column name */
  IsPublic = 'is_public',
  /** column name */
  Name = 'name',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

/** select "boards_aggregate_bool_exp_bool_and_arguments_columns" columns of table "boards" */
export enum Boards_Select_Column_Boards_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  AllowPublicComments = 'allow_public_comments',
  /** column name */
  IsPublic = 'is_public'
}

/** select "boards_aggregate_bool_exp_bool_or_arguments_columns" columns of table "boards" */
export enum Boards_Select_Column_Boards_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  AllowPublicComments = 'allow_public_comments',
  /** column name */
  IsPublic = 'is_public'
}

/** input type for updating data in table "boards" */
export type Boards_Set_Input = {
  alias?: InputMaybe<Scalars['String']['input']>;
  /** When true and is_public=true, non-members can comment on todos */
  allow_public_comments?: InputMaybe<Scalars['Boolean']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  github?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  /** When true, board is viewable by anyone (read-only unless member) */
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate stddev on columns */
export type Boards_Stddev_Fields = {
  __typename?: 'boards_stddev_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "boards" */
export type Boards_Stddev_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Boards_Stddev_Pop_Fields = {
  __typename?: 'boards_stddev_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "boards" */
export type Boards_Stddev_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Boards_Stddev_Samp_Fields = {
  __typename?: 'boards_stddev_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "boards" */
export type Boards_Stddev_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "boards" */
export type Boards_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Boards_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Boards_Stream_Cursor_Value_Input = {
  alias?: InputMaybe<Scalars['String']['input']>;
  /** When true and is_public=true, non-members can comment on todos */
  allow_public_comments?: InputMaybe<Scalars['Boolean']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  github?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  /** When true, board is viewable by anyone (read-only unless member) */
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate sum on columns */
export type Boards_Sum_Fields = {
  __typename?: 'boards_sum_fields';
  sort_order?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "boards" */
export type Boards_Sum_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** update columns of table "boards" */
export enum Boards_Update_Column {
  /** column name */
  Alias = 'alias',
  /** column name */
  AllowPublicComments = 'allow_public_comments',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Github = 'github',
  /** column name */
  Id = 'id',
  /** column name */
  IsPublic = 'is_public',
  /** column name */
  Name = 'name',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

export type Boards_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Boards_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Boards_Set_Input>;
  /** filter the rows which have to be updated */
  where: Boards_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Boards_Var_Pop_Fields = {
  __typename?: 'boards_var_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "boards" */
export type Boards_Var_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Boards_Var_Samp_Fields = {
  __typename?: 'boards_var_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "boards" */
export type Boards_Var_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Boards_Variance_Fields = {
  __typename?: 'boards_variance_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "boards" */
export type Boards_Variance_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** columns and relationships of "comments" */
export type Comments = {
  __typename?: 'comments';
  content: Scalars['String']['output'];
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id: Scalars['uuid']['output'];
  /** An object relationship */
  todo: Todos;
  todo_id: Scalars['uuid']['output'];
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  /** An object relationship */
  user: Users;
  user_id: Scalars['uuid']['output'];
};

/** aggregated selection of "comments" */
export type Comments_Aggregate = {
  __typename?: 'comments_aggregate';
  aggregate?: Maybe<Comments_Aggregate_Fields>;
  nodes: Array<Comments>;
};

export type Comments_Aggregate_Bool_Exp = {
  count?: InputMaybe<Comments_Aggregate_Bool_Exp_Count>;
};

export type Comments_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Comments_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Comments_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "comments" */
export type Comments_Aggregate_Fields = {
  __typename?: 'comments_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Comments_Max_Fields>;
  min?: Maybe<Comments_Min_Fields>;
};


/** aggregate fields of "comments" */
export type Comments_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Comments_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "comments" */
export type Comments_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Comments_Max_Order_By>;
  min?: InputMaybe<Comments_Min_Order_By>;
};

/** input type for inserting array relation for remote table "comments" */
export type Comments_Arr_Rel_Insert_Input = {
  data: Array<Comments_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Comments_On_Conflict>;
};

/** Boolean expression to filter rows from the table "comments". All fields are combined with a logical 'AND'. */
export type Comments_Bool_Exp = {
  _and?: InputMaybe<Array<Comments_Bool_Exp>>;
  _not?: InputMaybe<Comments_Bool_Exp>;
  _or?: InputMaybe<Array<Comments_Bool_Exp>>;
  content?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  todo?: InputMaybe<Todos_Bool_Exp>;
  todo_id?: InputMaybe<Uuid_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "comments" */
export enum Comments_Constraint {
  /** unique or primary key constraint on columns "id" */
  CommentsPkey = 'comments_pkey'
}

/** input type for inserting data into table "comments" */
export type Comments_Insert_Input = {
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  todo?: InputMaybe<Todos_Obj_Rel_Insert_Input>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Comments_Max_Fields = {
  __typename?: 'comments_max_fields';
  content?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  todo_id?: Maybe<Scalars['uuid']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "comments" */
export type Comments_Max_Order_By = {
  content?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  todo_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Comments_Min_Fields = {
  __typename?: 'comments_min_fields';
  content?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  todo_id?: Maybe<Scalars['uuid']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "comments" */
export type Comments_Min_Order_By = {
  content?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  todo_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "comments" */
export type Comments_Mutation_Response = {
  __typename?: 'comments_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Comments>;
};

/** on_conflict condition type for table "comments" */
export type Comments_On_Conflict = {
  constraint: Comments_Constraint;
  update_columns?: Array<Comments_Update_Column>;
  where?: InputMaybe<Comments_Bool_Exp>;
};

/** Ordering options when selecting data from "comments". */
export type Comments_Order_By = {
  content?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  todo?: InputMaybe<Todos_Order_By>;
  todo_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: comments */
export type Comments_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "comments" */
export enum Comments_Select_Column {
  /** column name */
  Content = 'content',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  TodoId = 'todo_id',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "comments" */
export type Comments_Set_Input = {
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "comments" */
export type Comments_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Comments_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Comments_Stream_Cursor_Value_Input = {
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "comments" */
export enum Comments_Update_Column {
  /** column name */
  Content = 'content',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  TodoId = 'todo_id',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

export type Comments_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Comments_Set_Input>;
  /** filter the rows which have to be updated */
  where: Comments_Bool_Exp;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = 'ASC',
  /** descending ordering of the cursor */
  Desc = 'DESC'
}

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>;
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']['input']>;
  _eq?: InputMaybe<Scalars['jsonb']['input']>;
  _gt?: InputMaybe<Scalars['jsonb']['input']>;
  _gte?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']['input']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']['input']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']['input']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['jsonb']['input']>;
  _lte?: InputMaybe<Scalars['jsonb']['input']>;
  _neq?: InputMaybe<Scalars['jsonb']['input']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']['input']>>;
};

/** columns and relationships of "labels" */
export type Labels = {
  __typename?: 'labels';
  /** An object relationship */
  board: Boards;
  board_id: Scalars['uuid']['output'];
  color: Scalars['String']['output'];
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id: Scalars['uuid']['output'];
  name: Scalars['String']['output'];
  sort_order?: Maybe<Scalars['Int']['output']>;
  /** An array relationship */
  todo_labels: Array<Todo_Labels>;
  /** An aggregate relationship */
  todo_labels_aggregate: Todo_Labels_Aggregate;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};


/** columns and relationships of "labels" */
export type LabelsTodo_LabelsArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


/** columns and relationships of "labels" */
export type LabelsTodo_Labels_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};

/** aggregated selection of "labels" */
export type Labels_Aggregate = {
  __typename?: 'labels_aggregate';
  aggregate?: Maybe<Labels_Aggregate_Fields>;
  nodes: Array<Labels>;
};

export type Labels_Aggregate_Bool_Exp = {
  count?: InputMaybe<Labels_Aggregate_Bool_Exp_Count>;
};

export type Labels_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Labels_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Labels_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "labels" */
export type Labels_Aggregate_Fields = {
  __typename?: 'labels_aggregate_fields';
  avg?: Maybe<Labels_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Labels_Max_Fields>;
  min?: Maybe<Labels_Min_Fields>;
  stddev?: Maybe<Labels_Stddev_Fields>;
  stddev_pop?: Maybe<Labels_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Labels_Stddev_Samp_Fields>;
  sum?: Maybe<Labels_Sum_Fields>;
  var_pop?: Maybe<Labels_Var_Pop_Fields>;
  var_samp?: Maybe<Labels_Var_Samp_Fields>;
  variance?: Maybe<Labels_Variance_Fields>;
};


/** aggregate fields of "labels" */
export type Labels_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Labels_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "labels" */
export type Labels_Aggregate_Order_By = {
  avg?: InputMaybe<Labels_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Labels_Max_Order_By>;
  min?: InputMaybe<Labels_Min_Order_By>;
  stddev?: InputMaybe<Labels_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Labels_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Labels_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Labels_Sum_Order_By>;
  var_pop?: InputMaybe<Labels_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Labels_Var_Samp_Order_By>;
  variance?: InputMaybe<Labels_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "labels" */
export type Labels_Arr_Rel_Insert_Input = {
  data: Array<Labels_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Labels_On_Conflict>;
};

/** aggregate avg on columns */
export type Labels_Avg_Fields = {
  __typename?: 'labels_avg_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "labels" */
export type Labels_Avg_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "labels". All fields are combined with a logical 'AND'. */
export type Labels_Bool_Exp = {
  _and?: InputMaybe<Array<Labels_Bool_Exp>>;
  _not?: InputMaybe<Labels_Bool_Exp>;
  _or?: InputMaybe<Array<Labels_Bool_Exp>>;
  board?: InputMaybe<Boards_Bool_Exp>;
  board_id?: InputMaybe<Uuid_Comparison_Exp>;
  color?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  sort_order?: InputMaybe<Int_Comparison_Exp>;
  todo_labels?: InputMaybe<Todo_Labels_Bool_Exp>;
  todo_labels_aggregate?: InputMaybe<Todo_Labels_Aggregate_Bool_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "labels" */
export enum Labels_Constraint {
  /** unique or primary key constraint on columns "id" */
  LabelsPkey = 'labels_pkey'
}

/** input type for incrementing numeric columns in table "labels" */
export type Labels_Inc_Input = {
  sort_order?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "labels" */
export type Labels_Insert_Input = {
  board?: InputMaybe<Boards_Obj_Rel_Insert_Input>;
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  todo_labels?: InputMaybe<Todo_Labels_Arr_Rel_Insert_Input>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate max on columns */
export type Labels_Max_Fields = {
  __typename?: 'labels_max_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "labels" */
export type Labels_Max_Order_By = {
  board_id?: InputMaybe<Order_By>;
  color?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Labels_Min_Fields = {
  __typename?: 'labels_min_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "labels" */
export type Labels_Min_Order_By = {
  board_id?: InputMaybe<Order_By>;
  color?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "labels" */
export type Labels_Mutation_Response = {
  __typename?: 'labels_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Labels>;
};

/** input type for inserting object relation for remote table "labels" */
export type Labels_Obj_Rel_Insert_Input = {
  data: Labels_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Labels_On_Conflict>;
};

/** on_conflict condition type for table "labels" */
export type Labels_On_Conflict = {
  constraint: Labels_Constraint;
  update_columns?: Array<Labels_Update_Column>;
  where?: InputMaybe<Labels_Bool_Exp>;
};

/** Ordering options when selecting data from "labels". */
export type Labels_Order_By = {
  board?: InputMaybe<Boards_Order_By>;
  board_id?: InputMaybe<Order_By>;
  color?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  todo_labels_aggregate?: InputMaybe<Todo_Labels_Aggregate_Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: labels */
export type Labels_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "labels" */
export enum Labels_Select_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  Color = 'color',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  UpdatedAt = 'updated_at'
}

/** input type for updating data in table "labels" */
export type Labels_Set_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate stddev on columns */
export type Labels_Stddev_Fields = {
  __typename?: 'labels_stddev_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "labels" */
export type Labels_Stddev_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Labels_Stddev_Pop_Fields = {
  __typename?: 'labels_stddev_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "labels" */
export type Labels_Stddev_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Labels_Stddev_Samp_Fields = {
  __typename?: 'labels_stddev_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "labels" */
export type Labels_Stddev_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "labels" */
export type Labels_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Labels_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Labels_Stream_Cursor_Value_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Labels_Sum_Fields = {
  __typename?: 'labels_sum_fields';
  sort_order?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "labels" */
export type Labels_Sum_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** update columns of table "labels" */
export enum Labels_Update_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  Color = 'color',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  UpdatedAt = 'updated_at'
}

export type Labels_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Labels_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Labels_Set_Input>;
  /** filter the rows which have to be updated */
  where: Labels_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Labels_Var_Pop_Fields = {
  __typename?: 'labels_var_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "labels" */
export type Labels_Var_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Labels_Var_Samp_Fields = {
  __typename?: 'labels_var_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "labels" */
export type Labels_Var_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Labels_Variance_Fields = {
  __typename?: 'labels_variance_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "labels" */
export type Labels_Variance_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** columns and relationships of "lists" */
export type Lists = {
  __typename?: 'lists';
  /** An object relationship */
  board?: Maybe<Boards>;
  board_id?: Maybe<Scalars['uuid']['output']>;
  created_at: Scalars['timestamptz']['output'];
  id: Scalars['uuid']['output'];
  name: Scalars['String']['output'];
  sort_order: Scalars['Int']['output'];
  /** An array relationship */
  todos: Array<Todos>;
  /** An aggregate relationship */
  todos_aggregate: Todos_Aggregate;
  updated_at: Scalars['timestamptz']['output'];
};


/** columns and relationships of "lists" */
export type ListsTodosArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};


/** columns and relationships of "lists" */
export type ListsTodos_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};

/** aggregated selection of "lists" */
export type Lists_Aggregate = {
  __typename?: 'lists_aggregate';
  aggregate?: Maybe<Lists_Aggregate_Fields>;
  nodes: Array<Lists>;
};

export type Lists_Aggregate_Bool_Exp = {
  count?: InputMaybe<Lists_Aggregate_Bool_Exp_Count>;
};

export type Lists_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Lists_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Lists_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "lists" */
export type Lists_Aggregate_Fields = {
  __typename?: 'lists_aggregate_fields';
  avg?: Maybe<Lists_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Lists_Max_Fields>;
  min?: Maybe<Lists_Min_Fields>;
  stddev?: Maybe<Lists_Stddev_Fields>;
  stddev_pop?: Maybe<Lists_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Lists_Stddev_Samp_Fields>;
  sum?: Maybe<Lists_Sum_Fields>;
  var_pop?: Maybe<Lists_Var_Pop_Fields>;
  var_samp?: Maybe<Lists_Var_Samp_Fields>;
  variance?: Maybe<Lists_Variance_Fields>;
};


/** aggregate fields of "lists" */
export type Lists_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Lists_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "lists" */
export type Lists_Aggregate_Order_By = {
  avg?: InputMaybe<Lists_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Lists_Max_Order_By>;
  min?: InputMaybe<Lists_Min_Order_By>;
  stddev?: InputMaybe<Lists_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Lists_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Lists_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Lists_Sum_Order_By>;
  var_pop?: InputMaybe<Lists_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Lists_Var_Samp_Order_By>;
  variance?: InputMaybe<Lists_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "lists" */
export type Lists_Arr_Rel_Insert_Input = {
  data: Array<Lists_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Lists_On_Conflict>;
};

/** aggregate avg on columns */
export type Lists_Avg_Fields = {
  __typename?: 'lists_avg_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "lists" */
export type Lists_Avg_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "lists". All fields are combined with a logical 'AND'. */
export type Lists_Bool_Exp = {
  _and?: InputMaybe<Array<Lists_Bool_Exp>>;
  _not?: InputMaybe<Lists_Bool_Exp>;
  _or?: InputMaybe<Array<Lists_Bool_Exp>>;
  board?: InputMaybe<Boards_Bool_Exp>;
  board_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  sort_order?: InputMaybe<Int_Comparison_Exp>;
  todos?: InputMaybe<Todos_Bool_Exp>;
  todos_aggregate?: InputMaybe<Todos_Aggregate_Bool_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "lists" */
export enum Lists_Constraint {
  /** unique or primary key constraint on columns "id" */
  ListsPkey = 'lists_pkey'
}

/** input type for incrementing numeric columns in table "lists" */
export type Lists_Inc_Input = {
  sort_order?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "lists" */
export type Lists_Insert_Input = {
  board?: InputMaybe<Boards_Obj_Rel_Insert_Input>;
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  todos?: InputMaybe<Todos_Arr_Rel_Insert_Input>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate max on columns */
export type Lists_Max_Fields = {
  __typename?: 'lists_max_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "lists" */
export type Lists_Max_Order_By = {
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Lists_Min_Fields = {
  __typename?: 'lists_min_fields';
  board_id?: Maybe<Scalars['uuid']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "lists" */
export type Lists_Min_Order_By = {
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "lists" */
export type Lists_Mutation_Response = {
  __typename?: 'lists_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Lists>;
};

/** input type for inserting object relation for remote table "lists" */
export type Lists_Obj_Rel_Insert_Input = {
  data: Lists_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Lists_On_Conflict>;
};

/** on_conflict condition type for table "lists" */
export type Lists_On_Conflict = {
  constraint: Lists_Constraint;
  update_columns?: Array<Lists_Update_Column>;
  where?: InputMaybe<Lists_Bool_Exp>;
};

/** Ordering options when selecting data from "lists". */
export type Lists_Order_By = {
  board?: InputMaybe<Boards_Order_By>;
  board_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  todos_aggregate?: InputMaybe<Todos_Aggregate_Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: lists */
export type Lists_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "lists" */
export enum Lists_Select_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  UpdatedAt = 'updated_at'
}

/** input type for updating data in table "lists" */
export type Lists_Set_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate stddev on columns */
export type Lists_Stddev_Fields = {
  __typename?: 'lists_stddev_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "lists" */
export type Lists_Stddev_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Lists_Stddev_Pop_Fields = {
  __typename?: 'lists_stddev_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "lists" */
export type Lists_Stddev_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Lists_Stddev_Samp_Fields = {
  __typename?: 'lists_stddev_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "lists" */
export type Lists_Stddev_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "lists" */
export type Lists_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Lists_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Lists_Stream_Cursor_Value_Input = {
  board_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Lists_Sum_Fields = {
  __typename?: 'lists_sum_fields';
  sort_order?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "lists" */
export type Lists_Sum_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** update columns of table "lists" */
export enum Lists_Update_Column {
  /** column name */
  BoardId = 'board_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  UpdatedAt = 'updated_at'
}

export type Lists_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Lists_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Lists_Set_Input>;
  /** filter the rows which have to be updated */
  where: Lists_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Lists_Var_Pop_Fields = {
  __typename?: 'lists_var_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "lists" */
export type Lists_Var_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Lists_Var_Samp_Fields = {
  __typename?: 'lists_var_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "lists" */
export type Lists_Var_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Lists_Variance_Fields = {
  __typename?: 'lists_variance_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "lists" */
export type Lists_Variance_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  /** delete data from the table: "accounts" */
  delete_accounts?: Maybe<Accounts_Mutation_Response>;
  /** delete single row from the table: "accounts" */
  delete_accounts_by_pk?: Maybe<Accounts>;
  /** delete data from the table: "board_invitations" */
  delete_board_invitations?: Maybe<Board_Invitations_Mutation_Response>;
  /** delete single row from the table: "board_invitations" */
  delete_board_invitations_by_pk?: Maybe<Board_Invitations>;
  /** delete data from the table: "board_members" */
  delete_board_members?: Maybe<Board_Members_Mutation_Response>;
  /** delete single row from the table: "board_members" */
  delete_board_members_by_pk?: Maybe<Board_Members>;
  /** delete data from the table: "boards" */
  delete_boards?: Maybe<Boards_Mutation_Response>;
  /** delete single row from the table: "boards" */
  delete_boards_by_pk?: Maybe<Boards>;
  /** delete data from the table: "comments" */
  delete_comments?: Maybe<Comments_Mutation_Response>;
  /** delete single row from the table: "comments" */
  delete_comments_by_pk?: Maybe<Comments>;
  /** delete data from the table: "labels" */
  delete_labels?: Maybe<Labels_Mutation_Response>;
  /** delete single row from the table: "labels" */
  delete_labels_by_pk?: Maybe<Labels>;
  /** delete data from the table: "lists" */
  delete_lists?: Maybe<Lists_Mutation_Response>;
  /** delete single row from the table: "lists" */
  delete_lists_by_pk?: Maybe<Lists>;
  /** delete data from the table: "sessions" */
  delete_sessions?: Maybe<Sessions_Mutation_Response>;
  /** delete single row from the table: "sessions" */
  delete_sessions_by_pk?: Maybe<Sessions>;
  /** delete data from the table: "todo_labels" */
  delete_todo_labels?: Maybe<Todo_Labels_Mutation_Response>;
  /** delete single row from the table: "todo_labels" */
  delete_todo_labels_by_pk?: Maybe<Todo_Labels>;
  /** delete data from the table: "todos" */
  delete_todos?: Maybe<Todos_Mutation_Response>;
  /** delete single row from the table: "todos" */
  delete_todos_by_pk?: Maybe<Todos>;
  /** delete data from the table: "uploads" */
  delete_uploads?: Maybe<Uploads_Mutation_Response>;
  /** delete single row from the table: "uploads" */
  delete_uploads_by_pk?: Maybe<Uploads>;
  /** delete data from the table: "users" */
  delete_users?: Maybe<Users_Mutation_Response>;
  /** delete single row from the table: "users" */
  delete_users_by_pk?: Maybe<Users>;
  /** delete data from the table: "verification_tokens" */
  delete_verification_tokens?: Maybe<Verification_Tokens_Mutation_Response>;
  /** delete single row from the table: "verification_tokens" */
  delete_verification_tokens_by_pk?: Maybe<Verification_Tokens>;
  /** insert data into the table: "accounts" */
  insert_accounts?: Maybe<Accounts_Mutation_Response>;
  /** insert a single row into the table: "accounts" */
  insert_accounts_one?: Maybe<Accounts>;
  /** insert data into the table: "board_invitations" */
  insert_board_invitations?: Maybe<Board_Invitations_Mutation_Response>;
  /** insert a single row into the table: "board_invitations" */
  insert_board_invitations_one?: Maybe<Board_Invitations>;
  /** insert data into the table: "board_members" */
  insert_board_members?: Maybe<Board_Members_Mutation_Response>;
  /** insert a single row into the table: "board_members" */
  insert_board_members_one?: Maybe<Board_Members>;
  /** insert data into the table: "boards" */
  insert_boards?: Maybe<Boards_Mutation_Response>;
  /** insert a single row into the table: "boards" */
  insert_boards_one?: Maybe<Boards>;
  /** insert data into the table: "comments" */
  insert_comments?: Maybe<Comments_Mutation_Response>;
  /** insert a single row into the table: "comments" */
  insert_comments_one?: Maybe<Comments>;
  /** insert data into the table: "labels" */
  insert_labels?: Maybe<Labels_Mutation_Response>;
  /** insert a single row into the table: "labels" */
  insert_labels_one?: Maybe<Labels>;
  /** insert data into the table: "lists" */
  insert_lists?: Maybe<Lists_Mutation_Response>;
  /** insert a single row into the table: "lists" */
  insert_lists_one?: Maybe<Lists>;
  /** insert data into the table: "sessions" */
  insert_sessions?: Maybe<Sessions_Mutation_Response>;
  /** insert a single row into the table: "sessions" */
  insert_sessions_one?: Maybe<Sessions>;
  /** insert data into the table: "todo_labels" */
  insert_todo_labels?: Maybe<Todo_Labels_Mutation_Response>;
  /** insert a single row into the table: "todo_labels" */
  insert_todo_labels_one?: Maybe<Todo_Labels>;
  /** insert data into the table: "todos" */
  insert_todos?: Maybe<Todos_Mutation_Response>;
  /** insert a single row into the table: "todos" */
  insert_todos_one?: Maybe<Todos>;
  /** insert data into the table: "uploads" */
  insert_uploads?: Maybe<Uploads_Mutation_Response>;
  /** insert a single row into the table: "uploads" */
  insert_uploads_one?: Maybe<Uploads>;
  /** insert data into the table: "users" */
  insert_users?: Maybe<Users_Mutation_Response>;
  /** insert a single row into the table: "users" */
  insert_users_one?: Maybe<Users>;
  /** insert data into the table: "verification_tokens" */
  insert_verification_tokens?: Maybe<Verification_Tokens_Mutation_Response>;
  /** insert a single row into the table: "verification_tokens" */
  insert_verification_tokens_one?: Maybe<Verification_Tokens>;
  /** update data of the table: "accounts" */
  update_accounts?: Maybe<Accounts_Mutation_Response>;
  /** update single row of the table: "accounts" */
  update_accounts_by_pk?: Maybe<Accounts>;
  /** update multiples rows of table: "accounts" */
  update_accounts_many?: Maybe<Array<Maybe<Accounts_Mutation_Response>>>;
  /** update data of the table: "board_invitations" */
  update_board_invitations?: Maybe<Board_Invitations_Mutation_Response>;
  /** update single row of the table: "board_invitations" */
  update_board_invitations_by_pk?: Maybe<Board_Invitations>;
  /** update multiples rows of table: "board_invitations" */
  update_board_invitations_many?: Maybe<Array<Maybe<Board_Invitations_Mutation_Response>>>;
  /** update data of the table: "board_members" */
  update_board_members?: Maybe<Board_Members_Mutation_Response>;
  /** update single row of the table: "board_members" */
  update_board_members_by_pk?: Maybe<Board_Members>;
  /** update multiples rows of table: "board_members" */
  update_board_members_many?: Maybe<Array<Maybe<Board_Members_Mutation_Response>>>;
  /** update data of the table: "boards" */
  update_boards?: Maybe<Boards_Mutation_Response>;
  /** update single row of the table: "boards" */
  update_boards_by_pk?: Maybe<Boards>;
  /** update multiples rows of table: "boards" */
  update_boards_many?: Maybe<Array<Maybe<Boards_Mutation_Response>>>;
  /** update data of the table: "comments" */
  update_comments?: Maybe<Comments_Mutation_Response>;
  /** update single row of the table: "comments" */
  update_comments_by_pk?: Maybe<Comments>;
  /** update multiples rows of table: "comments" */
  update_comments_many?: Maybe<Array<Maybe<Comments_Mutation_Response>>>;
  /** update data of the table: "labels" */
  update_labels?: Maybe<Labels_Mutation_Response>;
  /** update single row of the table: "labels" */
  update_labels_by_pk?: Maybe<Labels>;
  /** update multiples rows of table: "labels" */
  update_labels_many?: Maybe<Array<Maybe<Labels_Mutation_Response>>>;
  /** update data of the table: "lists" */
  update_lists?: Maybe<Lists_Mutation_Response>;
  /** update single row of the table: "lists" */
  update_lists_by_pk?: Maybe<Lists>;
  /** update multiples rows of table: "lists" */
  update_lists_many?: Maybe<Array<Maybe<Lists_Mutation_Response>>>;
  /** update data of the table: "sessions" */
  update_sessions?: Maybe<Sessions_Mutation_Response>;
  /** update single row of the table: "sessions" */
  update_sessions_by_pk?: Maybe<Sessions>;
  /** update multiples rows of table: "sessions" */
  update_sessions_many?: Maybe<Array<Maybe<Sessions_Mutation_Response>>>;
  /** update data of the table: "todo_labels" */
  update_todo_labels?: Maybe<Todo_Labels_Mutation_Response>;
  /** update single row of the table: "todo_labels" */
  update_todo_labels_by_pk?: Maybe<Todo_Labels>;
  /** update multiples rows of table: "todo_labels" */
  update_todo_labels_many?: Maybe<Array<Maybe<Todo_Labels_Mutation_Response>>>;
  /** update data of the table: "todos" */
  update_todos?: Maybe<Todos_Mutation_Response>;
  /** update single row of the table: "todos" */
  update_todos_by_pk?: Maybe<Todos>;
  /** update multiples rows of table: "todos" */
  update_todos_many?: Maybe<Array<Maybe<Todos_Mutation_Response>>>;
  /** update data of the table: "uploads" */
  update_uploads?: Maybe<Uploads_Mutation_Response>;
  /** update single row of the table: "uploads" */
  update_uploads_by_pk?: Maybe<Uploads>;
  /** update multiples rows of table: "uploads" */
  update_uploads_many?: Maybe<Array<Maybe<Uploads_Mutation_Response>>>;
  /** update data of the table: "users" */
  update_users?: Maybe<Users_Mutation_Response>;
  /** update single row of the table: "users" */
  update_users_by_pk?: Maybe<Users>;
  /** update multiples rows of table: "users" */
  update_users_many?: Maybe<Array<Maybe<Users_Mutation_Response>>>;
  /** update data of the table: "verification_tokens" */
  update_verification_tokens?: Maybe<Verification_Tokens_Mutation_Response>;
  /** update single row of the table: "verification_tokens" */
  update_verification_tokens_by_pk?: Maybe<Verification_Tokens>;
  /** update multiples rows of table: "verification_tokens" */
  update_verification_tokens_many?: Maybe<Array<Maybe<Verification_Tokens_Mutation_Response>>>;
};


/** mutation root */
export type Mutation_RootDelete_AccountsArgs = {
  where: Accounts_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Accounts_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Board_InvitationsArgs = {
  where: Board_Invitations_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Board_Invitations_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Board_MembersArgs = {
  where: Board_Members_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Board_Members_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_BoardsArgs = {
  where: Boards_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Boards_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_CommentsArgs = {
  where: Comments_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Comments_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_LabelsArgs = {
  where: Labels_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Labels_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_ListsArgs = {
  where: Lists_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Lists_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_SessionsArgs = {
  where: Sessions_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Sessions_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Todo_LabelsArgs = {
  where: Todo_Labels_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Todo_Labels_By_PkArgs = {
  label_id: Scalars['uuid']['input'];
  todo_id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_TodosArgs = {
  where: Todos_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Todos_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_UploadsArgs = {
  where: Uploads_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Uploads_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_UsersArgs = {
  where: Users_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Users_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Verification_TokensArgs = {
  where: Verification_Tokens_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Verification_Tokens_By_PkArgs = {
  identifier: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


/** mutation root */
export type Mutation_RootInsert_AccountsArgs = {
  objects: Array<Accounts_Insert_Input>;
  on_conflict?: InputMaybe<Accounts_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Accounts_OneArgs = {
  object: Accounts_Insert_Input;
  on_conflict?: InputMaybe<Accounts_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Board_InvitationsArgs = {
  objects: Array<Board_Invitations_Insert_Input>;
  on_conflict?: InputMaybe<Board_Invitations_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Board_Invitations_OneArgs = {
  object: Board_Invitations_Insert_Input;
  on_conflict?: InputMaybe<Board_Invitations_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Board_MembersArgs = {
  objects: Array<Board_Members_Insert_Input>;
  on_conflict?: InputMaybe<Board_Members_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Board_Members_OneArgs = {
  object: Board_Members_Insert_Input;
  on_conflict?: InputMaybe<Board_Members_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_BoardsArgs = {
  objects: Array<Boards_Insert_Input>;
  on_conflict?: InputMaybe<Boards_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Boards_OneArgs = {
  object: Boards_Insert_Input;
  on_conflict?: InputMaybe<Boards_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_CommentsArgs = {
  objects: Array<Comments_Insert_Input>;
  on_conflict?: InputMaybe<Comments_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Comments_OneArgs = {
  object: Comments_Insert_Input;
  on_conflict?: InputMaybe<Comments_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_LabelsArgs = {
  objects: Array<Labels_Insert_Input>;
  on_conflict?: InputMaybe<Labels_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Labels_OneArgs = {
  object: Labels_Insert_Input;
  on_conflict?: InputMaybe<Labels_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ListsArgs = {
  objects: Array<Lists_Insert_Input>;
  on_conflict?: InputMaybe<Lists_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Lists_OneArgs = {
  object: Lists_Insert_Input;
  on_conflict?: InputMaybe<Lists_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_SessionsArgs = {
  objects: Array<Sessions_Insert_Input>;
  on_conflict?: InputMaybe<Sessions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Sessions_OneArgs = {
  object: Sessions_Insert_Input;
  on_conflict?: InputMaybe<Sessions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Todo_LabelsArgs = {
  objects: Array<Todo_Labels_Insert_Input>;
  on_conflict?: InputMaybe<Todo_Labels_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Todo_Labels_OneArgs = {
  object: Todo_Labels_Insert_Input;
  on_conflict?: InputMaybe<Todo_Labels_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_TodosArgs = {
  objects: Array<Todos_Insert_Input>;
  on_conflict?: InputMaybe<Todos_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Todos_OneArgs = {
  object: Todos_Insert_Input;
  on_conflict?: InputMaybe<Todos_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_UploadsArgs = {
  objects: Array<Uploads_Insert_Input>;
  on_conflict?: InputMaybe<Uploads_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Uploads_OneArgs = {
  object: Uploads_Insert_Input;
  on_conflict?: InputMaybe<Uploads_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_UsersArgs = {
  objects: Array<Users_Insert_Input>;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Users_OneArgs = {
  object: Users_Insert_Input;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Verification_TokensArgs = {
  objects: Array<Verification_Tokens_Insert_Input>;
  on_conflict?: InputMaybe<Verification_Tokens_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Verification_Tokens_OneArgs = {
  object: Verification_Tokens_Insert_Input;
  on_conflict?: InputMaybe<Verification_Tokens_On_Conflict>;
};


/** mutation root */
export type Mutation_RootUpdate_AccountsArgs = {
  _inc?: InputMaybe<Accounts_Inc_Input>;
  _set?: InputMaybe<Accounts_Set_Input>;
  where: Accounts_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Accounts_By_PkArgs = {
  _inc?: InputMaybe<Accounts_Inc_Input>;
  _set?: InputMaybe<Accounts_Set_Input>;
  pk_columns: Accounts_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Accounts_ManyArgs = {
  updates: Array<Accounts_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Board_InvitationsArgs = {
  _set?: InputMaybe<Board_Invitations_Set_Input>;
  where: Board_Invitations_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Board_Invitations_By_PkArgs = {
  _set?: InputMaybe<Board_Invitations_Set_Input>;
  pk_columns: Board_Invitations_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Board_Invitations_ManyArgs = {
  updates: Array<Board_Invitations_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Board_MembersArgs = {
  _set?: InputMaybe<Board_Members_Set_Input>;
  where: Board_Members_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Board_Members_By_PkArgs = {
  _set?: InputMaybe<Board_Members_Set_Input>;
  pk_columns: Board_Members_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Board_Members_ManyArgs = {
  updates: Array<Board_Members_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_BoardsArgs = {
  _inc?: InputMaybe<Boards_Inc_Input>;
  _set?: InputMaybe<Boards_Set_Input>;
  where: Boards_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Boards_By_PkArgs = {
  _inc?: InputMaybe<Boards_Inc_Input>;
  _set?: InputMaybe<Boards_Set_Input>;
  pk_columns: Boards_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Boards_ManyArgs = {
  updates: Array<Boards_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_CommentsArgs = {
  _set?: InputMaybe<Comments_Set_Input>;
  where: Comments_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Comments_By_PkArgs = {
  _set?: InputMaybe<Comments_Set_Input>;
  pk_columns: Comments_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Comments_ManyArgs = {
  updates: Array<Comments_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_LabelsArgs = {
  _inc?: InputMaybe<Labels_Inc_Input>;
  _set?: InputMaybe<Labels_Set_Input>;
  where: Labels_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Labels_By_PkArgs = {
  _inc?: InputMaybe<Labels_Inc_Input>;
  _set?: InputMaybe<Labels_Set_Input>;
  pk_columns: Labels_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Labels_ManyArgs = {
  updates: Array<Labels_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_ListsArgs = {
  _inc?: InputMaybe<Lists_Inc_Input>;
  _set?: InputMaybe<Lists_Set_Input>;
  where: Lists_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Lists_By_PkArgs = {
  _inc?: InputMaybe<Lists_Inc_Input>;
  _set?: InputMaybe<Lists_Set_Input>;
  pk_columns: Lists_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Lists_ManyArgs = {
  updates: Array<Lists_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_SessionsArgs = {
  _set?: InputMaybe<Sessions_Set_Input>;
  where: Sessions_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Sessions_By_PkArgs = {
  _set?: InputMaybe<Sessions_Set_Input>;
  pk_columns: Sessions_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Sessions_ManyArgs = {
  updates: Array<Sessions_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Todo_LabelsArgs = {
  _set?: InputMaybe<Todo_Labels_Set_Input>;
  where: Todo_Labels_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Todo_Labels_By_PkArgs = {
  _set?: InputMaybe<Todo_Labels_Set_Input>;
  pk_columns: Todo_Labels_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Todo_Labels_ManyArgs = {
  updates: Array<Todo_Labels_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_TodosArgs = {
  _inc?: InputMaybe<Todos_Inc_Input>;
  _set?: InputMaybe<Todos_Set_Input>;
  where: Todos_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Todos_By_PkArgs = {
  _inc?: InputMaybe<Todos_Inc_Input>;
  _set?: InputMaybe<Todos_Set_Input>;
  pk_columns: Todos_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Todos_ManyArgs = {
  updates: Array<Todos_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_UploadsArgs = {
  _set?: InputMaybe<Uploads_Set_Input>;
  where: Uploads_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Uploads_By_PkArgs = {
  _set?: InputMaybe<Uploads_Set_Input>;
  pk_columns: Uploads_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Uploads_ManyArgs = {
  updates: Array<Uploads_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_UsersArgs = {
  _append?: InputMaybe<Users_Append_Input>;
  _delete_at_path?: InputMaybe<Users_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Users_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Users_Delete_Key_Input>;
  _prepend?: InputMaybe<Users_Prepend_Input>;
  _set?: InputMaybe<Users_Set_Input>;
  where: Users_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Users_By_PkArgs = {
  _append?: InputMaybe<Users_Append_Input>;
  _delete_at_path?: InputMaybe<Users_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Users_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Users_Delete_Key_Input>;
  _prepend?: InputMaybe<Users_Prepend_Input>;
  _set?: InputMaybe<Users_Set_Input>;
  pk_columns: Users_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Users_ManyArgs = {
  updates: Array<Users_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Verification_TokensArgs = {
  _set?: InputMaybe<Verification_Tokens_Set_Input>;
  where: Verification_Tokens_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Verification_Tokens_By_PkArgs = {
  _set?: InputMaybe<Verification_Tokens_Set_Input>;
  pk_columns: Verification_Tokens_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Verification_Tokens_ManyArgs = {
  updates: Array<Verification_Tokens_Updates>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

export type Query_Root = {
  __typename?: 'query_root';
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** fetch data from the table: "accounts" using primary key columns */
  accounts_by_pk?: Maybe<Accounts>;
  /** An array relationship */
  board_invitations: Array<Board_Invitations>;
  /** An aggregate relationship */
  board_invitations_aggregate: Board_Invitations_Aggregate;
  /** fetch data from the table: "board_invitations" using primary key columns */
  board_invitations_by_pk?: Maybe<Board_Invitations>;
  /** An array relationship */
  board_members: Array<Board_Members>;
  /** An aggregate relationship */
  board_members_aggregate: Board_Members_Aggregate;
  /** fetch data from the table: "board_members" using primary key columns */
  board_members_by_pk?: Maybe<Board_Members>;
  /** An array relationship */
  boards: Array<Boards>;
  /** An aggregate relationship */
  boards_aggregate: Boards_Aggregate;
  /** fetch data from the table: "boards" using primary key columns */
  boards_by_pk?: Maybe<Boards>;
  /** An array relationship */
  comments: Array<Comments>;
  /** An aggregate relationship */
  comments_aggregate: Comments_Aggregate;
  /** fetch data from the table: "comments" using primary key columns */
  comments_by_pk?: Maybe<Comments>;
  /** An array relationship */
  labels: Array<Labels>;
  /** An aggregate relationship */
  labels_aggregate: Labels_Aggregate;
  /** fetch data from the table: "labels" using primary key columns */
  labels_by_pk?: Maybe<Labels>;
  /** An array relationship */
  lists: Array<Lists>;
  /** An aggregate relationship */
  lists_aggregate: Lists_Aggregate;
  /** fetch data from the table: "lists" using primary key columns */
  lists_by_pk?: Maybe<Lists>;
  /** An array relationship */
  sessions: Array<Sessions>;
  /** An aggregate relationship */
  sessions_aggregate: Sessions_Aggregate;
  /** fetch data from the table: "sessions" using primary key columns */
  sessions_by_pk?: Maybe<Sessions>;
  /** An array relationship */
  todo_labels: Array<Todo_Labels>;
  /** An aggregate relationship */
  todo_labels_aggregate: Todo_Labels_Aggregate;
  /** fetch data from the table: "todo_labels" using primary key columns */
  todo_labels_by_pk?: Maybe<Todo_Labels>;
  /** An array relationship */
  todos: Array<Todos>;
  /** An aggregate relationship */
  todos_aggregate: Todos_Aggregate;
  /** fetch data from the table: "todos" using primary key columns */
  todos_by_pk?: Maybe<Todos>;
  /** An array relationship */
  uploads: Array<Uploads>;
  /** An aggregate relationship */
  uploads_aggregate: Uploads_Aggregate;
  /** fetch data from the table: "uploads" using primary key columns */
  uploads_by_pk?: Maybe<Uploads>;
  /** fetch data from the table: "users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "users" */
  users_aggregate: Users_Aggregate;
  /** fetch data from the table: "users" using primary key columns */
  users_by_pk?: Maybe<Users>;
  /** fetch data from the table: "verification_tokens" */
  verification_tokens: Array<Verification_Tokens>;
  /** fetch aggregated fields from the table: "verification_tokens" */
  verification_tokens_aggregate: Verification_Tokens_Aggregate;
  /** fetch data from the table: "verification_tokens" using primary key columns */
  verification_tokens_by_pk?: Maybe<Verification_Tokens>;
};


export type Query_RootAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Query_RootAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Query_RootAccounts_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootBoard_InvitationsArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


export type Query_RootBoard_Invitations_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


export type Query_RootBoard_Invitations_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootBoard_MembersArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


export type Query_RootBoard_Members_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


export type Query_RootBoard_Members_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootBoardsArgs = {
  distinct_on?: InputMaybe<Array<Boards_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Boards_Order_By>>;
  where?: InputMaybe<Boards_Bool_Exp>;
};


export type Query_RootBoards_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Boards_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Boards_Order_By>>;
  where?: InputMaybe<Boards_Bool_Exp>;
};


export type Query_RootBoards_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootCommentsArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Query_RootComments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Query_RootComments_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootLabelsArgs = {
  distinct_on?: InputMaybe<Array<Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Labels_Order_By>>;
  where?: InputMaybe<Labels_Bool_Exp>;
};


export type Query_RootLabels_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Labels_Order_By>>;
  where?: InputMaybe<Labels_Bool_Exp>;
};


export type Query_RootLabels_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootListsArgs = {
  distinct_on?: InputMaybe<Array<Lists_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lists_Order_By>>;
  where?: InputMaybe<Lists_Bool_Exp>;
};


export type Query_RootLists_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lists_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lists_Order_By>>;
  where?: InputMaybe<Lists_Bool_Exp>;
};


export type Query_RootLists_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootSessionsArgs = {
  distinct_on?: InputMaybe<Array<Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Sessions_Order_By>>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};


export type Query_RootSessions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Sessions_Order_By>>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};


export type Query_RootSessions_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootTodo_LabelsArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


export type Query_RootTodo_Labels_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


export type Query_RootTodo_Labels_By_PkArgs = {
  label_id: Scalars['uuid']['input'];
  todo_id: Scalars['uuid']['input'];
};


export type Query_RootTodosArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};


export type Query_RootTodos_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};


export type Query_RootTodos_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootUploadsArgs = {
  distinct_on?: InputMaybe<Array<Uploads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Uploads_Order_By>>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};


export type Query_RootUploads_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Uploads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Uploads_Order_By>>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};


export type Query_RootUploads_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Query_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Query_RootUsers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootVerification_TokensArgs = {
  distinct_on?: InputMaybe<Array<Verification_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Verification_Tokens_Order_By>>;
  where?: InputMaybe<Verification_Tokens_Bool_Exp>;
};


export type Query_RootVerification_Tokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Verification_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Verification_Tokens_Order_By>>;
  where?: InputMaybe<Verification_Tokens_Bool_Exp>;
};


export type Query_RootVerification_Tokens_By_PkArgs = {
  identifier: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

/** columns and relationships of "sessions" */
export type Sessions = {
  __typename?: 'sessions';
  created_at: Scalars['timestamptz']['output'];
  expires: Scalars['timestamptz']['output'];
  id: Scalars['uuid']['output'];
  sessionToken: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  user: Users;
  userId: Scalars['uuid']['output'];
};

/** aggregated selection of "sessions" */
export type Sessions_Aggregate = {
  __typename?: 'sessions_aggregate';
  aggregate?: Maybe<Sessions_Aggregate_Fields>;
  nodes: Array<Sessions>;
};

export type Sessions_Aggregate_Bool_Exp = {
  count?: InputMaybe<Sessions_Aggregate_Bool_Exp_Count>;
};

export type Sessions_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Sessions_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Sessions_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "sessions" */
export type Sessions_Aggregate_Fields = {
  __typename?: 'sessions_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Sessions_Max_Fields>;
  min?: Maybe<Sessions_Min_Fields>;
};


/** aggregate fields of "sessions" */
export type Sessions_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Sessions_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "sessions" */
export type Sessions_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Sessions_Max_Order_By>;
  min?: InputMaybe<Sessions_Min_Order_By>;
};

/** input type for inserting array relation for remote table "sessions" */
export type Sessions_Arr_Rel_Insert_Input = {
  data: Array<Sessions_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Sessions_On_Conflict>;
};

/** Boolean expression to filter rows from the table "sessions". All fields are combined with a logical 'AND'. */
export type Sessions_Bool_Exp = {
  _and?: InputMaybe<Array<Sessions_Bool_Exp>>;
  _not?: InputMaybe<Sessions_Bool_Exp>;
  _or?: InputMaybe<Array<Sessions_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  expires?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  sessionToken?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  userId?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "sessions" */
export enum Sessions_Constraint {
  /** unique or primary key constraint on columns "id" */
  SessionsPkey = 'sessions_pkey',
  /** unique or primary key constraint on columns "sessionToken" */
  SessionsSessiontokenKey = 'sessions_sessiontoken_key'
}

/** input type for inserting data into table "sessions" */
export type Sessions_Insert_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  sessionToken?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  userId?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Sessions_Max_Fields = {
  __typename?: 'sessions_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  sessionToken?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  userId?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "sessions" */
export type Sessions_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  expires?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  sessionToken?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  userId?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Sessions_Min_Fields = {
  __typename?: 'sessions_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  sessionToken?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  userId?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "sessions" */
export type Sessions_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  expires?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  sessionToken?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  userId?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "sessions" */
export type Sessions_Mutation_Response = {
  __typename?: 'sessions_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Sessions>;
};

/** on_conflict condition type for table "sessions" */
export type Sessions_On_Conflict = {
  constraint: Sessions_Constraint;
  update_columns?: Array<Sessions_Update_Column>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};

/** Ordering options when selecting data from "sessions". */
export type Sessions_Order_By = {
  created_at?: InputMaybe<Order_By>;
  expires?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  sessionToken?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<Users_Order_By>;
  userId?: InputMaybe<Order_By>;
};

/** primary key columns input for table: sessions */
export type Sessions_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "sessions" */
export enum Sessions_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Expires = 'expires',
  /** column name */
  Id = 'id',
  /** column name */
  SessionToken = 'sessionToken',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'userId'
}

/** input type for updating data in table "sessions" */
export type Sessions_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  sessionToken?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  userId?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "sessions" */
export type Sessions_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Sessions_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Sessions_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  sessionToken?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  userId?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "sessions" */
export enum Sessions_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Expires = 'expires',
  /** column name */
  Id = 'id',
  /** column name */
  SessionToken = 'sessionToken',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'userId'
}

export type Sessions_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Sessions_Set_Input>;
  /** filter the rows which have to be updated */
  where: Sessions_Bool_Exp;
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** fetch data from the table: "accounts" using primary key columns */
  accounts_by_pk?: Maybe<Accounts>;
  /** fetch data from the table in a streaming manner: "accounts" */
  accounts_stream: Array<Accounts>;
  /** An array relationship */
  board_invitations: Array<Board_Invitations>;
  /** An aggregate relationship */
  board_invitations_aggregate: Board_Invitations_Aggregate;
  /** fetch data from the table: "board_invitations" using primary key columns */
  board_invitations_by_pk?: Maybe<Board_Invitations>;
  /** fetch data from the table in a streaming manner: "board_invitations" */
  board_invitations_stream: Array<Board_Invitations>;
  /** An array relationship */
  board_members: Array<Board_Members>;
  /** An aggregate relationship */
  board_members_aggregate: Board_Members_Aggregate;
  /** fetch data from the table: "board_members" using primary key columns */
  board_members_by_pk?: Maybe<Board_Members>;
  /** fetch data from the table in a streaming manner: "board_members" */
  board_members_stream: Array<Board_Members>;
  /** An array relationship */
  boards: Array<Boards>;
  /** An aggregate relationship */
  boards_aggregate: Boards_Aggregate;
  /** fetch data from the table: "boards" using primary key columns */
  boards_by_pk?: Maybe<Boards>;
  /** fetch data from the table in a streaming manner: "boards" */
  boards_stream: Array<Boards>;
  /** An array relationship */
  comments: Array<Comments>;
  /** An aggregate relationship */
  comments_aggregate: Comments_Aggregate;
  /** fetch data from the table: "comments" using primary key columns */
  comments_by_pk?: Maybe<Comments>;
  /** fetch data from the table in a streaming manner: "comments" */
  comments_stream: Array<Comments>;
  /** An array relationship */
  labels: Array<Labels>;
  /** An aggregate relationship */
  labels_aggregate: Labels_Aggregate;
  /** fetch data from the table: "labels" using primary key columns */
  labels_by_pk?: Maybe<Labels>;
  /** fetch data from the table in a streaming manner: "labels" */
  labels_stream: Array<Labels>;
  /** An array relationship */
  lists: Array<Lists>;
  /** An aggregate relationship */
  lists_aggregate: Lists_Aggregate;
  /** fetch data from the table: "lists" using primary key columns */
  lists_by_pk?: Maybe<Lists>;
  /** fetch data from the table in a streaming manner: "lists" */
  lists_stream: Array<Lists>;
  /** An array relationship */
  sessions: Array<Sessions>;
  /** An aggregate relationship */
  sessions_aggregate: Sessions_Aggregate;
  /** fetch data from the table: "sessions" using primary key columns */
  sessions_by_pk?: Maybe<Sessions>;
  /** fetch data from the table in a streaming manner: "sessions" */
  sessions_stream: Array<Sessions>;
  /** An array relationship */
  todo_labels: Array<Todo_Labels>;
  /** An aggregate relationship */
  todo_labels_aggregate: Todo_Labels_Aggregate;
  /** fetch data from the table: "todo_labels" using primary key columns */
  todo_labels_by_pk?: Maybe<Todo_Labels>;
  /** fetch data from the table in a streaming manner: "todo_labels" */
  todo_labels_stream: Array<Todo_Labels>;
  /** An array relationship */
  todos: Array<Todos>;
  /** An aggregate relationship */
  todos_aggregate: Todos_Aggregate;
  /** fetch data from the table: "todos" using primary key columns */
  todos_by_pk?: Maybe<Todos>;
  /** fetch data from the table in a streaming manner: "todos" */
  todos_stream: Array<Todos>;
  /** An array relationship */
  uploads: Array<Uploads>;
  /** An aggregate relationship */
  uploads_aggregate: Uploads_Aggregate;
  /** fetch data from the table: "uploads" using primary key columns */
  uploads_by_pk?: Maybe<Uploads>;
  /** fetch data from the table in a streaming manner: "uploads" */
  uploads_stream: Array<Uploads>;
  /** fetch data from the table: "users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "users" */
  users_aggregate: Users_Aggregate;
  /** fetch data from the table: "users" using primary key columns */
  users_by_pk?: Maybe<Users>;
  /** fetch data from the table in a streaming manner: "users" */
  users_stream: Array<Users>;
  /** fetch data from the table: "verification_tokens" */
  verification_tokens: Array<Verification_Tokens>;
  /** fetch aggregated fields from the table: "verification_tokens" */
  verification_tokens_aggregate: Verification_Tokens_Aggregate;
  /** fetch data from the table: "verification_tokens" using primary key columns */
  verification_tokens_by_pk?: Maybe<Verification_Tokens>;
  /** fetch data from the table in a streaming manner: "verification_tokens" */
  verification_tokens_stream: Array<Verification_Tokens>;
};


export type Subscription_RootAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootAccounts_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootAccounts_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Accounts_Stream_Cursor_Input>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootBoard_InvitationsArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


export type Subscription_RootBoard_Invitations_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


export type Subscription_RootBoard_Invitations_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootBoard_Invitations_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Board_Invitations_Stream_Cursor_Input>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


export type Subscription_RootBoard_MembersArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


export type Subscription_RootBoard_Members_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


export type Subscription_RootBoard_Members_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootBoard_Members_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Board_Members_Stream_Cursor_Input>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


export type Subscription_RootBoardsArgs = {
  distinct_on?: InputMaybe<Array<Boards_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Boards_Order_By>>;
  where?: InputMaybe<Boards_Bool_Exp>;
};


export type Subscription_RootBoards_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Boards_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Boards_Order_By>>;
  where?: InputMaybe<Boards_Bool_Exp>;
};


export type Subscription_RootBoards_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootBoards_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Boards_Stream_Cursor_Input>>;
  where?: InputMaybe<Boards_Bool_Exp>;
};


export type Subscription_RootCommentsArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Subscription_RootComments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Subscription_RootComments_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootComments_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Comments_Stream_Cursor_Input>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Subscription_RootLabelsArgs = {
  distinct_on?: InputMaybe<Array<Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Labels_Order_By>>;
  where?: InputMaybe<Labels_Bool_Exp>;
};


export type Subscription_RootLabels_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Labels_Order_By>>;
  where?: InputMaybe<Labels_Bool_Exp>;
};


export type Subscription_RootLabels_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootLabels_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Labels_Stream_Cursor_Input>>;
  where?: InputMaybe<Labels_Bool_Exp>;
};


export type Subscription_RootListsArgs = {
  distinct_on?: InputMaybe<Array<Lists_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lists_Order_By>>;
  where?: InputMaybe<Lists_Bool_Exp>;
};


export type Subscription_RootLists_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lists_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lists_Order_By>>;
  where?: InputMaybe<Lists_Bool_Exp>;
};


export type Subscription_RootLists_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootLists_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Lists_Stream_Cursor_Input>>;
  where?: InputMaybe<Lists_Bool_Exp>;
};


export type Subscription_RootSessionsArgs = {
  distinct_on?: InputMaybe<Array<Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Sessions_Order_By>>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};


export type Subscription_RootSessions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Sessions_Order_By>>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};


export type Subscription_RootSessions_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootSessions_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Sessions_Stream_Cursor_Input>>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};


export type Subscription_RootTodo_LabelsArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


export type Subscription_RootTodo_Labels_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


export type Subscription_RootTodo_Labels_By_PkArgs = {
  label_id: Scalars['uuid']['input'];
  todo_id: Scalars['uuid']['input'];
};


export type Subscription_RootTodo_Labels_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Todo_Labels_Stream_Cursor_Input>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


export type Subscription_RootTodosArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};


export type Subscription_RootTodos_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};


export type Subscription_RootTodos_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootTodos_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Todos_Stream_Cursor_Input>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};


export type Subscription_RootUploadsArgs = {
  distinct_on?: InputMaybe<Array<Uploads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Uploads_Order_By>>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};


export type Subscription_RootUploads_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Uploads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Uploads_Order_By>>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};


export type Subscription_RootUploads_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootUploads_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Uploads_Stream_Cursor_Input>>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};


export type Subscription_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Subscription_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Subscription_RootUsers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootUsers_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Users_Stream_Cursor_Input>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Subscription_RootVerification_TokensArgs = {
  distinct_on?: InputMaybe<Array<Verification_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Verification_Tokens_Order_By>>;
  where?: InputMaybe<Verification_Tokens_Bool_Exp>;
};


export type Subscription_RootVerification_Tokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Verification_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Verification_Tokens_Order_By>>;
  where?: InputMaybe<Verification_Tokens_Bool_Exp>;
};


export type Subscription_RootVerification_Tokens_By_PkArgs = {
  identifier: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type Subscription_RootVerification_Tokens_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Verification_Tokens_Stream_Cursor_Input>>;
  where?: InputMaybe<Verification_Tokens_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']['input']>;
  _gt?: InputMaybe<Scalars['timestamptz']['input']>;
  _gte?: InputMaybe<Scalars['timestamptz']['input']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['timestamptz']['input']>;
  _lte?: InputMaybe<Scalars['timestamptz']['input']>;
  _neq?: InputMaybe<Scalars['timestamptz']['input']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
};

/** columns and relationships of "todo_labels" */
export type Todo_Labels = {
  __typename?: 'todo_labels';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** An object relationship */
  label: Labels;
  label_id: Scalars['uuid']['output'];
  /** An object relationship */
  todo: Todos;
  todo_id: Scalars['uuid']['output'];
};

/** aggregated selection of "todo_labels" */
export type Todo_Labels_Aggregate = {
  __typename?: 'todo_labels_aggregate';
  aggregate?: Maybe<Todo_Labels_Aggregate_Fields>;
  nodes: Array<Todo_Labels>;
};

export type Todo_Labels_Aggregate_Bool_Exp = {
  count?: InputMaybe<Todo_Labels_Aggregate_Bool_Exp_Count>;
};

export type Todo_Labels_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Todo_Labels_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "todo_labels" */
export type Todo_Labels_Aggregate_Fields = {
  __typename?: 'todo_labels_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Todo_Labels_Max_Fields>;
  min?: Maybe<Todo_Labels_Min_Fields>;
};


/** aggregate fields of "todo_labels" */
export type Todo_Labels_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "todo_labels" */
export type Todo_Labels_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Todo_Labels_Max_Order_By>;
  min?: InputMaybe<Todo_Labels_Min_Order_By>;
};

/** input type for inserting array relation for remote table "todo_labels" */
export type Todo_Labels_Arr_Rel_Insert_Input = {
  data: Array<Todo_Labels_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Todo_Labels_On_Conflict>;
};

/** Boolean expression to filter rows from the table "todo_labels". All fields are combined with a logical 'AND'. */
export type Todo_Labels_Bool_Exp = {
  _and?: InputMaybe<Array<Todo_Labels_Bool_Exp>>;
  _not?: InputMaybe<Todo_Labels_Bool_Exp>;
  _or?: InputMaybe<Array<Todo_Labels_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  label?: InputMaybe<Labels_Bool_Exp>;
  label_id?: InputMaybe<Uuid_Comparison_Exp>;
  todo?: InputMaybe<Todos_Bool_Exp>;
  todo_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "todo_labels" */
export enum Todo_Labels_Constraint {
  /** unique or primary key constraint on columns "todo_id", "label_id" */
  TodoLabelsPkey = 'todo_labels_pkey'
}

/** input type for inserting data into table "todo_labels" */
export type Todo_Labels_Insert_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  label?: InputMaybe<Labels_Obj_Rel_Insert_Input>;
  label_id?: InputMaybe<Scalars['uuid']['input']>;
  todo?: InputMaybe<Todos_Obj_Rel_Insert_Input>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Todo_Labels_Max_Fields = {
  __typename?: 'todo_labels_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  label_id?: Maybe<Scalars['uuid']['output']>;
  todo_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "todo_labels" */
export type Todo_Labels_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  label_id?: InputMaybe<Order_By>;
  todo_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Todo_Labels_Min_Fields = {
  __typename?: 'todo_labels_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  label_id?: Maybe<Scalars['uuid']['output']>;
  todo_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "todo_labels" */
export type Todo_Labels_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  label_id?: InputMaybe<Order_By>;
  todo_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "todo_labels" */
export type Todo_Labels_Mutation_Response = {
  __typename?: 'todo_labels_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Todo_Labels>;
};

/** on_conflict condition type for table "todo_labels" */
export type Todo_Labels_On_Conflict = {
  constraint: Todo_Labels_Constraint;
  update_columns?: Array<Todo_Labels_Update_Column>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};

/** Ordering options when selecting data from "todo_labels". */
export type Todo_Labels_Order_By = {
  created_at?: InputMaybe<Order_By>;
  label?: InputMaybe<Labels_Order_By>;
  label_id?: InputMaybe<Order_By>;
  todo?: InputMaybe<Todos_Order_By>;
  todo_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: todo_labels */
export type Todo_Labels_Pk_Columns_Input = {
  label_id: Scalars['uuid']['input'];
  todo_id: Scalars['uuid']['input'];
};

/** select columns of table "todo_labels" */
export enum Todo_Labels_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  LabelId = 'label_id',
  /** column name */
  TodoId = 'todo_id'
}

/** input type for updating data in table "todo_labels" */
export type Todo_Labels_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  label_id?: InputMaybe<Scalars['uuid']['input']>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "todo_labels" */
export type Todo_Labels_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Todo_Labels_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Todo_Labels_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  label_id?: InputMaybe<Scalars['uuid']['input']>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "todo_labels" */
export enum Todo_Labels_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  LabelId = 'label_id',
  /** column name */
  TodoId = 'todo_id'
}

export type Todo_Labels_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Todo_Labels_Set_Input>;
  /** filter the rows which have to be updated */
  where: Todo_Labels_Bool_Exp;
};

/** columns and relationships of "todos" */
export type Todos = {
  __typename?: 'todos';
  alias: Scalars['String']['output'];
  /** An array relationship */
  comments: Array<Comments>;
  /** An aggregate relationship */
  comments_aggregate: Comments_Aggregate;
  completed_at?: Maybe<Scalars['timestamptz']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['timestamptz']['output'];
  due_on?: Maybe<Scalars['timestamptz']['output']>;
  id: Scalars['uuid']['output'];
  /** An array relationship */
  labels: Array<Todo_Labels>;
  /** An aggregate relationship */
  labels_aggregate: Todo_Labels_Aggregate;
  /** An object relationship */
  list?: Maybe<Lists>;
  list_id?: Maybe<Scalars['uuid']['output']>;
  priority: Scalars['String']['output'];
  sort_order: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
  /** An array relationship */
  uploads: Array<Uploads>;
  /** An aggregate relationship */
  uploads_aggregate: Uploads_Aggregate;
  /** An object relationship */
  user: Users;
  user_id: Scalars['uuid']['output'];
};


/** columns and relationships of "todos" */
export type TodosCommentsArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


/** columns and relationships of "todos" */
export type TodosComments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


/** columns and relationships of "todos" */
export type TodosLabelsArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


/** columns and relationships of "todos" */
export type TodosLabels_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todo_Labels_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todo_Labels_Order_By>>;
  where?: InputMaybe<Todo_Labels_Bool_Exp>;
};


/** columns and relationships of "todos" */
export type TodosUploadsArgs = {
  distinct_on?: InputMaybe<Array<Uploads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Uploads_Order_By>>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};


/** columns and relationships of "todos" */
export type TodosUploads_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Uploads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Uploads_Order_By>>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};

/** aggregated selection of "todos" */
export type Todos_Aggregate = {
  __typename?: 'todos_aggregate';
  aggregate?: Maybe<Todos_Aggregate_Fields>;
  nodes: Array<Todos>;
};

export type Todos_Aggregate_Bool_Exp = {
  count?: InputMaybe<Todos_Aggregate_Bool_Exp_Count>;
};

export type Todos_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Todos_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Todos_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "todos" */
export type Todos_Aggregate_Fields = {
  __typename?: 'todos_aggregate_fields';
  avg?: Maybe<Todos_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Todos_Max_Fields>;
  min?: Maybe<Todos_Min_Fields>;
  stddev?: Maybe<Todos_Stddev_Fields>;
  stddev_pop?: Maybe<Todos_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Todos_Stddev_Samp_Fields>;
  sum?: Maybe<Todos_Sum_Fields>;
  var_pop?: Maybe<Todos_Var_Pop_Fields>;
  var_samp?: Maybe<Todos_Var_Samp_Fields>;
  variance?: Maybe<Todos_Variance_Fields>;
};


/** aggregate fields of "todos" */
export type Todos_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Todos_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "todos" */
export type Todos_Aggregate_Order_By = {
  avg?: InputMaybe<Todos_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Todos_Max_Order_By>;
  min?: InputMaybe<Todos_Min_Order_By>;
  stddev?: InputMaybe<Todos_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Todos_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Todos_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Todos_Sum_Order_By>;
  var_pop?: InputMaybe<Todos_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Todos_Var_Samp_Order_By>;
  variance?: InputMaybe<Todos_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "todos" */
export type Todos_Arr_Rel_Insert_Input = {
  data: Array<Todos_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Todos_On_Conflict>;
};

/** aggregate avg on columns */
export type Todos_Avg_Fields = {
  __typename?: 'todos_avg_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "todos" */
export type Todos_Avg_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "todos". All fields are combined with a logical 'AND'. */
export type Todos_Bool_Exp = {
  _and?: InputMaybe<Array<Todos_Bool_Exp>>;
  _not?: InputMaybe<Todos_Bool_Exp>;
  _or?: InputMaybe<Array<Todos_Bool_Exp>>;
  alias?: InputMaybe<String_Comparison_Exp>;
  comments?: InputMaybe<Comments_Bool_Exp>;
  comments_aggregate?: InputMaybe<Comments_Aggregate_Bool_Exp>;
  completed_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  content?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  due_on?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  labels?: InputMaybe<Todo_Labels_Bool_Exp>;
  labels_aggregate?: InputMaybe<Todo_Labels_Aggregate_Bool_Exp>;
  list?: InputMaybe<Lists_Bool_Exp>;
  list_id?: InputMaybe<Uuid_Comparison_Exp>;
  priority?: InputMaybe<String_Comparison_Exp>;
  sort_order?: InputMaybe<Int_Comparison_Exp>;
  title?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  uploads?: InputMaybe<Uploads_Bool_Exp>;
  uploads_aggregate?: InputMaybe<Uploads_Aggregate_Bool_Exp>;
  user?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "todos" */
export enum Todos_Constraint {
  /** unique or primary key constraint on columns "id" */
  TodosPkey = 'todos_pkey',
  /** unique or primary key constraint on columns "user_id", "alias" */
  TodosUserIdAliasUnique = 'todos_user_id_alias_unique'
}

/** input type for incrementing numeric columns in table "todos" */
export type Todos_Inc_Input = {
  sort_order?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "todos" */
export type Todos_Insert_Input = {
  alias?: InputMaybe<Scalars['String']['input']>;
  comments?: InputMaybe<Comments_Arr_Rel_Insert_Input>;
  completed_at?: InputMaybe<Scalars['timestamptz']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  due_on?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  labels?: InputMaybe<Todo_Labels_Arr_Rel_Insert_Input>;
  list?: InputMaybe<Lists_Obj_Rel_Insert_Input>;
  list_id?: InputMaybe<Scalars['uuid']['input']>;
  priority?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  uploads?: InputMaybe<Uploads_Arr_Rel_Insert_Input>;
  user?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Todos_Max_Fields = {
  __typename?: 'todos_max_fields';
  alias?: Maybe<Scalars['String']['output']>;
  completed_at?: Maybe<Scalars['timestamptz']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  due_on?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  list_id?: Maybe<Scalars['uuid']['output']>;
  priority?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "todos" */
export type Todos_Max_Order_By = {
  alias?: InputMaybe<Order_By>;
  completed_at?: InputMaybe<Order_By>;
  content?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  due_on?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  list_id?: InputMaybe<Order_By>;
  priority?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  title?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Todos_Min_Fields = {
  __typename?: 'todos_min_fields';
  alias?: Maybe<Scalars['String']['output']>;
  completed_at?: Maybe<Scalars['timestamptz']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  due_on?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  list_id?: Maybe<Scalars['uuid']['output']>;
  priority?: Maybe<Scalars['String']['output']>;
  sort_order?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "todos" */
export type Todos_Min_Order_By = {
  alias?: InputMaybe<Order_By>;
  completed_at?: InputMaybe<Order_By>;
  content?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  due_on?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  list_id?: InputMaybe<Order_By>;
  priority?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  title?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "todos" */
export type Todos_Mutation_Response = {
  __typename?: 'todos_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Todos>;
};

/** input type for inserting object relation for remote table "todos" */
export type Todos_Obj_Rel_Insert_Input = {
  data: Todos_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Todos_On_Conflict>;
};

/** on_conflict condition type for table "todos" */
export type Todos_On_Conflict = {
  constraint: Todos_Constraint;
  update_columns?: Array<Todos_Update_Column>;
  where?: InputMaybe<Todos_Bool_Exp>;
};

/** Ordering options when selecting data from "todos". */
export type Todos_Order_By = {
  alias?: InputMaybe<Order_By>;
  comments_aggregate?: InputMaybe<Comments_Aggregate_Order_By>;
  completed_at?: InputMaybe<Order_By>;
  content?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  due_on?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  labels_aggregate?: InputMaybe<Todo_Labels_Aggregate_Order_By>;
  list?: InputMaybe<Lists_Order_By>;
  list_id?: InputMaybe<Order_By>;
  priority?: InputMaybe<Order_By>;
  sort_order?: InputMaybe<Order_By>;
  title?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  uploads_aggregate?: InputMaybe<Uploads_Aggregate_Order_By>;
  user?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: todos */
export type Todos_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "todos" */
export enum Todos_Select_Column {
  /** column name */
  Alias = 'alias',
  /** column name */
  CompletedAt = 'completed_at',
  /** column name */
  Content = 'content',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  DueOn = 'due_on',
  /** column name */
  Id = 'id',
  /** column name */
  ListId = 'list_id',
  /** column name */
  Priority = 'priority',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  Title = 'title',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "todos" */
export type Todos_Set_Input = {
  alias?: InputMaybe<Scalars['String']['input']>;
  completed_at?: InputMaybe<Scalars['timestamptz']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  due_on?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  list_id?: InputMaybe<Scalars['uuid']['input']>;
  priority?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate stddev on columns */
export type Todos_Stddev_Fields = {
  __typename?: 'todos_stddev_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "todos" */
export type Todos_Stddev_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Todos_Stddev_Pop_Fields = {
  __typename?: 'todos_stddev_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "todos" */
export type Todos_Stddev_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Todos_Stddev_Samp_Fields = {
  __typename?: 'todos_stddev_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "todos" */
export type Todos_Stddev_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "todos" */
export type Todos_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Todos_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Todos_Stream_Cursor_Value_Input = {
  alias?: InputMaybe<Scalars['String']['input']>;
  completed_at?: InputMaybe<Scalars['timestamptz']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  due_on?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  list_id?: InputMaybe<Scalars['uuid']['input']>;
  priority?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate sum on columns */
export type Todos_Sum_Fields = {
  __typename?: 'todos_sum_fields';
  sort_order?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "todos" */
export type Todos_Sum_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** update columns of table "todos" */
export enum Todos_Update_Column {
  /** column name */
  Alias = 'alias',
  /** column name */
  CompletedAt = 'completed_at',
  /** column name */
  Content = 'content',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  DueOn = 'due_on',
  /** column name */
  Id = 'id',
  /** column name */
  ListId = 'list_id',
  /** column name */
  Priority = 'priority',
  /** column name */
  SortOrder = 'sort_order',
  /** column name */
  Title = 'title',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

export type Todos_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Todos_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Todos_Set_Input>;
  /** filter the rows which have to be updated */
  where: Todos_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Todos_Var_Pop_Fields = {
  __typename?: 'todos_var_pop_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "todos" */
export type Todos_Var_Pop_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Todos_Var_Samp_Fields = {
  __typename?: 'todos_var_samp_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "todos" */
export type Todos_Var_Samp_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Todos_Variance_Fields = {
  __typename?: 'todos_variance_fields';
  sort_order?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "todos" */
export type Todos_Variance_Order_By = {
  sort_order?: InputMaybe<Order_By>;
};

/** columns and relationships of "uploads" */
export type Uploads = {
  __typename?: 'uploads';
  created_at: Scalars['timestamptz']['output'];
  id: Scalars['uuid']['output'];
  /** An object relationship */
  todo: Todos;
  todo_id: Scalars['uuid']['output'];
  url: Scalars['String']['output'];
};

/** aggregated selection of "uploads" */
export type Uploads_Aggregate = {
  __typename?: 'uploads_aggregate';
  aggregate?: Maybe<Uploads_Aggregate_Fields>;
  nodes: Array<Uploads>;
};

export type Uploads_Aggregate_Bool_Exp = {
  count?: InputMaybe<Uploads_Aggregate_Bool_Exp_Count>;
};

export type Uploads_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Uploads_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Uploads_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "uploads" */
export type Uploads_Aggregate_Fields = {
  __typename?: 'uploads_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Uploads_Max_Fields>;
  min?: Maybe<Uploads_Min_Fields>;
};


/** aggregate fields of "uploads" */
export type Uploads_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Uploads_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "uploads" */
export type Uploads_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Uploads_Max_Order_By>;
  min?: InputMaybe<Uploads_Min_Order_By>;
};

/** input type for inserting array relation for remote table "uploads" */
export type Uploads_Arr_Rel_Insert_Input = {
  data: Array<Uploads_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Uploads_On_Conflict>;
};

/** Boolean expression to filter rows from the table "uploads". All fields are combined with a logical 'AND'. */
export type Uploads_Bool_Exp = {
  _and?: InputMaybe<Array<Uploads_Bool_Exp>>;
  _not?: InputMaybe<Uploads_Bool_Exp>;
  _or?: InputMaybe<Array<Uploads_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  todo?: InputMaybe<Todos_Bool_Exp>;
  todo_id?: InputMaybe<Uuid_Comparison_Exp>;
  url?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "uploads" */
export enum Uploads_Constraint {
  /** unique or primary key constraint on columns "id" */
  UploadsPkey = 'uploads_pkey'
}

/** input type for inserting data into table "uploads" */
export type Uploads_Insert_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  todo?: InputMaybe<Todos_Obj_Rel_Insert_Input>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Uploads_Max_Fields = {
  __typename?: 'uploads_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  todo_id?: Maybe<Scalars['uuid']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "uploads" */
export type Uploads_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  todo_id?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Uploads_Min_Fields = {
  __typename?: 'uploads_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  todo_id?: Maybe<Scalars['uuid']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "uploads" */
export type Uploads_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  todo_id?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "uploads" */
export type Uploads_Mutation_Response = {
  __typename?: 'uploads_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Uploads>;
};

/** on_conflict condition type for table "uploads" */
export type Uploads_On_Conflict = {
  constraint: Uploads_Constraint;
  update_columns?: Array<Uploads_Update_Column>;
  where?: InputMaybe<Uploads_Bool_Exp>;
};

/** Ordering options when selecting data from "uploads". */
export type Uploads_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  todo?: InputMaybe<Todos_Order_By>;
  todo_id?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** primary key columns input for table: uploads */
export type Uploads_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "uploads" */
export enum Uploads_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  TodoId = 'todo_id',
  /** column name */
  Url = 'url'
}

/** input type for updating data in table "uploads" */
export type Uploads_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "uploads" */
export type Uploads_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Uploads_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Uploads_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "uploads" */
export enum Uploads_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  TodoId = 'todo_id',
  /** column name */
  Url = 'url'
}

export type Uploads_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Uploads_Set_Input>;
  /** filter the rows which have to be updated */
  where: Uploads_Bool_Exp;
};

/** columns and relationships of "users" */
export type Users = {
  __typename?: 'users';
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** An array relationship */
  board_invitations: Array<Board_Invitations>;
  /** An aggregate relationship */
  board_invitations_aggregate: Board_Invitations_Aggregate;
  /** An array relationship */
  board_members: Array<Board_Members>;
  /** An aggregate relationship */
  board_members_aggregate: Board_Members_Aggregate;
  /** An array relationship */
  boards: Array<Boards>;
  /** An aggregate relationship */
  boards_aggregate: Boards_Aggregate;
  /** An array relationship */
  comments: Array<Comments>;
  /** An aggregate relationship */
  comments_aggregate: Comments_Aggregate;
  created_at: Scalars['timestamptz']['output'];
  dark_mode: Scalars['Boolean']['output'];
  default_labels?: Maybe<Scalars['jsonb']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['timestamptz']['output']>;
  id: Scalars['uuid']['output'];
  image?: Maybe<Scalars['String']['output']>;
  locale: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  sessions: Array<Sessions>;
  /** An aggregate relationship */
  sessions_aggregate: Sessions_Aggregate;
  settings: Scalars['jsonb']['output'];
  /** An array relationship */
  todos: Array<Todos>;
  /** An aggregate relationship */
  todos_aggregate: Todos_Aggregate;
  updated_at: Scalars['timestamptz']['output'];
  username: Scalars['String']['output'];
};


/** columns and relationships of "users" */
export type UsersAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersBoard_InvitationsArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersBoard_Invitations_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Invitations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By>>;
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersBoard_MembersArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersBoard_Members_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Board_Members_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Board_Members_Order_By>>;
  where?: InputMaybe<Board_Members_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersBoardsArgs = {
  distinct_on?: InputMaybe<Array<Boards_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Boards_Order_By>>;
  where?: InputMaybe<Boards_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersBoards_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Boards_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Boards_Order_By>>;
  where?: InputMaybe<Boards_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersCommentsArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersComments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersDefault_LabelsArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};


/** columns and relationships of "users" */
export type UsersSessionsArgs = {
  distinct_on?: InputMaybe<Array<Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Sessions_Order_By>>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersSessions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Sessions_Order_By>>;
  where?: InputMaybe<Sessions_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersSettingsArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};


/** columns and relationships of "users" */
export type UsersTodosArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};


/** columns and relationships of "users" */
export type UsersTodos_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Todos_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Todos_Order_By>>;
  where?: InputMaybe<Todos_Bool_Exp>;
};

/** aggregated selection of "users" */
export type Users_Aggregate = {
  __typename?: 'users_aggregate';
  aggregate?: Maybe<Users_Aggregate_Fields>;
  nodes: Array<Users>;
};

/** aggregate fields of "users" */
export type Users_Aggregate_Fields = {
  __typename?: 'users_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Users_Max_Fields>;
  min?: Maybe<Users_Min_Fields>;
};


/** aggregate fields of "users" */
export type Users_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Users_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Users_Append_Input = {
  default_labels?: InputMaybe<Scalars['jsonb']['input']>;
  settings?: InputMaybe<Scalars['jsonb']['input']>;
};

/** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
export type Users_Bool_Exp = {
  _and?: InputMaybe<Array<Users_Bool_Exp>>;
  _not?: InputMaybe<Users_Bool_Exp>;
  _or?: InputMaybe<Array<Users_Bool_Exp>>;
  accounts?: InputMaybe<Accounts_Bool_Exp>;
  accounts_aggregate?: InputMaybe<Accounts_Aggregate_Bool_Exp>;
  board_invitations?: InputMaybe<Board_Invitations_Bool_Exp>;
  board_invitations_aggregate?: InputMaybe<Board_Invitations_Aggregate_Bool_Exp>;
  board_members?: InputMaybe<Board_Members_Bool_Exp>;
  board_members_aggregate?: InputMaybe<Board_Members_Aggregate_Bool_Exp>;
  boards?: InputMaybe<Boards_Bool_Exp>;
  boards_aggregate?: InputMaybe<Boards_Aggregate_Bool_Exp>;
  comments?: InputMaybe<Comments_Bool_Exp>;
  comments_aggregate?: InputMaybe<Comments_Aggregate_Bool_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  dark_mode?: InputMaybe<Boolean_Comparison_Exp>;
  default_labels?: InputMaybe<Jsonb_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  emailVerified?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  locale?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  sessions?: InputMaybe<Sessions_Bool_Exp>;
  sessions_aggregate?: InputMaybe<Sessions_Aggregate_Bool_Exp>;
  settings?: InputMaybe<Jsonb_Comparison_Exp>;
  todos?: InputMaybe<Todos_Bool_Exp>;
  todos_aggregate?: InputMaybe<Todos_Aggregate_Bool_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  username?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "users" */
export enum Users_Constraint {
  /** unique or primary key constraint on columns "email" */
  UsersEmailKey = 'users_email_key',
  /** unique or primary key constraint on columns "id" */
  UsersPkey = 'users_pkey',
  /** unique or primary key constraint on columns "username" */
  UsersUsernameKey = 'users_username_key'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Users_Delete_At_Path_Input = {
  default_labels?: InputMaybe<Array<Scalars['String']['input']>>;
  settings?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Users_Delete_Elem_Input = {
  default_labels?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['Int']['input']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Users_Delete_Key_Input = {
  default_labels?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['String']['input']>;
};

/** input type for inserting data into table "users" */
export type Users_Insert_Input = {
  accounts?: InputMaybe<Accounts_Arr_Rel_Insert_Input>;
  board_invitations?: InputMaybe<Board_Invitations_Arr_Rel_Insert_Input>;
  board_members?: InputMaybe<Board_Members_Arr_Rel_Insert_Input>;
  boards?: InputMaybe<Boards_Arr_Rel_Insert_Input>;
  comments?: InputMaybe<Comments_Arr_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  dark_mode?: InputMaybe<Scalars['Boolean']['input']>;
  default_labels?: InputMaybe<Scalars['jsonb']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sessions?: InputMaybe<Sessions_Arr_Rel_Insert_Input>;
  settings?: InputMaybe<Scalars['jsonb']['input']>;
  todos?: InputMaybe<Todos_Arr_Rel_Insert_Input>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Users_Max_Fields = {
  __typename?: 'users_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Users_Min_Fields = {
  __typename?: 'users_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "users" */
export type Users_Mutation_Response = {
  __typename?: 'users_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Users>;
};

/** input type for inserting object relation for remote table "users" */
export type Users_Obj_Rel_Insert_Input = {
  data: Users_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Users_On_Conflict>;
};

/** on_conflict condition type for table "users" */
export type Users_On_Conflict = {
  constraint: Users_Constraint;
  update_columns?: Array<Users_Update_Column>;
  where?: InputMaybe<Users_Bool_Exp>;
};

/** Ordering options when selecting data from "users". */
export type Users_Order_By = {
  accounts_aggregate?: InputMaybe<Accounts_Aggregate_Order_By>;
  board_invitations_aggregate?: InputMaybe<Board_Invitations_Aggregate_Order_By>;
  board_members_aggregate?: InputMaybe<Board_Members_Aggregate_Order_By>;
  boards_aggregate?: InputMaybe<Boards_Aggregate_Order_By>;
  comments_aggregate?: InputMaybe<Comments_Aggregate_Order_By>;
  created_at?: InputMaybe<Order_By>;
  dark_mode?: InputMaybe<Order_By>;
  default_labels?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  emailVerified?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  locale?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  sessions_aggregate?: InputMaybe<Sessions_Aggregate_Order_By>;
  settings?: InputMaybe<Order_By>;
  todos_aggregate?: InputMaybe<Todos_Aggregate_Order_By>;
  updated_at?: InputMaybe<Order_By>;
  username?: InputMaybe<Order_By>;
};

/** primary key columns input for table: users */
export type Users_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Users_Prepend_Input = {
  default_labels?: InputMaybe<Scalars['jsonb']['input']>;
  settings?: InputMaybe<Scalars['jsonb']['input']>;
};

/** select columns of table "users" */
export enum Users_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  DarkMode = 'dark_mode',
  /** column name */
  DefaultLabels = 'default_labels',
  /** column name */
  Email = 'email',
  /** column name */
  EmailVerified = 'emailVerified',
  /** column name */
  Id = 'id',
  /** column name */
  Image = 'image',
  /** column name */
  Locale = 'locale',
  /** column name */
  Name = 'name',
  /** column name */
  Settings = 'settings',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  Username = 'username'
}

/** input type for updating data in table "users" */
export type Users_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  dark_mode?: InputMaybe<Scalars['Boolean']['input']>;
  default_labels?: InputMaybe<Scalars['jsonb']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['jsonb']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "users" */
export type Users_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Users_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Users_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  dark_mode?: InputMaybe<Scalars['Boolean']['input']>;
  default_labels?: InputMaybe<Scalars['jsonb']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['jsonb']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "users" */
export enum Users_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  DarkMode = 'dark_mode',
  /** column name */
  DefaultLabels = 'default_labels',
  /** column name */
  Email = 'email',
  /** column name */
  EmailVerified = 'emailVerified',
  /** column name */
  Id = 'id',
  /** column name */
  Image = 'image',
  /** column name */
  Locale = 'locale',
  /** column name */
  Name = 'name',
  /** column name */
  Settings = 'settings',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  Username = 'username'
}

export type Users_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Users_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Users_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Users_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Users_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Users_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Users_Set_Input>;
  /** filter the rows which have to be updated */
  where: Users_Bool_Exp;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['uuid']['input']>;
  _gt?: InputMaybe<Scalars['uuid']['input']>;
  _gte?: InputMaybe<Scalars['uuid']['input']>;
  _in?: InputMaybe<Array<Scalars['uuid']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['uuid']['input']>;
  _lte?: InputMaybe<Scalars['uuid']['input']>;
  _neq?: InputMaybe<Scalars['uuid']['input']>;
  _nin?: InputMaybe<Array<Scalars['uuid']['input']>>;
};

/** columns and relationships of "verification_tokens" */
export type Verification_Tokens = {
  __typename?: 'verification_tokens';
  created_at: Scalars['timestamptz']['output'];
  expires: Scalars['timestamptz']['output'];
  identifier: Scalars['String']['output'];
  token: Scalars['String']['output'];
};

/** aggregated selection of "verification_tokens" */
export type Verification_Tokens_Aggregate = {
  __typename?: 'verification_tokens_aggregate';
  aggregate?: Maybe<Verification_Tokens_Aggregate_Fields>;
  nodes: Array<Verification_Tokens>;
};

/** aggregate fields of "verification_tokens" */
export type Verification_Tokens_Aggregate_Fields = {
  __typename?: 'verification_tokens_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Verification_Tokens_Max_Fields>;
  min?: Maybe<Verification_Tokens_Min_Fields>;
};


/** aggregate fields of "verification_tokens" */
export type Verification_Tokens_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Verification_Tokens_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "verification_tokens". All fields are combined with a logical 'AND'. */
export type Verification_Tokens_Bool_Exp = {
  _and?: InputMaybe<Array<Verification_Tokens_Bool_Exp>>;
  _not?: InputMaybe<Verification_Tokens_Bool_Exp>;
  _or?: InputMaybe<Array<Verification_Tokens_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  expires?: InputMaybe<Timestamptz_Comparison_Exp>;
  identifier?: InputMaybe<String_Comparison_Exp>;
  token?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "verification_tokens" */
export enum Verification_Tokens_Constraint {
  /** unique or primary key constraint on columns "identifier", "token" */
  VerificationTokensPkey = 'verification_tokens_pkey'
}

/** input type for inserting data into table "verification_tokens" */
export type Verification_Tokens_Insert_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires?: InputMaybe<Scalars['timestamptz']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Verification_Tokens_Max_Fields = {
  __typename?: 'verification_tokens_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires?: Maybe<Scalars['timestamptz']['output']>;
  identifier?: Maybe<Scalars['String']['output']>;
  token?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Verification_Tokens_Min_Fields = {
  __typename?: 'verification_tokens_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  expires?: Maybe<Scalars['timestamptz']['output']>;
  identifier?: Maybe<Scalars['String']['output']>;
  token?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "verification_tokens" */
export type Verification_Tokens_Mutation_Response = {
  __typename?: 'verification_tokens_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Verification_Tokens>;
};

/** on_conflict condition type for table "verification_tokens" */
export type Verification_Tokens_On_Conflict = {
  constraint: Verification_Tokens_Constraint;
  update_columns?: Array<Verification_Tokens_Update_Column>;
  where?: InputMaybe<Verification_Tokens_Bool_Exp>;
};

/** Ordering options when selecting data from "verification_tokens". */
export type Verification_Tokens_Order_By = {
  created_at?: InputMaybe<Order_By>;
  expires?: InputMaybe<Order_By>;
  identifier?: InputMaybe<Order_By>;
  token?: InputMaybe<Order_By>;
};

/** primary key columns input for table: verification_tokens */
export type Verification_Tokens_Pk_Columns_Input = {
  identifier: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

/** select columns of table "verification_tokens" */
export enum Verification_Tokens_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Expires = 'expires',
  /** column name */
  Identifier = 'identifier',
  /** column name */
  Token = 'token'
}

/** input type for updating data in table "verification_tokens" */
export type Verification_Tokens_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires?: InputMaybe<Scalars['timestamptz']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "verification_tokens" */
export type Verification_Tokens_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Verification_Tokens_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Verification_Tokens_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  expires?: InputMaybe<Scalars['timestamptz']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "verification_tokens" */
export enum Verification_Tokens_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Expires = 'expires',
  /** column name */
  Identifier = 'identifier',
  /** column name */
  Token = 'token'
}

export type Verification_Tokens_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Verification_Tokens_Set_Input>;
  /** filter the rows which have to be updated */
  where: Verification_Tokens_Bool_Exp;
};

export type TodoFieldsFragment = { __typename?: 'todos', id: string, title: string, content?: string | null, due_on?: string | null, sort_order: number, priority: string, list_id?: string | null, completed_at?: string | null, created_at: string, updated_at: string, labels: Array<{ __typename?: 'todo_labels', label: { __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null } }>, comments: Array<{ __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } }>, uploads: Array<{ __typename?: 'uploads', id: string, url: string, created_at: string }>, list?: { __typename?: 'lists', id: string, name: string, sort_order: number, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null } | null };

export type ListFieldsFragment = { __typename?: 'lists', id: string, name: string, sort_order: number, board_id?: string | null, created_at: string, updated_at: string, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null };

export type BoardMemberFieldsFragment = { __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } };

export type BoardInvitationFieldsFragment = { __typename?: 'board_invitations', id: string, board_id: string, inviter_id: string, invitee_email?: string | null, invitee_username?: string | null, role: string, status: string, token: string, created_at: string, updated_at: string, expires_at: string, inviter: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null }, board: { __typename?: 'boards', id: string, name: string, alias: string } };

export type BoardFieldsFragment = { __typename?: 'boards', id: string, name: string, alias: string, github?: string | null, sort_order: number, is_public: boolean, allow_public_comments: boolean, created_at: string, updated_at: string, labels: Array<{ __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null }>, user: { __typename?: 'users', id: string, username: string, email?: string | null }, board_members: Array<{ __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } }> };

export type CommentFieldsFragment = { __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } };

export type LabelFieldsFragment = { __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null };

export type UserFieldsFragment = { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null, locale: string, dark_mode: boolean, settings: any, default_labels?: any | null, emailVerified?: string | null, created_at: string, updated_at: string };

export type GetTodosQueryVariables = Exact<{
  where?: InputMaybe<Todos_Bool_Exp>;
  order_by?: InputMaybe<Array<Todos_Order_By> | Todos_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTodosQuery = { __typename?: 'query_root', todos: Array<{ __typename?: 'todos', id: string, title: string, content?: string | null, due_on?: string | null, sort_order: number, priority: string, list_id?: string | null, completed_at?: string | null, created_at: string, updated_at: string, labels: Array<{ __typename?: 'todo_labels', label: { __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null } }>, comments: Array<{ __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } }>, uploads: Array<{ __typename?: 'uploads', id: string, url: string, created_at: string }>, list?: { __typename?: 'lists', id: string, name: string, sort_order: number, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null } | null }> };

export type GetListsQueryVariables = Exact<{
  where?: InputMaybe<Lists_Bool_Exp>;
  order_by?: InputMaybe<Array<Lists_Order_By> | Lists_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetListsQuery = { __typename?: 'query_root', lists: Array<{ __typename?: 'lists', id: string, name: string, sort_order: number, board_id?: string | null, created_at: string, updated_at: string, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null }> };

export type GetBoardsQueryVariables = Exact<{
  where?: InputMaybe<Boards_Bool_Exp>;
  order_by?: InputMaybe<Array<Boards_Order_By> | Boards_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetBoardsQuery = { __typename?: 'query_root', boards: Array<{ __typename?: 'boards', id: string, name: string, alias: string, github?: string | null, sort_order: number, is_public: boolean, allow_public_comments: boolean, created_at: string, updated_at: string, labels: Array<{ __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null }>, user: { __typename?: 'users', id: string, username: string, email?: string | null }, board_members: Array<{ __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } }> }> };

export type CreateTodoMutationVariables = Exact<{
  objects: Array<Todos_Insert_Input> | Todos_Insert_Input;
}>;


export type CreateTodoMutation = { __typename?: 'mutation_root', insert_todos?: { __typename?: 'todos_mutation_response', returning: Array<{ __typename?: 'todos', id: string, title: string, content?: string | null, due_on?: string | null, sort_order: number, priority: string, list_id?: string | null, completed_at?: string | null, created_at: string, updated_at: string, labels: Array<{ __typename?: 'todo_labels', label: { __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null } }>, comments: Array<{ __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } }>, uploads: Array<{ __typename?: 'uploads', id: string, url: string, created_at: string }>, list?: { __typename?: 'lists', id: string, name: string, sort_order: number, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null } | null }> } | null };

export type UpdateTodosMutationVariables = Exact<{
  where: Todos_Bool_Exp;
  _set: Todos_Set_Input;
}>;


export type UpdateTodosMutation = { __typename?: 'mutation_root', update_todos?: { __typename?: 'todos_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'todos', id: string, title: string, content?: string | null, due_on?: string | null, sort_order: number, priority: string, list_id?: string | null, completed_at?: string | null, created_at: string, updated_at: string, labels: Array<{ __typename?: 'todo_labels', label: { __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null } }>, comments: Array<{ __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } }>, uploads: Array<{ __typename?: 'uploads', id: string, url: string, created_at: string }>, list?: { __typename?: 'lists', id: string, name: string, sort_order: number, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null } | null }> } | null };

export type DeleteTodosMutationVariables = Exact<{
  where: Todos_Bool_Exp;
}>;


export type DeleteTodosMutation = { __typename?: 'mutation_root', delete_todos?: { __typename?: 'todos_mutation_response', affected_rows: number } | null };

export type CreateListMutationVariables = Exact<{
  objects: Array<Lists_Insert_Input> | Lists_Insert_Input;
}>;


export type CreateListMutation = { __typename?: 'mutation_root', insert_lists?: { __typename?: 'lists_mutation_response', returning: Array<{ __typename?: 'lists', id: string, name: string, sort_order: number, board_id?: string | null, created_at: string, updated_at: string, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null }> } | null };

export type UpdateListMutationVariables = Exact<{
  where: Lists_Bool_Exp;
  _set: Lists_Set_Input;
}>;


export type UpdateListMutation = { __typename?: 'mutation_root', update_lists?: { __typename?: 'lists_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'lists', id: string, name: string, sort_order: number, board_id?: string | null, created_at: string, updated_at: string, board?: { __typename?: 'boards', id: string, name: string, alias: string, sort_order: number } | null }> } | null };

export type DeleteListMutationVariables = Exact<{
  where: Lists_Bool_Exp;
}>;


export type DeleteListMutation = { __typename?: 'mutation_root', delete_lists?: { __typename?: 'lists_mutation_response', affected_rows: number } | null };

export type CreateBoardMutationVariables = Exact<{
  objects: Array<Boards_Insert_Input> | Boards_Insert_Input;
}>;


export type CreateBoardMutation = { __typename?: 'mutation_root', insert_boards?: { __typename?: 'boards_mutation_response', returning: Array<{ __typename?: 'boards', id: string, name: string, alias: string, github?: string | null, sort_order: number, is_public: boolean, allow_public_comments: boolean, created_at: string, updated_at: string, labels: Array<{ __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null }>, user: { __typename?: 'users', id: string, username: string, email?: string | null }, board_members: Array<{ __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } }> }> } | null };

export type UpdateBoardMutationVariables = Exact<{
  where: Boards_Bool_Exp;
  _set: Boards_Set_Input;
}>;


export type UpdateBoardMutation = { __typename?: 'mutation_root', update_boards?: { __typename?: 'boards_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'boards', id: string, name: string, alias: string, github?: string | null, sort_order: number, is_public: boolean, allow_public_comments: boolean, created_at: string, updated_at: string, labels: Array<{ __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null }>, user: { __typename?: 'users', id: string, username: string, email?: string | null }, board_members: Array<{ __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } }> }> } | null };

export type DeleteBoardMutationVariables = Exact<{
  where: Boards_Bool_Exp;
}>;


export type DeleteBoardMutation = { __typename?: 'mutation_root', delete_boards?: { __typename?: 'boards_mutation_response', affected_rows: number } | null };

export type CreateUploadMutationVariables = Exact<{
  objects: Array<Uploads_Insert_Input> | Uploads_Insert_Input;
}>;


export type CreateUploadMutation = { __typename?: 'mutation_root', insert_uploads?: { __typename?: 'uploads_mutation_response', returning: Array<{ __typename?: 'uploads', id: string, url: string, todo_id: string, created_at: string }> } | null };

export type DeleteUploadMutationVariables = Exact<{
  where: Uploads_Bool_Exp;
}>;


export type DeleteUploadMutation = { __typename?: 'mutation_root', delete_uploads?: { __typename?: 'uploads_mutation_response', affected_rows: number } | null };

export type GetUsersQueryVariables = Exact<{
  where?: InputMaybe<Users_Bool_Exp>;
  order_by?: InputMaybe<Array<Users_Order_By> | Users_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'query_root', users: Array<{ __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null, locale: string, dark_mode: boolean, settings: any, default_labels?: any | null, emailVerified?: string | null, created_at: string, updated_at: string }> };

export type UpdateUserMutationVariables = Exact<{
  where: Users_Bool_Exp;
  _set: Users_Set_Input;
}>;


export type UpdateUserMutation = { __typename?: 'mutation_root', update_users?: { __typename?: 'users_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null, locale: string, dark_mode: boolean, settings: any, default_labels?: any | null, emailVerified?: string | null, created_at: string, updated_at: string }> } | null };

export type GetCommentsQueryVariables = Exact<{
  where?: InputMaybe<Comments_Bool_Exp>;
  order_by?: InputMaybe<Array<Comments_Order_By> | Comments_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetCommentsQuery = { __typename?: 'query_root', comments: Array<{ __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } }> };

export type CreateCommentMutationVariables = Exact<{
  objects: Array<Comments_Insert_Input> | Comments_Insert_Input;
}>;


export type CreateCommentMutation = { __typename?: 'mutation_root', insert_comments?: { __typename?: 'comments_mutation_response', returning: Array<{ __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } }> } | null };

export type UpdateCommentMutationVariables = Exact<{
  where: Comments_Bool_Exp;
  _set: Comments_Set_Input;
}>;


export type UpdateCommentMutation = { __typename?: 'mutation_root', update_comments?: { __typename?: 'comments_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'comments', id: string, content: string, todo_id: string, user_id: string, created_at?: string | null, updated_at?: string | null, user: { __typename?: 'users', id: string, name?: string | null, username: string, image?: string | null, email?: string | null } }> } | null };

export type DeleteCommentMutationVariables = Exact<{
  where: Comments_Bool_Exp;
}>;


export type DeleteCommentMutation = { __typename?: 'mutation_root', delete_comments?: { __typename?: 'comments_mutation_response', affected_rows: number } | null };

export type AddTodoLabelMutationVariables = Exact<{
  objects: Array<Todo_Labels_Insert_Input> | Todo_Labels_Insert_Input;
}>;


export type AddTodoLabelMutation = { __typename?: 'mutation_root', insert_todo_labels?: { __typename?: 'todo_labels_mutation_response', affected_rows: number } | null };

export type RemoveTodoLabelMutationVariables = Exact<{
  where: Todo_Labels_Bool_Exp;
}>;


export type RemoveTodoLabelMutation = { __typename?: 'mutation_root', delete_todo_labels?: { __typename?: 'todo_labels_mutation_response', affected_rows: number } | null };

export type CreateLabelMutationVariables = Exact<{
  objects: Array<Labels_Insert_Input> | Labels_Insert_Input;
}>;


export type CreateLabelMutation = { __typename?: 'mutation_root', insert_labels?: { __typename?: 'labels_mutation_response', returning: Array<{ __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null }> } | null };

export type UpdateLabelMutationVariables = Exact<{
  where: Labels_Bool_Exp;
  _set: Labels_Set_Input;
}>;


export type UpdateLabelMutation = { __typename?: 'mutation_root', update_labels?: { __typename?: 'labels_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'labels', id: string, name: string, color: string, sort_order?: number | null, board_id: string, created_at?: string | null, updated_at?: string | null }> } | null };

export type DeleteLabelMutationVariables = Exact<{
  where: Labels_Bool_Exp;
}>;


export type DeleteLabelMutation = { __typename?: 'mutation_root', delete_labels?: { __typename?: 'labels_mutation_response', affected_rows: number } | null };

export type GetBoardMembersQueryVariables = Exact<{
  where?: InputMaybe<Board_Members_Bool_Exp>;
  order_by?: InputMaybe<Array<Board_Members_Order_By> | Board_Members_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetBoardMembersQuery = { __typename?: 'query_root', board_members: Array<{ __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } }> };

export type AddBoardMemberMutationVariables = Exact<{
  objects: Array<Board_Members_Insert_Input> | Board_Members_Insert_Input;
}>;


export type AddBoardMemberMutation = { __typename?: 'mutation_root', insert_board_members?: { __typename?: 'board_members_mutation_response', returning: Array<{ __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } }> } | null };

export type UpdateBoardMemberMutationVariables = Exact<{
  where: Board_Members_Bool_Exp;
  _set: Board_Members_Set_Input;
}>;


export type UpdateBoardMemberMutation = { __typename?: 'mutation_root', update_board_members?: { __typename?: 'board_members_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'board_members', id: string, board_id: string, user_id: string, role: string, created_at: string, updated_at: string, user: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null } }> } | null };

export type RemoveBoardMemberMutationVariables = Exact<{
  where: Board_Members_Bool_Exp;
}>;


export type RemoveBoardMemberMutation = { __typename?: 'mutation_root', delete_board_members?: { __typename?: 'board_members_mutation_response', affected_rows: number } | null };

export type GetBoardInvitationsQueryVariables = Exact<{
  where?: InputMaybe<Board_Invitations_Bool_Exp>;
  order_by?: InputMaybe<Array<Board_Invitations_Order_By> | Board_Invitations_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetBoardInvitationsQuery = { __typename?: 'query_root', board_invitations: Array<{ __typename?: 'board_invitations', id: string, board_id: string, inviter_id: string, invitee_email?: string | null, invitee_username?: string | null, role: string, status: string, token: string, created_at: string, updated_at: string, expires_at: string, inviter: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null }, board: { __typename?: 'boards', id: string, name: string, alias: string } }> };

export type GetMyInvitationsQueryVariables = Exact<{
  email: Scalars['String']['input'];
  username: Scalars['String']['input'];
}>;


export type GetMyInvitationsQuery = { __typename?: 'query_root', board_invitations: Array<{ __typename?: 'board_invitations', id: string, board_id: string, inviter_id: string, invitee_email?: string | null, invitee_username?: string | null, role: string, status: string, token: string, created_at: string, updated_at: string, expires_at: string, inviter: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null }, board: { __typename?: 'boards', id: string, name: string, alias: string } }> };

export type CreateBoardInvitationMutationVariables = Exact<{
  objects: Array<Board_Invitations_Insert_Input> | Board_Invitations_Insert_Input;
}>;


export type CreateBoardInvitationMutation = { __typename?: 'mutation_root', insert_board_invitations?: { __typename?: 'board_invitations_mutation_response', returning: Array<{ __typename?: 'board_invitations', id: string, board_id: string, inviter_id: string, invitee_email?: string | null, invitee_username?: string | null, role: string, status: string, token: string, created_at: string, updated_at: string, expires_at: string, inviter: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null }, board: { __typename?: 'boards', id: string, name: string, alias: string } }> } | null };

export type UpdateBoardInvitationMutationVariables = Exact<{
  where: Board_Invitations_Bool_Exp;
  _set: Board_Invitations_Set_Input;
}>;


export type UpdateBoardInvitationMutation = { __typename?: 'mutation_root', update_board_invitations?: { __typename?: 'board_invitations_mutation_response', affected_rows: number, returning: Array<{ __typename?: 'board_invitations', id: string, board_id: string, inviter_id: string, invitee_email?: string | null, invitee_username?: string | null, role: string, status: string, token: string, created_at: string, updated_at: string, expires_at: string, inviter: { __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null }, board: { __typename?: 'boards', id: string, name: string, alias: string } }> } | null };

export type DeleteBoardInvitationMutationVariables = Exact<{
  where: Board_Invitations_Bool_Exp;
}>;


export type DeleteBoardInvitationMutation = { __typename?: 'mutation_root', delete_board_invitations?: { __typename?: 'board_invitations_mutation_response', affected_rows: number } | null };

export type SearchUsersQueryVariables = Exact<{
  search: Scalars['String']['input'];
}>;


export type SearchUsersQuery = { __typename?: 'query_root', users: Array<{ __typename?: 'users', id: string, name?: string | null, username: string, email?: string | null, image?: string | null }> };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const LabelFieldsFragmentDoc = new TypedDocumentString(`
    fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}
    `, {"fragmentName":"LabelFields"}) as unknown as TypedDocumentString<LabelFieldsFragment, unknown>;
export const CommentFieldsFragmentDoc = new TypedDocumentString(`
    fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}
    `, {"fragmentName":"CommentFields"}) as unknown as TypedDocumentString<CommentFieldsFragment, unknown>;
export const TodoFieldsFragmentDoc = new TypedDocumentString(`
    fragment TodoFields on todos {
  id
  title
  content
  due_on
  sort_order
  priority
  list_id
  completed_at
  created_at
  updated_at
  labels {
    label {
      ...LabelFields
    }
  }
  comments(order_by: {created_at: asc}) {
    ...CommentFields
  }
  uploads {
    id
    url
    created_at
  }
  list {
    id
    name
    sort_order
    board {
      id
      name
      alias
      sort_order
    }
  }
}
    fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`, {"fragmentName":"TodoFields"}) as unknown as TypedDocumentString<TodoFieldsFragment, unknown>;
export const ListFieldsFragmentDoc = new TypedDocumentString(`
    fragment ListFields on lists {
  id
  name
  sort_order
  board_id
  created_at
  updated_at
  board {
    id
    name
    alias
    sort_order
  }
}
    `, {"fragmentName":"ListFields"}) as unknown as TypedDocumentString<ListFieldsFragment, unknown>;
export const BoardInvitationFieldsFragmentDoc = new TypedDocumentString(`
    fragment BoardInvitationFields on board_invitations {
  id
  board_id
  inviter_id
  invitee_email
  invitee_username
  role
  status
  token
  created_at
  updated_at
  expires_at
  inviter {
    id
    name
    username
    email
    image
  }
  board {
    id
    name
    alias
  }
}
    `, {"fragmentName":"BoardInvitationFields"}) as unknown as TypedDocumentString<BoardInvitationFieldsFragment, unknown>;
export const BoardMemberFieldsFragmentDoc = new TypedDocumentString(`
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}
    `, {"fragmentName":"BoardMemberFields"}) as unknown as TypedDocumentString<BoardMemberFieldsFragment, unknown>;
export const BoardFieldsFragmentDoc = new TypedDocumentString(`
    fragment BoardFields on boards {
  id
  name
  alias
  github
  sort_order
  is_public
  allow_public_comments
  created_at
  updated_at
  labels {
    ...LabelFields
  }
  user {
    id
    username
    email
  }
  board_members {
    ...BoardMemberFields
  }
}
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`, {"fragmentName":"BoardFields"}) as unknown as TypedDocumentString<BoardFieldsFragment, unknown>;
export const UserFieldsFragmentDoc = new TypedDocumentString(`
    fragment UserFields on users {
  id
  name
  username
  image
  email
  locale
  dark_mode
  settings
  default_labels
  emailVerified
  created_at
  updated_at
}
    `, {"fragmentName":"UserFields"}) as unknown as TypedDocumentString<UserFieldsFragment, unknown>;
export const GetTodosDocument = new TypedDocumentString(`
    query GetTodos($where: todos_bool_exp = {}, $order_by: [todos_order_by!] = {sort_order: asc, due_on: desc, updated_at: desc}, $limit: Int = 100, $offset: Int = 0) {
  todos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    ...TodoFields
  }
}
    fragment TodoFields on todos {
  id
  title
  content
  due_on
  sort_order
  priority
  list_id
  completed_at
  created_at
  updated_at
  labels {
    label {
      ...LabelFields
    }
  }
  comments(order_by: {created_at: asc}) {
    ...CommentFields
  }
  uploads {
    id
    url
    created_at
  }
  list {
    id
    name
    sort_order
    board {
      id
      name
      alias
      sort_order
    }
  }
}
fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<GetTodosQuery, GetTodosQueryVariables>;
export const GetListsDocument = new TypedDocumentString(`
    query GetLists($where: lists_bool_exp = {}, $order_by: [lists_order_by!] = {sort_order: asc, name: asc}, $limit: Int = 100, $offset: Int = 0) {
  lists(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    ...ListFields
  }
}
    fragment ListFields on lists {
  id
  name
  sort_order
  board_id
  created_at
  updated_at
  board {
    id
    name
    alias
    sort_order
  }
}`) as unknown as TypedDocumentString<GetListsQuery, GetListsQueryVariables>;
export const GetBoardsDocument = new TypedDocumentString(`
    query GetBoards($where: boards_bool_exp = {}, $order_by: [boards_order_by!] = {sort_order: asc, name: asc}, $limit: Int = 100, $offset: Int = 0) {
  boards(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    ...BoardFields
  }
}
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}
fragment BoardFields on boards {
  id
  name
  alias
  github
  sort_order
  is_public
  allow_public_comments
  created_at
  updated_at
  labels {
    ...LabelFields
  }
  user {
    id
    username
    email
  }
  board_members {
    ...BoardMemberFields
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<GetBoardsQuery, GetBoardsQueryVariables>;
export const CreateTodoDocument = new TypedDocumentString(`
    mutation CreateTodo($objects: [todos_insert_input!]!) {
  insert_todos(objects: $objects) {
    returning {
      ...TodoFields
    }
  }
}
    fragment TodoFields on todos {
  id
  title
  content
  due_on
  sort_order
  priority
  list_id
  completed_at
  created_at
  updated_at
  labels {
    label {
      ...LabelFields
    }
  }
  comments(order_by: {created_at: asc}) {
    ...CommentFields
  }
  uploads {
    id
    url
    created_at
  }
  list {
    id
    name
    sort_order
    board {
      id
      name
      alias
      sort_order
    }
  }
}
fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<CreateTodoMutation, CreateTodoMutationVariables>;
export const UpdateTodosDocument = new TypedDocumentString(`
    mutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {
  update_todos(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...TodoFields
    }
  }
}
    fragment TodoFields on todos {
  id
  title
  content
  due_on
  sort_order
  priority
  list_id
  completed_at
  created_at
  updated_at
  labels {
    label {
      ...LabelFields
    }
  }
  comments(order_by: {created_at: asc}) {
    ...CommentFields
  }
  uploads {
    id
    url
    created_at
  }
  list {
    id
    name
    sort_order
    board {
      id
      name
      alias
      sort_order
    }
  }
}
fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<UpdateTodosMutation, UpdateTodosMutationVariables>;
export const DeleteTodosDocument = new TypedDocumentString(`
    mutation DeleteTodos($where: todos_bool_exp!) {
  delete_todos(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteTodosMutation, DeleteTodosMutationVariables>;
export const CreateListDocument = new TypedDocumentString(`
    mutation CreateList($objects: [lists_insert_input!]!) {
  insert_lists(objects: $objects) {
    returning {
      ...ListFields
    }
  }
}
    fragment ListFields on lists {
  id
  name
  sort_order
  board_id
  created_at
  updated_at
  board {
    id
    name
    alias
    sort_order
  }
}`) as unknown as TypedDocumentString<CreateListMutation, CreateListMutationVariables>;
export const UpdateListDocument = new TypedDocumentString(`
    mutation UpdateList($where: lists_bool_exp!, $_set: lists_set_input!) {
  update_lists(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...ListFields
    }
  }
}
    fragment ListFields on lists {
  id
  name
  sort_order
  board_id
  created_at
  updated_at
  board {
    id
    name
    alias
    sort_order
  }
}`) as unknown as TypedDocumentString<UpdateListMutation, UpdateListMutationVariables>;
export const DeleteListDocument = new TypedDocumentString(`
    mutation DeleteList($where: lists_bool_exp!) {
  delete_lists(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteListMutation, DeleteListMutationVariables>;
export const CreateBoardDocument = new TypedDocumentString(`
    mutation CreateBoard($objects: [boards_insert_input!]!) {
  insert_boards(objects: $objects) {
    returning {
      ...BoardFields
    }
  }
}
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}
fragment BoardFields on boards {
  id
  name
  alias
  github
  sort_order
  is_public
  allow_public_comments
  created_at
  updated_at
  labels {
    ...LabelFields
  }
  user {
    id
    username
    email
  }
  board_members {
    ...BoardMemberFields
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<CreateBoardMutation, CreateBoardMutationVariables>;
export const UpdateBoardDocument = new TypedDocumentString(`
    mutation UpdateBoard($where: boards_bool_exp!, $_set: boards_set_input!) {
  update_boards(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...BoardFields
    }
  }
}
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}
fragment BoardFields on boards {
  id
  name
  alias
  github
  sort_order
  is_public
  allow_public_comments
  created_at
  updated_at
  labels {
    ...LabelFields
  }
  user {
    id
    username
    email
  }
  board_members {
    ...BoardMemberFields
  }
}
fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<UpdateBoardMutation, UpdateBoardMutationVariables>;
export const DeleteBoardDocument = new TypedDocumentString(`
    mutation DeleteBoard($where: boards_bool_exp!) {
  delete_boards(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteBoardMutation, DeleteBoardMutationVariables>;
export const CreateUploadDocument = new TypedDocumentString(`
    mutation CreateUpload($objects: [uploads_insert_input!]!) {
  insert_uploads(objects: $objects) {
    returning {
      id
      url
      todo_id
      created_at
    }
  }
}
    `) as unknown as TypedDocumentString<CreateUploadMutation, CreateUploadMutationVariables>;
export const DeleteUploadDocument = new TypedDocumentString(`
    mutation DeleteUpload($where: uploads_bool_exp!) {
  delete_uploads(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteUploadMutation, DeleteUploadMutationVariables>;
export const GetUsersDocument = new TypedDocumentString(`
    query GetUsers($where: users_bool_exp = {}, $order_by: [users_order_by!] = {}, $limit: Int = 100, $offset: Int = 0) {
  users(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    ...UserFields
  }
}
    fragment UserFields on users {
  id
  name
  username
  image
  email
  locale
  dark_mode
  settings
  default_labels
  emailVerified
  created_at
  updated_at
}`) as unknown as TypedDocumentString<GetUsersQuery, GetUsersQueryVariables>;
export const UpdateUserDocument = new TypedDocumentString(`
    mutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {
  update_users(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...UserFields
    }
  }
}
    fragment UserFields on users {
  id
  name
  username
  image
  email
  locale
  dark_mode
  settings
  default_labels
  emailVerified
  created_at
  updated_at
}`) as unknown as TypedDocumentString<UpdateUserMutation, UpdateUserMutationVariables>;
export const GetCommentsDocument = new TypedDocumentString(`
    query GetComments($where: comments_bool_exp = {}, $order_by: [comments_order_by!] = {created_at: asc}, $limit: Int = 100, $offset: Int = 0) {
  comments(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    ...CommentFields
  }
}
    fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}`) as unknown as TypedDocumentString<GetCommentsQuery, GetCommentsQueryVariables>;
export const CreateCommentDocument = new TypedDocumentString(`
    mutation CreateComment($objects: [comments_insert_input!]!) {
  insert_comments(objects: $objects) {
    returning {
      ...CommentFields
    }
  }
}
    fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}`) as unknown as TypedDocumentString<CreateCommentMutation, CreateCommentMutationVariables>;
export const UpdateCommentDocument = new TypedDocumentString(`
    mutation UpdateComment($where: comments_bool_exp!, $_set: comments_set_input!) {
  update_comments(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...CommentFields
    }
  }
}
    fragment CommentFields on comments {
  id
  content
  todo_id
  user_id
  created_at
  updated_at
  user {
    id
    name
    username
    image
    email
  }
}`) as unknown as TypedDocumentString<UpdateCommentMutation, UpdateCommentMutationVariables>;
export const DeleteCommentDocument = new TypedDocumentString(`
    mutation DeleteComment($where: comments_bool_exp!) {
  delete_comments(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteCommentMutation, DeleteCommentMutationVariables>;
export const AddTodoLabelDocument = new TypedDocumentString(`
    mutation AddTodoLabel($objects: [todo_labels_insert_input!]!) {
  insert_todo_labels(objects: $objects) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<AddTodoLabelMutation, AddTodoLabelMutationVariables>;
export const RemoveTodoLabelDocument = new TypedDocumentString(`
    mutation RemoveTodoLabel($where: todo_labels_bool_exp!) {
  delete_todo_labels(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<RemoveTodoLabelMutation, RemoveTodoLabelMutationVariables>;
export const CreateLabelDocument = new TypedDocumentString(`
    mutation CreateLabel($objects: [labels_insert_input!]!) {
  insert_labels(objects: $objects) {
    returning {
      ...LabelFields
    }
  }
}
    fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<CreateLabelMutation, CreateLabelMutationVariables>;
export const UpdateLabelDocument = new TypedDocumentString(`
    mutation UpdateLabel($where: labels_bool_exp!, $_set: labels_set_input!) {
  update_labels(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...LabelFields
    }
  }
}
    fragment LabelFields on labels {
  id
  name
  color
  sort_order
  board_id
  created_at
  updated_at
}`) as unknown as TypedDocumentString<UpdateLabelMutation, UpdateLabelMutationVariables>;
export const DeleteLabelDocument = new TypedDocumentString(`
    mutation DeleteLabel($where: labels_bool_exp!) {
  delete_labels(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteLabelMutation, DeleteLabelMutationVariables>;
export const GetBoardMembersDocument = new TypedDocumentString(`
    query GetBoardMembers($where: board_members_bool_exp = {}, $order_by: [board_members_order_by!] = {created_at: asc}, $limit: Int = 100, $offset: Int = 0) {
  board_members(
    where: $where
    order_by: $order_by
    limit: $limit
    offset: $offset
  ) {
    ...BoardMemberFields
  }
}
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}`) as unknown as TypedDocumentString<GetBoardMembersQuery, GetBoardMembersQueryVariables>;
export const AddBoardMemberDocument = new TypedDocumentString(`
    mutation AddBoardMember($objects: [board_members_insert_input!]!) {
  insert_board_members(objects: $objects) {
    returning {
      ...BoardMemberFields
    }
  }
}
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}`) as unknown as TypedDocumentString<AddBoardMemberMutation, AddBoardMemberMutationVariables>;
export const UpdateBoardMemberDocument = new TypedDocumentString(`
    mutation UpdateBoardMember($where: board_members_bool_exp!, $_set: board_members_set_input!) {
  update_board_members(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...BoardMemberFields
    }
  }
}
    fragment BoardMemberFields on board_members {
  id
  board_id
  user_id
  role
  created_at
  updated_at
  user {
    id
    name
    username
    email
    image
  }
}`) as unknown as TypedDocumentString<UpdateBoardMemberMutation, UpdateBoardMemberMutationVariables>;
export const RemoveBoardMemberDocument = new TypedDocumentString(`
    mutation RemoveBoardMember($where: board_members_bool_exp!) {
  delete_board_members(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<RemoveBoardMemberMutation, RemoveBoardMemberMutationVariables>;
export const GetBoardInvitationsDocument = new TypedDocumentString(`
    query GetBoardInvitations($where: board_invitations_bool_exp = {}, $order_by: [board_invitations_order_by!] = {created_at: desc}, $limit: Int = 100, $offset: Int = 0) {
  board_invitations(
    where: $where
    order_by: $order_by
    limit: $limit
    offset: $offset
  ) {
    ...BoardInvitationFields
  }
}
    fragment BoardInvitationFields on board_invitations {
  id
  board_id
  inviter_id
  invitee_email
  invitee_username
  role
  status
  token
  created_at
  updated_at
  expires_at
  inviter {
    id
    name
    username
    email
    image
  }
  board {
    id
    name
    alias
  }
}`) as unknown as TypedDocumentString<GetBoardInvitationsQuery, GetBoardInvitationsQueryVariables>;
export const GetMyInvitationsDocument = new TypedDocumentString(`
    query GetMyInvitations($email: String!, $username: String!) {
  board_invitations(
    where: {_and: [{status: {_eq: "pending"}}, {expires_at: {_gt: "now()"}}, {_or: [{invitee_email: {_eq: $email}}, {invitee_username: {_eq: $username}}]}]}
    order_by: {created_at: desc}
  ) {
    ...BoardInvitationFields
  }
}
    fragment BoardInvitationFields on board_invitations {
  id
  board_id
  inviter_id
  invitee_email
  invitee_username
  role
  status
  token
  created_at
  updated_at
  expires_at
  inviter {
    id
    name
    username
    email
    image
  }
  board {
    id
    name
    alias
  }
}`) as unknown as TypedDocumentString<GetMyInvitationsQuery, GetMyInvitationsQueryVariables>;
export const CreateBoardInvitationDocument = new TypedDocumentString(`
    mutation CreateBoardInvitation($objects: [board_invitations_insert_input!]!) {
  insert_board_invitations(objects: $objects) {
    returning {
      ...BoardInvitationFields
    }
  }
}
    fragment BoardInvitationFields on board_invitations {
  id
  board_id
  inviter_id
  invitee_email
  invitee_username
  role
  status
  token
  created_at
  updated_at
  expires_at
  inviter {
    id
    name
    username
    email
    image
  }
  board {
    id
    name
    alias
  }
}`) as unknown as TypedDocumentString<CreateBoardInvitationMutation, CreateBoardInvitationMutationVariables>;
export const UpdateBoardInvitationDocument = new TypedDocumentString(`
    mutation UpdateBoardInvitation($where: board_invitations_bool_exp!, $_set: board_invitations_set_input!) {
  update_board_invitations(where: $where, _set: $_set) {
    affected_rows
    returning {
      ...BoardInvitationFields
    }
  }
}
    fragment BoardInvitationFields on board_invitations {
  id
  board_id
  inviter_id
  invitee_email
  invitee_username
  role
  status
  token
  created_at
  updated_at
  expires_at
  inviter {
    id
    name
    username
    email
    image
  }
  board {
    id
    name
    alias
  }
}`) as unknown as TypedDocumentString<UpdateBoardInvitationMutation, UpdateBoardInvitationMutationVariables>;
export const DeleteBoardInvitationDocument = new TypedDocumentString(`
    mutation DeleteBoardInvitation($where: board_invitations_bool_exp!) {
  delete_board_invitations(where: $where) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteBoardInvitationMutation, DeleteBoardInvitationMutationVariables>;
export const SearchUsersDocument = new TypedDocumentString(`
    query SearchUsers($search: String!) {
  users(
    where: {_or: [{email: {_ilike: $search}}, {username: {_ilike: $search}}, {name: {_ilike: $search}}]}
    limit: 10
  ) {
    id
    name
    username
    email
    image
  }
}
    `) as unknown as TypedDocumentString<SearchUsersQuery, SearchUsersQueryVariables>;