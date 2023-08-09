import type { GraphQLClient } from 'graphql-request'
import type * as Dom from 'graphql-request/dist/types.dom'
import gql from 'graphql-tag'
import type { ClientError } from 'graphql-request/dist/types'
import type {
  SWRConfiguration as SWRConfigInterface,
  Key as SWRKeyInterface,
} from 'swr'
import useSWR from 'swr'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  bigint: any
  jsonb: any
  timestamptz: any
}

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']>
  _gt?: InputMaybe<Scalars['Boolean']>
  _gte?: InputMaybe<Scalars['Boolean']>
  _in?: InputMaybe<Array<Scalars['Boolean']>>
  _is_null?: InputMaybe<Scalars['Boolean']>
  _lt?: InputMaybe<Scalars['Boolean']>
  _lte?: InputMaybe<Scalars['Boolean']>
  _neq?: InputMaybe<Scalars['Boolean']>
  _nin?: InputMaybe<Array<Scalars['Boolean']>>
}

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']>
  _gt?: InputMaybe<Scalars['Int']>
  _gte?: InputMaybe<Scalars['Int']>
  _in?: InputMaybe<Array<Scalars['Int']>>
  _is_null?: InputMaybe<Scalars['Boolean']>
  _lt?: InputMaybe<Scalars['Int']>
  _lte?: InputMaybe<Scalars['Int']>
  _neq?: InputMaybe<Scalars['Int']>
  _nin?: InputMaybe<Array<Scalars['Int']>>
}

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']>
  _gt?: InputMaybe<Scalars['String']>
  _gte?: InputMaybe<Scalars['String']>
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']>
  _in?: InputMaybe<Array<Scalars['String']>>
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']>
  _is_null?: InputMaybe<Scalars['Boolean']>
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']>
  _lt?: InputMaybe<Scalars['String']>
  _lte?: InputMaybe<Scalars['String']>
  _neq?: InputMaybe<Scalars['String']>
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']>
  _nin?: InputMaybe<Array<Scalars['String']>>
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']>
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']>
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']>
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']>
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']>
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']>
}

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bigint']>
  _gt?: InputMaybe<Scalars['bigint']>
  _gte?: InputMaybe<Scalars['bigint']>
  _in?: InputMaybe<Array<Scalars['bigint']>>
  _is_null?: InputMaybe<Scalars['Boolean']>
  _lt?: InputMaybe<Scalars['bigint']>
  _lte?: InputMaybe<Scalars['bigint']>
  _neq?: InputMaybe<Scalars['bigint']>
  _nin?: InputMaybe<Array<Scalars['bigint']>>
}

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = 'ASC',
  /** descending ordering of the cursor */
  Desc = 'DESC',
}

/** columns and relationships of "dipdup_contract" */
export type Dipdup_Contract = {
  __typename?: 'dipdup_contract'
  address: Scalars['String']
  created_at: Scalars['timestamptz']
  name: Scalars['String']
  typename?: Maybe<Scalars['String']>
  updated_at: Scalars['timestamptz']
}

/** aggregated selection of "dipdup_contract" */
export type Dipdup_Contract_Aggregate = {
  __typename?: 'dipdup_contract_aggregate'
  aggregate?: Maybe<Dipdup_Contract_Aggregate_Fields>
  nodes: Array<Dipdup_Contract>
}

/** aggregate fields of "dipdup_contract" */
export type Dipdup_Contract_Aggregate_Fields = {
  __typename?: 'dipdup_contract_aggregate_fields'
  count: Scalars['Int']
  max?: Maybe<Dipdup_Contract_Max_Fields>
  min?: Maybe<Dipdup_Contract_Min_Fields>
}

/** aggregate fields of "dipdup_contract" */
export type Dipdup_Contract_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Contract_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** Boolean expression to filter rows from the table "dipdup_contract". All fields are combined with a logical 'AND'. */
export type Dipdup_Contract_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Contract_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Contract_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Contract_Bool_Exp>>
  address?: InputMaybe<String_Comparison_Exp>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  name?: InputMaybe<String_Comparison_Exp>
  typename?: InputMaybe<String_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Contract_Max_Fields = {
  __typename?: 'dipdup_contract_max_fields'
  address?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  name?: Maybe<Scalars['String']>
  typename?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** columns and relationships of "dipdup_contract_metadata" */
export type Dipdup_Contract_Metadata = {
  __typename?: 'dipdup_contract_metadata'
  contract: Scalars['String']
  created_at: Scalars['timestamptz']
  id: Scalars['Int']
  metadata: Scalars['jsonb']
  network: Scalars['String']
  update_id: Scalars['Int']
  updated_at: Scalars['timestamptz']
}

/** columns and relationships of "dipdup_contract_metadata" */
export type Dipdup_Contract_MetadataMetadataArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** aggregated selection of "dipdup_contract_metadata" */
export type Dipdup_Contract_Metadata_Aggregate = {
  __typename?: 'dipdup_contract_metadata_aggregate'
  aggregate?: Maybe<Dipdup_Contract_Metadata_Aggregate_Fields>
  nodes: Array<Dipdup_Contract_Metadata>
}

/** aggregate fields of "dipdup_contract_metadata" */
export type Dipdup_Contract_Metadata_Aggregate_Fields = {
  __typename?: 'dipdup_contract_metadata_aggregate_fields'
  avg?: Maybe<Dipdup_Contract_Metadata_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Dipdup_Contract_Metadata_Max_Fields>
  min?: Maybe<Dipdup_Contract_Metadata_Min_Fields>
  stddev?: Maybe<Dipdup_Contract_Metadata_Stddev_Fields>
  stddev_pop?: Maybe<Dipdup_Contract_Metadata_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Dipdup_Contract_Metadata_Stddev_Samp_Fields>
  sum?: Maybe<Dipdup_Contract_Metadata_Sum_Fields>
  var_pop?: Maybe<Dipdup_Contract_Metadata_Var_Pop_Fields>
  var_samp?: Maybe<Dipdup_Contract_Metadata_Var_Samp_Fields>
  variance?: Maybe<Dipdup_Contract_Metadata_Variance_Fields>
}

/** aggregate fields of "dipdup_contract_metadata" */
export type Dipdup_Contract_Metadata_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Contract_Metadata_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** aggregate avg on columns */
export type Dipdup_Contract_Metadata_Avg_Fields = {
  __typename?: 'dipdup_contract_metadata_avg_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** Boolean expression to filter rows from the table "dipdup_contract_metadata". All fields are combined with a logical 'AND'. */
export type Dipdup_Contract_Metadata_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Contract_Metadata_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Contract_Metadata_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Contract_Metadata_Bool_Exp>>
  contract?: InputMaybe<String_Comparison_Exp>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  id?: InputMaybe<Int_Comparison_Exp>
  metadata?: InputMaybe<Jsonb_Comparison_Exp>
  network?: InputMaybe<String_Comparison_Exp>
  update_id?: InputMaybe<Int_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Contract_Metadata_Max_Fields = {
  __typename?: 'dipdup_contract_metadata_max_fields'
  contract?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  id?: Maybe<Scalars['Int']>
  network?: Maybe<Scalars['String']>
  update_id?: Maybe<Scalars['Int']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** aggregate min on columns */
export type Dipdup_Contract_Metadata_Min_Fields = {
  __typename?: 'dipdup_contract_metadata_min_fields'
  contract?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  id?: Maybe<Scalars['Int']>
  network?: Maybe<Scalars['String']>
  update_id?: Maybe<Scalars['Int']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** Ordering options when selecting data from "dipdup_contract_metadata". */
export type Dipdup_Contract_Metadata_Order_By = {
  contract?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  id?: InputMaybe<Order_By>
  metadata?: InputMaybe<Order_By>
  network?: InputMaybe<Order_By>
  update_id?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_contract_metadata" */
export enum Dipdup_Contract_Metadata_Select_Column {
  /** column name */
  Contract = 'contract',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Metadata = 'metadata',
  /** column name */
  Network = 'network',
  /** column name */
  UpdateId = 'update_id',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** aggregate stddev on columns */
export type Dipdup_Contract_Metadata_Stddev_Fields = {
  __typename?: 'dipdup_contract_metadata_stddev_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate stddev_pop on columns */
export type Dipdup_Contract_Metadata_Stddev_Pop_Fields = {
  __typename?: 'dipdup_contract_metadata_stddev_pop_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate stddev_samp on columns */
export type Dipdup_Contract_Metadata_Stddev_Samp_Fields = {
  __typename?: 'dipdup_contract_metadata_stddev_samp_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** Streaming cursor of the table "dipdup_contract_metadata" */
export type Dipdup_Contract_Metadata_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Contract_Metadata_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Contract_Metadata_Stream_Cursor_Value_Input = {
  contract?: InputMaybe<Scalars['String']>
  created_at?: InputMaybe<Scalars['timestamptz']>
  id?: InputMaybe<Scalars['Int']>
  metadata?: InputMaybe<Scalars['jsonb']>
  network?: InputMaybe<Scalars['String']>
  update_id?: InputMaybe<Scalars['Int']>
  updated_at?: InputMaybe<Scalars['timestamptz']>
}

/** aggregate sum on columns */
export type Dipdup_Contract_Metadata_Sum_Fields = {
  __typename?: 'dipdup_contract_metadata_sum_fields'
  id?: Maybe<Scalars['Int']>
  update_id?: Maybe<Scalars['Int']>
}

/** aggregate var_pop on columns */
export type Dipdup_Contract_Metadata_Var_Pop_Fields = {
  __typename?: 'dipdup_contract_metadata_var_pop_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate var_samp on columns */
export type Dipdup_Contract_Metadata_Var_Samp_Fields = {
  __typename?: 'dipdup_contract_metadata_var_samp_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate variance on columns */
export type Dipdup_Contract_Metadata_Variance_Fields = {
  __typename?: 'dipdup_contract_metadata_variance_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate min on columns */
export type Dipdup_Contract_Min_Fields = {
  __typename?: 'dipdup_contract_min_fields'
  address?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  name?: Maybe<Scalars['String']>
  typename?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** Ordering options when selecting data from "dipdup_contract". */
export type Dipdup_Contract_Order_By = {
  address?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  typename?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_contract" */
export enum Dipdup_Contract_Select_Column {
  /** column name */
  Address = 'address',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Name = 'name',
  /** column name */
  Typename = 'typename',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** Streaming cursor of the table "dipdup_contract" */
export type Dipdup_Contract_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Contract_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Contract_Stream_Cursor_Value_Input = {
  address?: InputMaybe<Scalars['String']>
  created_at?: InputMaybe<Scalars['timestamptz']>
  name?: InputMaybe<Scalars['String']>
  typename?: InputMaybe<Scalars['String']>
  updated_at?: InputMaybe<Scalars['timestamptz']>
}

/** columns and relationships of "dipdup_head" */
export type Dipdup_Head = {
  __typename?: 'dipdup_head'
  created_at: Scalars['timestamptz']
  hash: Scalars['String']
  level: Scalars['Int']
  name: Scalars['String']
  timestamp: Scalars['timestamptz']
  updated_at: Scalars['timestamptz']
}

/** aggregated selection of "dipdup_head" */
export type Dipdup_Head_Aggregate = {
  __typename?: 'dipdup_head_aggregate'
  aggregate?: Maybe<Dipdup_Head_Aggregate_Fields>
  nodes: Array<Dipdup_Head>
}

/** aggregate fields of "dipdup_head" */
export type Dipdup_Head_Aggregate_Fields = {
  __typename?: 'dipdup_head_aggregate_fields'
  avg?: Maybe<Dipdup_Head_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Dipdup_Head_Max_Fields>
  min?: Maybe<Dipdup_Head_Min_Fields>
  stddev?: Maybe<Dipdup_Head_Stddev_Fields>
  stddev_pop?: Maybe<Dipdup_Head_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Dipdup_Head_Stddev_Samp_Fields>
  sum?: Maybe<Dipdup_Head_Sum_Fields>
  var_pop?: Maybe<Dipdup_Head_Var_Pop_Fields>
  var_samp?: Maybe<Dipdup_Head_Var_Samp_Fields>
  variance?: Maybe<Dipdup_Head_Variance_Fields>
}

/** aggregate fields of "dipdup_head" */
export type Dipdup_Head_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Head_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** aggregate avg on columns */
export type Dipdup_Head_Avg_Fields = {
  __typename?: 'dipdup_head_avg_fields'
  level?: Maybe<Scalars['Float']>
}

/** Boolean expression to filter rows from the table "dipdup_head". All fields are combined with a logical 'AND'. */
export type Dipdup_Head_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Head_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Head_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Head_Bool_Exp>>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  hash?: InputMaybe<String_Comparison_Exp>
  level?: InputMaybe<Int_Comparison_Exp>
  name?: InputMaybe<String_Comparison_Exp>
  timestamp?: InputMaybe<Timestamptz_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Head_Max_Fields = {
  __typename?: 'dipdup_head_max_fields'
  created_at?: Maybe<Scalars['timestamptz']>
  hash?: Maybe<Scalars['String']>
  level?: Maybe<Scalars['Int']>
  name?: Maybe<Scalars['String']>
  timestamp?: Maybe<Scalars['timestamptz']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** aggregate min on columns */
export type Dipdup_Head_Min_Fields = {
  __typename?: 'dipdup_head_min_fields'
  created_at?: Maybe<Scalars['timestamptz']>
  hash?: Maybe<Scalars['String']>
  level?: Maybe<Scalars['Int']>
  name?: Maybe<Scalars['String']>
  timestamp?: Maybe<Scalars['timestamptz']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** Ordering options when selecting data from "dipdup_head". */
export type Dipdup_Head_Order_By = {
  created_at?: InputMaybe<Order_By>
  hash?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  timestamp?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_head" */
export enum Dipdup_Head_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Hash = 'hash',
  /** column name */
  Level = 'level',
  /** column name */
  Name = 'name',
  /** column name */
  Timestamp = 'timestamp',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** columns and relationships of "dipdup_head_status" */
export type Dipdup_Head_Status = {
  __typename?: 'dipdup_head_status'
  name?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['String']>
}

/** aggregated selection of "dipdup_head_status" */
export type Dipdup_Head_Status_Aggregate = {
  __typename?: 'dipdup_head_status_aggregate'
  aggregate?: Maybe<Dipdup_Head_Status_Aggregate_Fields>
  nodes: Array<Dipdup_Head_Status>
}

/** aggregate fields of "dipdup_head_status" */
export type Dipdup_Head_Status_Aggregate_Fields = {
  __typename?: 'dipdup_head_status_aggregate_fields'
  count: Scalars['Int']
  max?: Maybe<Dipdup_Head_Status_Max_Fields>
  min?: Maybe<Dipdup_Head_Status_Min_Fields>
}

/** aggregate fields of "dipdup_head_status" */
export type Dipdup_Head_Status_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Head_Status_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** Boolean expression to filter rows from the table "dipdup_head_status". All fields are combined with a logical 'AND'. */
export type Dipdup_Head_Status_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Head_Status_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Head_Status_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Head_Status_Bool_Exp>>
  name?: InputMaybe<String_Comparison_Exp>
  status?: InputMaybe<String_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Head_Status_Max_Fields = {
  __typename?: 'dipdup_head_status_max_fields'
  name?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['String']>
}

/** aggregate min on columns */
export type Dipdup_Head_Status_Min_Fields = {
  __typename?: 'dipdup_head_status_min_fields'
  name?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['String']>
}

/** Ordering options when selecting data from "dipdup_head_status". */
export type Dipdup_Head_Status_Order_By = {
  name?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_head_status" */
export enum Dipdup_Head_Status_Select_Column {
  /** column name */
  Name = 'name',
  /** column name */
  Status = 'status',
}

/** Streaming cursor of the table "dipdup_head_status" */
export type Dipdup_Head_Status_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Head_Status_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Head_Status_Stream_Cursor_Value_Input = {
  name?: InputMaybe<Scalars['String']>
  status?: InputMaybe<Scalars['String']>
}

/** aggregate stddev on columns */
export type Dipdup_Head_Stddev_Fields = {
  __typename?: 'dipdup_head_stddev_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate stddev_pop on columns */
export type Dipdup_Head_Stddev_Pop_Fields = {
  __typename?: 'dipdup_head_stddev_pop_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate stddev_samp on columns */
export type Dipdup_Head_Stddev_Samp_Fields = {
  __typename?: 'dipdup_head_stddev_samp_fields'
  level?: Maybe<Scalars['Float']>
}

/** Streaming cursor of the table "dipdup_head" */
export type Dipdup_Head_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Head_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Head_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']>
  hash?: InputMaybe<Scalars['String']>
  level?: InputMaybe<Scalars['Int']>
  name?: InputMaybe<Scalars['String']>
  timestamp?: InputMaybe<Scalars['timestamptz']>
  updated_at?: InputMaybe<Scalars['timestamptz']>
}

/** aggregate sum on columns */
export type Dipdup_Head_Sum_Fields = {
  __typename?: 'dipdup_head_sum_fields'
  level?: Maybe<Scalars['Int']>
}

/** aggregate var_pop on columns */
export type Dipdup_Head_Var_Pop_Fields = {
  __typename?: 'dipdup_head_var_pop_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate var_samp on columns */
export type Dipdup_Head_Var_Samp_Fields = {
  __typename?: 'dipdup_head_var_samp_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate variance on columns */
export type Dipdup_Head_Variance_Fields = {
  __typename?: 'dipdup_head_variance_fields'
  level?: Maybe<Scalars['Float']>
}

/** columns and relationships of "dipdup_index" */
export type Dipdup_Index = {
  __typename?: 'dipdup_index'
  config_hash: Scalars['String']
  created_at: Scalars['timestamptz']
  level: Scalars['Int']
  name: Scalars['String']
  /** NEW: NEW\nSYNCING: SYNCING\nREALTIME: REALTIME\nROLLBACK: ROLLBACK\nONESHOT: ONESHOT */
  status: Scalars['String']
  template?: Maybe<Scalars['String']>
  template_values?: Maybe<Scalars['jsonb']>
  /** operation: operation\nbig_map: big_map\nhead: head\ntoken_transfer: token_transfer\nevent: event */
  type: Scalars['String']
  updated_at: Scalars['timestamptz']
}

/** columns and relationships of "dipdup_index" */
export type Dipdup_IndexTemplate_ValuesArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** aggregated selection of "dipdup_index" */
export type Dipdup_Index_Aggregate = {
  __typename?: 'dipdup_index_aggregate'
  aggregate?: Maybe<Dipdup_Index_Aggregate_Fields>
  nodes: Array<Dipdup_Index>
}

/** aggregate fields of "dipdup_index" */
export type Dipdup_Index_Aggregate_Fields = {
  __typename?: 'dipdup_index_aggregate_fields'
  avg?: Maybe<Dipdup_Index_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Dipdup_Index_Max_Fields>
  min?: Maybe<Dipdup_Index_Min_Fields>
  stddev?: Maybe<Dipdup_Index_Stddev_Fields>
  stddev_pop?: Maybe<Dipdup_Index_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Dipdup_Index_Stddev_Samp_Fields>
  sum?: Maybe<Dipdup_Index_Sum_Fields>
  var_pop?: Maybe<Dipdup_Index_Var_Pop_Fields>
  var_samp?: Maybe<Dipdup_Index_Var_Samp_Fields>
  variance?: Maybe<Dipdup_Index_Variance_Fields>
}

/** aggregate fields of "dipdup_index" */
export type Dipdup_Index_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Index_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** aggregate avg on columns */
export type Dipdup_Index_Avg_Fields = {
  __typename?: 'dipdup_index_avg_fields'
  level?: Maybe<Scalars['Float']>
}

/** Boolean expression to filter rows from the table "dipdup_index". All fields are combined with a logical 'AND'. */
export type Dipdup_Index_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Index_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Index_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Index_Bool_Exp>>
  config_hash?: InputMaybe<String_Comparison_Exp>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  level?: InputMaybe<Int_Comparison_Exp>
  name?: InputMaybe<String_Comparison_Exp>
  status?: InputMaybe<String_Comparison_Exp>
  template?: InputMaybe<String_Comparison_Exp>
  template_values?: InputMaybe<Jsonb_Comparison_Exp>
  type?: InputMaybe<String_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Index_Max_Fields = {
  __typename?: 'dipdup_index_max_fields'
  config_hash?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  level?: Maybe<Scalars['Int']>
  name?: Maybe<Scalars['String']>
  /** NEW: NEW\nSYNCING: SYNCING\nREALTIME: REALTIME\nROLLBACK: ROLLBACK\nONESHOT: ONESHOT */
  status?: Maybe<Scalars['String']>
  template?: Maybe<Scalars['String']>
  /** operation: operation\nbig_map: big_map\nhead: head\ntoken_transfer: token_transfer\nevent: event */
  type?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** aggregate min on columns */
export type Dipdup_Index_Min_Fields = {
  __typename?: 'dipdup_index_min_fields'
  config_hash?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  level?: Maybe<Scalars['Int']>
  name?: Maybe<Scalars['String']>
  /** NEW: NEW\nSYNCING: SYNCING\nREALTIME: REALTIME\nROLLBACK: ROLLBACK\nONESHOT: ONESHOT */
  status?: Maybe<Scalars['String']>
  template?: Maybe<Scalars['String']>
  /** operation: operation\nbig_map: big_map\nhead: head\ntoken_transfer: token_transfer\nevent: event */
  type?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** Ordering options when selecting data from "dipdup_index". */
export type Dipdup_Index_Order_By = {
  config_hash?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  template?: InputMaybe<Order_By>
  template_values?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_index" */
export enum Dipdup_Index_Select_Column {
  /** column name */
  ConfigHash = 'config_hash',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Level = 'level',
  /** column name */
  Name = 'name',
  /** column name */
  Status = 'status',
  /** column name */
  Template = 'template',
  /** column name */
  TemplateValues = 'template_values',
  /** column name */
  Type = 'type',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** aggregate stddev on columns */
export type Dipdup_Index_Stddev_Fields = {
  __typename?: 'dipdup_index_stddev_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate stddev_pop on columns */
export type Dipdup_Index_Stddev_Pop_Fields = {
  __typename?: 'dipdup_index_stddev_pop_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate stddev_samp on columns */
export type Dipdup_Index_Stddev_Samp_Fields = {
  __typename?: 'dipdup_index_stddev_samp_fields'
  level?: Maybe<Scalars['Float']>
}

/** Streaming cursor of the table "dipdup_index" */
export type Dipdup_Index_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Index_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Index_Stream_Cursor_Value_Input = {
  config_hash?: InputMaybe<Scalars['String']>
  created_at?: InputMaybe<Scalars['timestamptz']>
  level?: InputMaybe<Scalars['Int']>
  name?: InputMaybe<Scalars['String']>
  /** NEW: NEW\nSYNCING: SYNCING\nREALTIME: REALTIME\nROLLBACK: ROLLBACK\nONESHOT: ONESHOT */
  status?: InputMaybe<Scalars['String']>
  template?: InputMaybe<Scalars['String']>
  template_values?: InputMaybe<Scalars['jsonb']>
  /** operation: operation\nbig_map: big_map\nhead: head\ntoken_transfer: token_transfer\nevent: event */
  type?: InputMaybe<Scalars['String']>
  updated_at?: InputMaybe<Scalars['timestamptz']>
}

/** aggregate sum on columns */
export type Dipdup_Index_Sum_Fields = {
  __typename?: 'dipdup_index_sum_fields'
  level?: Maybe<Scalars['Int']>
}

/** aggregate var_pop on columns */
export type Dipdup_Index_Var_Pop_Fields = {
  __typename?: 'dipdup_index_var_pop_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate var_samp on columns */
export type Dipdup_Index_Var_Samp_Fields = {
  __typename?: 'dipdup_index_var_samp_fields'
  level?: Maybe<Scalars['Float']>
}

/** aggregate variance on columns */
export type Dipdup_Index_Variance_Fields = {
  __typename?: 'dipdup_index_variance_fields'
  level?: Maybe<Scalars['Float']>
}

/** Model update created within versioned transactions */
export type Dipdup_Model_Update = {
  __typename?: 'dipdup_model_update'
  /** INSERT: INSERT\nUPDATE: UPDATE\nDELETE: DELETE */
  action: Scalars['String']
  created_at: Scalars['timestamptz']
  data?: Maybe<Scalars['jsonb']>
  id: Scalars['Int']
  index: Scalars['String']
  level: Scalars['Int']
  model_name: Scalars['String']
  model_pk: Scalars['String']
  updated_at: Scalars['timestamptz']
}

/** Model update created within versioned transactions */
export type Dipdup_Model_UpdateDataArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** aggregated selection of "dipdup_model_update" */
export type Dipdup_Model_Update_Aggregate = {
  __typename?: 'dipdup_model_update_aggregate'
  aggregate?: Maybe<Dipdup_Model_Update_Aggregate_Fields>
  nodes: Array<Dipdup_Model_Update>
}

/** aggregate fields of "dipdup_model_update" */
export type Dipdup_Model_Update_Aggregate_Fields = {
  __typename?: 'dipdup_model_update_aggregate_fields'
  avg?: Maybe<Dipdup_Model_Update_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Dipdup_Model_Update_Max_Fields>
  min?: Maybe<Dipdup_Model_Update_Min_Fields>
  stddev?: Maybe<Dipdup_Model_Update_Stddev_Fields>
  stddev_pop?: Maybe<Dipdup_Model_Update_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Dipdup_Model_Update_Stddev_Samp_Fields>
  sum?: Maybe<Dipdup_Model_Update_Sum_Fields>
  var_pop?: Maybe<Dipdup_Model_Update_Var_Pop_Fields>
  var_samp?: Maybe<Dipdup_Model_Update_Var_Samp_Fields>
  variance?: Maybe<Dipdup_Model_Update_Variance_Fields>
}

/** aggregate fields of "dipdup_model_update" */
export type Dipdup_Model_Update_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Model_Update_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** aggregate avg on columns */
export type Dipdup_Model_Update_Avg_Fields = {
  __typename?: 'dipdup_model_update_avg_fields'
  id?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
}

/** Boolean expression to filter rows from the table "dipdup_model_update". All fields are combined with a logical 'AND'. */
export type Dipdup_Model_Update_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Model_Update_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Model_Update_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Model_Update_Bool_Exp>>
  action?: InputMaybe<String_Comparison_Exp>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  data?: InputMaybe<Jsonb_Comparison_Exp>
  id?: InputMaybe<Int_Comparison_Exp>
  index?: InputMaybe<String_Comparison_Exp>
  level?: InputMaybe<Int_Comparison_Exp>
  model_name?: InputMaybe<String_Comparison_Exp>
  model_pk?: InputMaybe<String_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Model_Update_Max_Fields = {
  __typename?: 'dipdup_model_update_max_fields'
  /** INSERT: INSERT\nUPDATE: UPDATE\nDELETE: DELETE */
  action?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  id?: Maybe<Scalars['Int']>
  index?: Maybe<Scalars['String']>
  level?: Maybe<Scalars['Int']>
  model_name?: Maybe<Scalars['String']>
  model_pk?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** aggregate min on columns */
export type Dipdup_Model_Update_Min_Fields = {
  __typename?: 'dipdup_model_update_min_fields'
  /** INSERT: INSERT\nUPDATE: UPDATE\nDELETE: DELETE */
  action?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  id?: Maybe<Scalars['Int']>
  index?: Maybe<Scalars['String']>
  level?: Maybe<Scalars['Int']>
  model_name?: Maybe<Scalars['String']>
  model_pk?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** Ordering options when selecting data from "dipdup_model_update". */
export type Dipdup_Model_Update_Order_By = {
  action?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  data?: InputMaybe<Order_By>
  id?: InputMaybe<Order_By>
  index?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  model_name?: InputMaybe<Order_By>
  model_pk?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_model_update" */
export enum Dipdup_Model_Update_Select_Column {
  /** column name */
  Action = 'action',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Data = 'data',
  /** column name */
  Id = 'id',
  /** column name */
  Index = 'index',
  /** column name */
  Level = 'level',
  /** column name */
  ModelName = 'model_name',
  /** column name */
  ModelPk = 'model_pk',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** aggregate stddev on columns */
export type Dipdup_Model_Update_Stddev_Fields = {
  __typename?: 'dipdup_model_update_stddev_fields'
  id?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
}

/** aggregate stddev_pop on columns */
export type Dipdup_Model_Update_Stddev_Pop_Fields = {
  __typename?: 'dipdup_model_update_stddev_pop_fields'
  id?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
}

/** aggregate stddev_samp on columns */
export type Dipdup_Model_Update_Stddev_Samp_Fields = {
  __typename?: 'dipdup_model_update_stddev_samp_fields'
  id?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
}

/** Streaming cursor of the table "dipdup_model_update" */
export type Dipdup_Model_Update_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Model_Update_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Model_Update_Stream_Cursor_Value_Input = {
  /** INSERT: INSERT\nUPDATE: UPDATE\nDELETE: DELETE */
  action?: InputMaybe<Scalars['String']>
  created_at?: InputMaybe<Scalars['timestamptz']>
  data?: InputMaybe<Scalars['jsonb']>
  id?: InputMaybe<Scalars['Int']>
  index?: InputMaybe<Scalars['String']>
  level?: InputMaybe<Scalars['Int']>
  model_name?: InputMaybe<Scalars['String']>
  model_pk?: InputMaybe<Scalars['String']>
  updated_at?: InputMaybe<Scalars['timestamptz']>
}

/** aggregate sum on columns */
export type Dipdup_Model_Update_Sum_Fields = {
  __typename?: 'dipdup_model_update_sum_fields'
  id?: Maybe<Scalars['Int']>
  level?: Maybe<Scalars['Int']>
}

/** aggregate var_pop on columns */
export type Dipdup_Model_Update_Var_Pop_Fields = {
  __typename?: 'dipdup_model_update_var_pop_fields'
  id?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
}

/** aggregate var_samp on columns */
export type Dipdup_Model_Update_Var_Samp_Fields = {
  __typename?: 'dipdup_model_update_var_samp_fields'
  id?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
}

/** aggregate variance on columns */
export type Dipdup_Model_Update_Variance_Fields = {
  __typename?: 'dipdup_model_update_variance_fields'
  id?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
}

/** columns and relationships of "dipdup_schema" */
export type Dipdup_Schema = {
  __typename?: 'dipdup_schema'
  created_at: Scalars['timestamptz']
  hash: Scalars['String']
  name: Scalars['String']
  /** manual: manual\nmigration: migration\nrollback: rollback\nconfig_modified: config_modified\nschema_modified: schema_modified */
  reindex?: Maybe<Scalars['String']>
  updated_at: Scalars['timestamptz']
}

/** aggregated selection of "dipdup_schema" */
export type Dipdup_Schema_Aggregate = {
  __typename?: 'dipdup_schema_aggregate'
  aggregate?: Maybe<Dipdup_Schema_Aggregate_Fields>
  nodes: Array<Dipdup_Schema>
}

/** aggregate fields of "dipdup_schema" */
export type Dipdup_Schema_Aggregate_Fields = {
  __typename?: 'dipdup_schema_aggregate_fields'
  count: Scalars['Int']
  max?: Maybe<Dipdup_Schema_Max_Fields>
  min?: Maybe<Dipdup_Schema_Min_Fields>
}

/** aggregate fields of "dipdup_schema" */
export type Dipdup_Schema_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Schema_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** Boolean expression to filter rows from the table "dipdup_schema". All fields are combined with a logical 'AND'. */
export type Dipdup_Schema_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Schema_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Schema_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Schema_Bool_Exp>>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  hash?: InputMaybe<String_Comparison_Exp>
  name?: InputMaybe<String_Comparison_Exp>
  reindex?: InputMaybe<String_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Schema_Max_Fields = {
  __typename?: 'dipdup_schema_max_fields'
  created_at?: Maybe<Scalars['timestamptz']>
  hash?: Maybe<Scalars['String']>
  name?: Maybe<Scalars['String']>
  /** manual: manual\nmigration: migration\nrollback: rollback\nconfig_modified: config_modified\nschema_modified: schema_modified */
  reindex?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** aggregate min on columns */
export type Dipdup_Schema_Min_Fields = {
  __typename?: 'dipdup_schema_min_fields'
  created_at?: Maybe<Scalars['timestamptz']>
  hash?: Maybe<Scalars['String']>
  name?: Maybe<Scalars['String']>
  /** manual: manual\nmigration: migration\nrollback: rollback\nconfig_modified: config_modified\nschema_modified: schema_modified */
  reindex?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** Ordering options when selecting data from "dipdup_schema". */
export type Dipdup_Schema_Order_By = {
  created_at?: InputMaybe<Order_By>
  hash?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  reindex?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_schema" */
export enum Dipdup_Schema_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Hash = 'hash',
  /** column name */
  Name = 'name',
  /** column name */
  Reindex = 'reindex',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** Streaming cursor of the table "dipdup_schema" */
export type Dipdup_Schema_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Schema_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Schema_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']>
  hash?: InputMaybe<Scalars['String']>
  name?: InputMaybe<Scalars['String']>
  /** manual: manual\nmigration: migration\nrollback: rollback\nconfig_modified: config_modified\nschema_modified: schema_modified */
  reindex?: InputMaybe<Scalars['String']>
  updated_at?: InputMaybe<Scalars['timestamptz']>
}

/** columns and relationships of "dipdup_token_metadata" */
export type Dipdup_Token_Metadata = {
  __typename?: 'dipdup_token_metadata'
  contract: Scalars['String']
  created_at: Scalars['timestamptz']
  id: Scalars['Int']
  metadata: Scalars['jsonb']
  network: Scalars['String']
  token_id: Scalars['String']
  update_id: Scalars['Int']
  updated_at: Scalars['timestamptz']
}

/** columns and relationships of "dipdup_token_metadata" */
export type Dipdup_Token_MetadataMetadataArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** aggregated selection of "dipdup_token_metadata" */
export type Dipdup_Token_Metadata_Aggregate = {
  __typename?: 'dipdup_token_metadata_aggregate'
  aggregate?: Maybe<Dipdup_Token_Metadata_Aggregate_Fields>
  nodes: Array<Dipdup_Token_Metadata>
}

/** aggregate fields of "dipdup_token_metadata" */
export type Dipdup_Token_Metadata_Aggregate_Fields = {
  __typename?: 'dipdup_token_metadata_aggregate_fields'
  avg?: Maybe<Dipdup_Token_Metadata_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Dipdup_Token_Metadata_Max_Fields>
  min?: Maybe<Dipdup_Token_Metadata_Min_Fields>
  stddev?: Maybe<Dipdup_Token_Metadata_Stddev_Fields>
  stddev_pop?: Maybe<Dipdup_Token_Metadata_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Dipdup_Token_Metadata_Stddev_Samp_Fields>
  sum?: Maybe<Dipdup_Token_Metadata_Sum_Fields>
  var_pop?: Maybe<Dipdup_Token_Metadata_Var_Pop_Fields>
  var_samp?: Maybe<Dipdup_Token_Metadata_Var_Samp_Fields>
  variance?: Maybe<Dipdup_Token_Metadata_Variance_Fields>
}

/** aggregate fields of "dipdup_token_metadata" */
export type Dipdup_Token_Metadata_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Dipdup_Token_Metadata_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** aggregate avg on columns */
export type Dipdup_Token_Metadata_Avg_Fields = {
  __typename?: 'dipdup_token_metadata_avg_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** Boolean expression to filter rows from the table "dipdup_token_metadata". All fields are combined with a logical 'AND'. */
export type Dipdup_Token_Metadata_Bool_Exp = {
  _and?: InputMaybe<Array<Dipdup_Token_Metadata_Bool_Exp>>
  _not?: InputMaybe<Dipdup_Token_Metadata_Bool_Exp>
  _or?: InputMaybe<Array<Dipdup_Token_Metadata_Bool_Exp>>
  contract?: InputMaybe<String_Comparison_Exp>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  id?: InputMaybe<Int_Comparison_Exp>
  metadata?: InputMaybe<Jsonb_Comparison_Exp>
  network?: InputMaybe<String_Comparison_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
  update_id?: InputMaybe<Int_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Dipdup_Token_Metadata_Max_Fields = {
  __typename?: 'dipdup_token_metadata_max_fields'
  contract?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  id?: Maybe<Scalars['Int']>
  network?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  update_id?: Maybe<Scalars['Int']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** aggregate min on columns */
export type Dipdup_Token_Metadata_Min_Fields = {
  __typename?: 'dipdup_token_metadata_min_fields'
  contract?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  id?: Maybe<Scalars['Int']>
  network?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  update_id?: Maybe<Scalars['Int']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** Ordering options when selecting data from "dipdup_token_metadata". */
export type Dipdup_Token_Metadata_Order_By = {
  contract?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  id?: InputMaybe<Order_By>
  metadata?: InputMaybe<Order_By>
  network?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  update_id?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "dipdup_token_metadata" */
export enum Dipdup_Token_Metadata_Select_Column {
  /** column name */
  Contract = 'contract',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  Metadata = 'metadata',
  /** column name */
  Network = 'network',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  UpdateId = 'update_id',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** aggregate stddev on columns */
export type Dipdup_Token_Metadata_Stddev_Fields = {
  __typename?: 'dipdup_token_metadata_stddev_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate stddev_pop on columns */
export type Dipdup_Token_Metadata_Stddev_Pop_Fields = {
  __typename?: 'dipdup_token_metadata_stddev_pop_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate stddev_samp on columns */
export type Dipdup_Token_Metadata_Stddev_Samp_Fields = {
  __typename?: 'dipdup_token_metadata_stddev_samp_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** Streaming cursor of the table "dipdup_token_metadata" */
export type Dipdup_Token_Metadata_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Dipdup_Token_Metadata_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Dipdup_Token_Metadata_Stream_Cursor_Value_Input = {
  contract?: InputMaybe<Scalars['String']>
  created_at?: InputMaybe<Scalars['timestamptz']>
  id?: InputMaybe<Scalars['Int']>
  metadata?: InputMaybe<Scalars['jsonb']>
  network?: InputMaybe<Scalars['String']>
  token_id?: InputMaybe<Scalars['String']>
  update_id?: InputMaybe<Scalars['Int']>
  updated_at?: InputMaybe<Scalars['timestamptz']>
}

/** aggregate sum on columns */
export type Dipdup_Token_Metadata_Sum_Fields = {
  __typename?: 'dipdup_token_metadata_sum_fields'
  id?: Maybe<Scalars['Int']>
  update_id?: Maybe<Scalars['Int']>
}

/** aggregate var_pop on columns */
export type Dipdup_Token_Metadata_Var_Pop_Fields = {
  __typename?: 'dipdup_token_metadata_var_pop_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate var_samp on columns */
export type Dipdup_Token_Metadata_Var_Samp_Fields = {
  __typename?: 'dipdup_token_metadata_var_samp_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** aggregate variance on columns */
export type Dipdup_Token_Metadata_Variance_Fields = {
  __typename?: 'dipdup_token_metadata_variance_fields'
  id?: Maybe<Scalars['Float']>
  update_id?: Maybe<Scalars['Float']>
}

/** columns and relationships of "events" */
export type Events = {
  __typename?: 'events'
  amount?: Maybe<Scalars['bigint']>
  artist_address?: Maybe<Scalars['String']>
  ask_id?: Maybe<Scalars['bigint']>
  auction_id?: Maybe<Scalars['bigint']>
  bid?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  bidder_address?: Maybe<Scalars['String']>
  burn_on_end?: Maybe<Scalars['Boolean']>
  buyer_address?: Maybe<Scalars['String']>
  /** An object relationship */
  buyer_profile?: Maybe<Teia_Users>
  collection_id?: Maybe<Scalars['bigint']>
  contract_address?: Maybe<Scalars['String']>
  creator_name?: Maybe<Scalars['String']>
  currency?: Maybe<Scalars['String']>
  current_price?: Maybe<Scalars['bigint']>
  custom_data?: Maybe<Scalars['jsonb']>
  editions?: Maybe<Scalars['bigint']>
  end_price?: Maybe<Scalars['bigint']>
  end_time?: Maybe<Scalars['timestamptz']>
  extension_time?: Maybe<Scalars['bigint']>
  fa2_address?: Maybe<Scalars['String']>
  from_address?: Maybe<Scalars['String']>
  /** An object relationship */
  from_profile?: Maybe<Teia_Users>
  highest_bidder_address?: Maybe<Scalars['String']>
  holder_address?: Maybe<Scalars['String']>
  id: Scalars['String']
  implements?: Maybe<Scalars['String']>
  is_mint?: Maybe<Scalars['Boolean']>
  is_verified_artist?: Maybe<Scalars['Boolean']>
  issuer_id?: Maybe<Scalars['bigint']>
  iteration?: Maybe<Scalars['bigint']>
  kalamint_on_sale?: Maybe<Scalars['Boolean']>
  ledger_type?: Maybe<Scalars['String']>
  level: Scalars['bigint']
  metadata?: Maybe<Scalars['jsonb']>
  metadata_uri?: Maybe<Scalars['String']>
  offer_id?: Maybe<Scalars['bigint']>
  ophash?: Maybe<Scalars['String']>
  opid: Scalars['bigint']
  owner_address?: Maybe<Scalars['String']>
  price?: Maybe<Scalars['bigint']>
  price_in_cny?: Maybe<Scalars['bigint']>
  price_in_eur?: Maybe<Scalars['bigint']>
  price_in_gbp?: Maybe<Scalars['bigint']>
  price_in_jpy?: Maybe<Scalars['bigint']>
  price_in_krw?: Maybe<Scalars['bigint']>
  price_in_usd?: Maybe<Scalars['bigint']>
  price_increment?: Maybe<Scalars['bigint']>
  quotes?: Maybe<Scalars['jsonb']>
  reserve?: Maybe<Scalars['bigint']>
  royalties?: Maybe<Scalars['bigint']>
  royalty_shares?: Maybe<Scalars['jsonb']>
  seller_address?: Maybe<Scalars['String']>
  /** An object relationship */
  seller_profile?: Maybe<Teia_Users>
  start_price?: Maybe<Scalars['bigint']>
  start_time?: Maybe<Scalars['timestamptz']>
  swap_id?: Maybe<Scalars['bigint']>
  timestamp: Scalars['timestamptz']
  to_address?: Maybe<Scalars['String']>
  /** An object relationship */
  to_profile?: Maybe<Teia_Users>
  /** An object relationship */
  token?: Maybe<Tokens>
  token_description?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  token_name?: Maybe<Scalars['String']>
  total_price?: Maybe<Scalars['bigint']>
  type?: Maybe<Scalars['String']>
}

/** columns and relationships of "events" */
export type EventsCustom_DataArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "events" */
export type EventsMetadataArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "events" */
export type EventsQuotesArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "events" */
export type EventsRoyalty_SharesArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** aggregated selection of "events" */
export type Events_Aggregate = {
  __typename?: 'events_aggregate'
  aggregate?: Maybe<Events_Aggregate_Fields>
  nodes: Array<Events>
}

/** aggregate fields of "events" */
export type Events_Aggregate_Fields = {
  __typename?: 'events_aggregate_fields'
  avg?: Maybe<Events_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Events_Max_Fields>
  min?: Maybe<Events_Min_Fields>
  stddev?: Maybe<Events_Stddev_Fields>
  stddev_pop?: Maybe<Events_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Events_Stddev_Samp_Fields>
  sum?: Maybe<Events_Sum_Fields>
  var_pop?: Maybe<Events_Var_Pop_Fields>
  var_samp?: Maybe<Events_Var_Samp_Fields>
  variance?: Maybe<Events_Variance_Fields>
}

/** aggregate fields of "events" */
export type Events_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Events_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** order by aggregate values of table "events" */
export type Events_Aggregate_Order_By = {
  avg?: InputMaybe<Events_Avg_Order_By>
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Events_Max_Order_By>
  min?: InputMaybe<Events_Min_Order_By>
  stddev?: InputMaybe<Events_Stddev_Order_By>
  stddev_pop?: InputMaybe<Events_Stddev_Pop_Order_By>
  stddev_samp?: InputMaybe<Events_Stddev_Samp_Order_By>
  sum?: InputMaybe<Events_Sum_Order_By>
  var_pop?: InputMaybe<Events_Var_Pop_Order_By>
  var_samp?: InputMaybe<Events_Var_Samp_Order_By>
  variance?: InputMaybe<Events_Variance_Order_By>
}

/** aggregate avg on columns */
export type Events_Avg_Fields = {
  __typename?: 'events_avg_fields'
  amount?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  auction_id?: Maybe<Scalars['Float']>
  bid?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  collection_id?: Maybe<Scalars['Float']>
  current_price?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  extension_time?: Maybe<Scalars['Float']>
  issuer_id?: Maybe<Scalars['Float']>
  iteration?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  opid?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  price_in_cny?: Maybe<Scalars['Float']>
  price_in_eur?: Maybe<Scalars['Float']>
  price_in_gbp?: Maybe<Scalars['Float']>
  price_in_jpy?: Maybe<Scalars['Float']>
  price_in_krw?: Maybe<Scalars['Float']>
  price_in_usd?: Maybe<Scalars['Float']>
  price_increment?: Maybe<Scalars['Float']>
  reserve?: Maybe<Scalars['Float']>
  royalties?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
  total_price?: Maybe<Scalars['Float']>
}

/** order by avg() on columns of table "events" */
export type Events_Avg_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** Boolean expression to filter rows from the table "events". All fields are combined with a logical 'AND'. */
export type Events_Bool_Exp = {
  _and?: InputMaybe<Array<Events_Bool_Exp>>
  _not?: InputMaybe<Events_Bool_Exp>
  _or?: InputMaybe<Array<Events_Bool_Exp>>
  amount?: InputMaybe<Bigint_Comparison_Exp>
  artist_address?: InputMaybe<String_Comparison_Exp>
  ask_id?: InputMaybe<Bigint_Comparison_Exp>
  auction_id?: InputMaybe<Bigint_Comparison_Exp>
  bid?: InputMaybe<Bigint_Comparison_Exp>
  bid_id?: InputMaybe<Bigint_Comparison_Exp>
  bidder_address?: InputMaybe<String_Comparison_Exp>
  burn_on_end?: InputMaybe<Boolean_Comparison_Exp>
  buyer_address?: InputMaybe<String_Comparison_Exp>
  buyer_profile?: InputMaybe<Teia_Users_Bool_Exp>
  collection_id?: InputMaybe<Bigint_Comparison_Exp>
  contract_address?: InputMaybe<String_Comparison_Exp>
  creator_name?: InputMaybe<String_Comparison_Exp>
  currency?: InputMaybe<String_Comparison_Exp>
  current_price?: InputMaybe<Bigint_Comparison_Exp>
  custom_data?: InputMaybe<Jsonb_Comparison_Exp>
  editions?: InputMaybe<Bigint_Comparison_Exp>
  end_price?: InputMaybe<Bigint_Comparison_Exp>
  end_time?: InputMaybe<Timestamptz_Comparison_Exp>
  extension_time?: InputMaybe<Bigint_Comparison_Exp>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  from_address?: InputMaybe<String_Comparison_Exp>
  from_profile?: InputMaybe<Teia_Users_Bool_Exp>
  highest_bidder_address?: InputMaybe<String_Comparison_Exp>
  holder_address?: InputMaybe<String_Comparison_Exp>
  id?: InputMaybe<String_Comparison_Exp>
  implements?: InputMaybe<String_Comparison_Exp>
  is_mint?: InputMaybe<Boolean_Comparison_Exp>
  is_verified_artist?: InputMaybe<Boolean_Comparison_Exp>
  issuer_id?: InputMaybe<Bigint_Comparison_Exp>
  iteration?: InputMaybe<Bigint_Comparison_Exp>
  kalamint_on_sale?: InputMaybe<Boolean_Comparison_Exp>
  ledger_type?: InputMaybe<String_Comparison_Exp>
  level?: InputMaybe<Bigint_Comparison_Exp>
  metadata?: InputMaybe<Jsonb_Comparison_Exp>
  metadata_uri?: InputMaybe<String_Comparison_Exp>
  offer_id?: InputMaybe<Bigint_Comparison_Exp>
  ophash?: InputMaybe<String_Comparison_Exp>
  opid?: InputMaybe<Bigint_Comparison_Exp>
  owner_address?: InputMaybe<String_Comparison_Exp>
  price?: InputMaybe<Bigint_Comparison_Exp>
  price_in_cny?: InputMaybe<Bigint_Comparison_Exp>
  price_in_eur?: InputMaybe<Bigint_Comparison_Exp>
  price_in_gbp?: InputMaybe<Bigint_Comparison_Exp>
  price_in_jpy?: InputMaybe<Bigint_Comparison_Exp>
  price_in_krw?: InputMaybe<Bigint_Comparison_Exp>
  price_in_usd?: InputMaybe<Bigint_Comparison_Exp>
  price_increment?: InputMaybe<Bigint_Comparison_Exp>
  quotes?: InputMaybe<Jsonb_Comparison_Exp>
  reserve?: InputMaybe<Bigint_Comparison_Exp>
  royalties?: InputMaybe<Bigint_Comparison_Exp>
  royalty_shares?: InputMaybe<Jsonb_Comparison_Exp>
  seller_address?: InputMaybe<String_Comparison_Exp>
  seller_profile?: InputMaybe<Teia_Users_Bool_Exp>
  start_price?: InputMaybe<Bigint_Comparison_Exp>
  start_time?: InputMaybe<Timestamptz_Comparison_Exp>
  swap_id?: InputMaybe<Bigint_Comparison_Exp>
  timestamp?: InputMaybe<Timestamptz_Comparison_Exp>
  to_address?: InputMaybe<String_Comparison_Exp>
  to_profile?: InputMaybe<Teia_Users_Bool_Exp>
  token?: InputMaybe<Tokens_Bool_Exp>
  token_description?: InputMaybe<String_Comparison_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
  token_name?: InputMaybe<String_Comparison_Exp>
  total_price?: InputMaybe<Bigint_Comparison_Exp>
  type?: InputMaybe<String_Comparison_Exp>
}

/** aggregate max on columns */
export type Events_Max_Fields = {
  __typename?: 'events_max_fields'
  amount?: Maybe<Scalars['bigint']>
  artist_address?: Maybe<Scalars['String']>
  ask_id?: Maybe<Scalars['bigint']>
  auction_id?: Maybe<Scalars['bigint']>
  bid?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  bidder_address?: Maybe<Scalars['String']>
  buyer_address?: Maybe<Scalars['String']>
  collection_id?: Maybe<Scalars['bigint']>
  contract_address?: Maybe<Scalars['String']>
  creator_name?: Maybe<Scalars['String']>
  currency?: Maybe<Scalars['String']>
  current_price?: Maybe<Scalars['bigint']>
  editions?: Maybe<Scalars['bigint']>
  end_price?: Maybe<Scalars['bigint']>
  end_time?: Maybe<Scalars['timestamptz']>
  extension_time?: Maybe<Scalars['bigint']>
  fa2_address?: Maybe<Scalars['String']>
  from_address?: Maybe<Scalars['String']>
  highest_bidder_address?: Maybe<Scalars['String']>
  holder_address?: Maybe<Scalars['String']>
  id?: Maybe<Scalars['String']>
  implements?: Maybe<Scalars['String']>
  issuer_id?: Maybe<Scalars['bigint']>
  iteration?: Maybe<Scalars['bigint']>
  ledger_type?: Maybe<Scalars['String']>
  level?: Maybe<Scalars['bigint']>
  metadata_uri?: Maybe<Scalars['String']>
  offer_id?: Maybe<Scalars['bigint']>
  ophash?: Maybe<Scalars['String']>
  opid?: Maybe<Scalars['bigint']>
  owner_address?: Maybe<Scalars['String']>
  price?: Maybe<Scalars['bigint']>
  price_in_cny?: Maybe<Scalars['bigint']>
  price_in_eur?: Maybe<Scalars['bigint']>
  price_in_gbp?: Maybe<Scalars['bigint']>
  price_in_jpy?: Maybe<Scalars['bigint']>
  price_in_krw?: Maybe<Scalars['bigint']>
  price_in_usd?: Maybe<Scalars['bigint']>
  price_increment?: Maybe<Scalars['bigint']>
  reserve?: Maybe<Scalars['bigint']>
  royalties?: Maybe<Scalars['bigint']>
  seller_address?: Maybe<Scalars['String']>
  start_price?: Maybe<Scalars['bigint']>
  start_time?: Maybe<Scalars['timestamptz']>
  swap_id?: Maybe<Scalars['bigint']>
  timestamp?: Maybe<Scalars['timestamptz']>
  to_address?: Maybe<Scalars['String']>
  token_description?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  token_name?: Maybe<Scalars['String']>
  total_price?: Maybe<Scalars['bigint']>
  type?: Maybe<Scalars['String']>
}

/** order by max() on columns of table "events" */
export type Events_Max_Order_By = {
  amount?: InputMaybe<Order_By>
  artist_address?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  bidder_address?: InputMaybe<Order_By>
  buyer_address?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  creator_name?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  end_time?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  from_address?: InputMaybe<Order_By>
  highest_bidder_address?: InputMaybe<Order_By>
  holder_address?: InputMaybe<Order_By>
  id?: InputMaybe<Order_By>
  implements?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  ledger_type?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  metadata_uri?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  ophash?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  owner_address?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  seller_address?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  start_time?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  timestamp?: InputMaybe<Order_By>
  to_address?: InputMaybe<Order_By>
  token_description?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  token_name?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** aggregate min on columns */
export type Events_Min_Fields = {
  __typename?: 'events_min_fields'
  amount?: Maybe<Scalars['bigint']>
  artist_address?: Maybe<Scalars['String']>
  ask_id?: Maybe<Scalars['bigint']>
  auction_id?: Maybe<Scalars['bigint']>
  bid?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  bidder_address?: Maybe<Scalars['String']>
  buyer_address?: Maybe<Scalars['String']>
  collection_id?: Maybe<Scalars['bigint']>
  contract_address?: Maybe<Scalars['String']>
  creator_name?: Maybe<Scalars['String']>
  currency?: Maybe<Scalars['String']>
  current_price?: Maybe<Scalars['bigint']>
  editions?: Maybe<Scalars['bigint']>
  end_price?: Maybe<Scalars['bigint']>
  end_time?: Maybe<Scalars['timestamptz']>
  extension_time?: Maybe<Scalars['bigint']>
  fa2_address?: Maybe<Scalars['String']>
  from_address?: Maybe<Scalars['String']>
  highest_bidder_address?: Maybe<Scalars['String']>
  holder_address?: Maybe<Scalars['String']>
  id?: Maybe<Scalars['String']>
  implements?: Maybe<Scalars['String']>
  issuer_id?: Maybe<Scalars['bigint']>
  iteration?: Maybe<Scalars['bigint']>
  ledger_type?: Maybe<Scalars['String']>
  level?: Maybe<Scalars['bigint']>
  metadata_uri?: Maybe<Scalars['String']>
  offer_id?: Maybe<Scalars['bigint']>
  ophash?: Maybe<Scalars['String']>
  opid?: Maybe<Scalars['bigint']>
  owner_address?: Maybe<Scalars['String']>
  price?: Maybe<Scalars['bigint']>
  price_in_cny?: Maybe<Scalars['bigint']>
  price_in_eur?: Maybe<Scalars['bigint']>
  price_in_gbp?: Maybe<Scalars['bigint']>
  price_in_jpy?: Maybe<Scalars['bigint']>
  price_in_krw?: Maybe<Scalars['bigint']>
  price_in_usd?: Maybe<Scalars['bigint']>
  price_increment?: Maybe<Scalars['bigint']>
  reserve?: Maybe<Scalars['bigint']>
  royalties?: Maybe<Scalars['bigint']>
  seller_address?: Maybe<Scalars['String']>
  start_price?: Maybe<Scalars['bigint']>
  start_time?: Maybe<Scalars['timestamptz']>
  swap_id?: Maybe<Scalars['bigint']>
  timestamp?: Maybe<Scalars['timestamptz']>
  to_address?: Maybe<Scalars['String']>
  token_description?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  token_name?: Maybe<Scalars['String']>
  total_price?: Maybe<Scalars['bigint']>
  type?: Maybe<Scalars['String']>
}

/** order by min() on columns of table "events" */
export type Events_Min_Order_By = {
  amount?: InputMaybe<Order_By>
  artist_address?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  bidder_address?: InputMaybe<Order_By>
  buyer_address?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  creator_name?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  end_time?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  from_address?: InputMaybe<Order_By>
  highest_bidder_address?: InputMaybe<Order_By>
  holder_address?: InputMaybe<Order_By>
  id?: InputMaybe<Order_By>
  implements?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  ledger_type?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  metadata_uri?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  ophash?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  owner_address?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  seller_address?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  start_time?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  timestamp?: InputMaybe<Order_By>
  to_address?: InputMaybe<Order_By>
  token_description?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  token_name?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "events". */
export type Events_Order_By = {
  amount?: InputMaybe<Order_By>
  artist_address?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  bidder_address?: InputMaybe<Order_By>
  burn_on_end?: InputMaybe<Order_By>
  buyer_address?: InputMaybe<Order_By>
  buyer_profile?: InputMaybe<Teia_Users_Order_By>
  collection_id?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  creator_name?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  custom_data?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  end_time?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  from_address?: InputMaybe<Order_By>
  from_profile?: InputMaybe<Teia_Users_Order_By>
  highest_bidder_address?: InputMaybe<Order_By>
  holder_address?: InputMaybe<Order_By>
  id?: InputMaybe<Order_By>
  implements?: InputMaybe<Order_By>
  is_mint?: InputMaybe<Order_By>
  is_verified_artist?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  kalamint_on_sale?: InputMaybe<Order_By>
  ledger_type?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  metadata?: InputMaybe<Order_By>
  metadata_uri?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  ophash?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  owner_address?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  quotes?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  royalty_shares?: InputMaybe<Order_By>
  seller_address?: InputMaybe<Order_By>
  seller_profile?: InputMaybe<Teia_Users_Order_By>
  start_price?: InputMaybe<Order_By>
  start_time?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  timestamp?: InputMaybe<Order_By>
  to_address?: InputMaybe<Order_By>
  to_profile?: InputMaybe<Teia_Users_Order_By>
  token?: InputMaybe<Tokens_Order_By>
  token_description?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  token_name?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** select columns of table "events" */
export enum Events_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  ArtistAddress = 'artist_address',
  /** column name */
  AskId = 'ask_id',
  /** column name */
  AuctionId = 'auction_id',
  /** column name */
  Bid = 'bid',
  /** column name */
  BidId = 'bid_id',
  /** column name */
  BidderAddress = 'bidder_address',
  /** column name */
  BurnOnEnd = 'burn_on_end',
  /** column name */
  BuyerAddress = 'buyer_address',
  /** column name */
  CollectionId = 'collection_id',
  /** column name */
  ContractAddress = 'contract_address',
  /** column name */
  CreatorName = 'creator_name',
  /** column name */
  Currency = 'currency',
  /** column name */
  CurrentPrice = 'current_price',
  /** column name */
  CustomData = 'custom_data',
  /** column name */
  Editions = 'editions',
  /** column name */
  EndPrice = 'end_price',
  /** column name */
  EndTime = 'end_time',
  /** column name */
  ExtensionTime = 'extension_time',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  FromAddress = 'from_address',
  /** column name */
  HighestBidderAddress = 'highest_bidder_address',
  /** column name */
  HolderAddress = 'holder_address',
  /** column name */
  Id = 'id',
  /** column name */
  Implements = 'implements',
  /** column name */
  IsMint = 'is_mint',
  /** column name */
  IsVerifiedArtist = 'is_verified_artist',
  /** column name */
  IssuerId = 'issuer_id',
  /** column name */
  Iteration = 'iteration',
  /** column name */
  KalamintOnSale = 'kalamint_on_sale',
  /** column name */
  LedgerType = 'ledger_type',
  /** column name */
  Level = 'level',
  /** column name */
  Metadata = 'metadata',
  /** column name */
  MetadataUri = 'metadata_uri',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  Ophash = 'ophash',
  /** column name */
  Opid = 'opid',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  Price = 'price',
  /** column name */
  PriceInCny = 'price_in_cny',
  /** column name */
  PriceInEur = 'price_in_eur',
  /** column name */
  PriceInGbp = 'price_in_gbp',
  /** column name */
  PriceInJpy = 'price_in_jpy',
  /** column name */
  PriceInKrw = 'price_in_krw',
  /** column name */
  PriceInUsd = 'price_in_usd',
  /** column name */
  PriceIncrement = 'price_increment',
  /** column name */
  Quotes = 'quotes',
  /** column name */
  Reserve = 'reserve',
  /** column name */
  Royalties = 'royalties',
  /** column name */
  RoyaltyShares = 'royalty_shares',
  /** column name */
  SellerAddress = 'seller_address',
  /** column name */
  StartPrice = 'start_price',
  /** column name */
  StartTime = 'start_time',
  /** column name */
  SwapId = 'swap_id',
  /** column name */
  Timestamp = 'timestamp',
  /** column name */
  ToAddress = 'to_address',
  /** column name */
  TokenDescription = 'token_description',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  TokenName = 'token_name',
  /** column name */
  TotalPrice = 'total_price',
  /** column name */
  Type = 'type',
}

/** aggregate stddev on columns */
export type Events_Stddev_Fields = {
  __typename?: 'events_stddev_fields'
  amount?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  auction_id?: Maybe<Scalars['Float']>
  bid?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  collection_id?: Maybe<Scalars['Float']>
  current_price?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  extension_time?: Maybe<Scalars['Float']>
  issuer_id?: Maybe<Scalars['Float']>
  iteration?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  opid?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  price_in_cny?: Maybe<Scalars['Float']>
  price_in_eur?: Maybe<Scalars['Float']>
  price_in_gbp?: Maybe<Scalars['Float']>
  price_in_jpy?: Maybe<Scalars['Float']>
  price_in_krw?: Maybe<Scalars['Float']>
  price_in_usd?: Maybe<Scalars['Float']>
  price_increment?: Maybe<Scalars['Float']>
  reserve?: Maybe<Scalars['Float']>
  royalties?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
  total_price?: Maybe<Scalars['Float']>
}

/** order by stddev() on columns of table "events" */
export type Events_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** aggregate stddev_pop on columns */
export type Events_Stddev_Pop_Fields = {
  __typename?: 'events_stddev_pop_fields'
  amount?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  auction_id?: Maybe<Scalars['Float']>
  bid?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  collection_id?: Maybe<Scalars['Float']>
  current_price?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  extension_time?: Maybe<Scalars['Float']>
  issuer_id?: Maybe<Scalars['Float']>
  iteration?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  opid?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  price_in_cny?: Maybe<Scalars['Float']>
  price_in_eur?: Maybe<Scalars['Float']>
  price_in_gbp?: Maybe<Scalars['Float']>
  price_in_jpy?: Maybe<Scalars['Float']>
  price_in_krw?: Maybe<Scalars['Float']>
  price_in_usd?: Maybe<Scalars['Float']>
  price_increment?: Maybe<Scalars['Float']>
  reserve?: Maybe<Scalars['Float']>
  royalties?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
  total_price?: Maybe<Scalars['Float']>
}

/** order by stddev_pop() on columns of table "events" */
export type Events_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** aggregate stddev_samp on columns */
export type Events_Stddev_Samp_Fields = {
  __typename?: 'events_stddev_samp_fields'
  amount?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  auction_id?: Maybe<Scalars['Float']>
  bid?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  collection_id?: Maybe<Scalars['Float']>
  current_price?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  extension_time?: Maybe<Scalars['Float']>
  issuer_id?: Maybe<Scalars['Float']>
  iteration?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  opid?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  price_in_cny?: Maybe<Scalars['Float']>
  price_in_eur?: Maybe<Scalars['Float']>
  price_in_gbp?: Maybe<Scalars['Float']>
  price_in_jpy?: Maybe<Scalars['Float']>
  price_in_krw?: Maybe<Scalars['Float']>
  price_in_usd?: Maybe<Scalars['Float']>
  price_increment?: Maybe<Scalars['Float']>
  reserve?: Maybe<Scalars['Float']>
  royalties?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
  total_price?: Maybe<Scalars['Float']>
}

/** order by stddev_samp() on columns of table "events" */
export type Events_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** aggregate sum on columns */
export type Events_Sum_Fields = {
  __typename?: 'events_sum_fields'
  amount?: Maybe<Scalars['bigint']>
  ask_id?: Maybe<Scalars['bigint']>
  auction_id?: Maybe<Scalars['bigint']>
  bid?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  collection_id?: Maybe<Scalars['bigint']>
  current_price?: Maybe<Scalars['bigint']>
  editions?: Maybe<Scalars['bigint']>
  end_price?: Maybe<Scalars['bigint']>
  extension_time?: Maybe<Scalars['bigint']>
  issuer_id?: Maybe<Scalars['bigint']>
  iteration?: Maybe<Scalars['bigint']>
  level?: Maybe<Scalars['bigint']>
  offer_id?: Maybe<Scalars['bigint']>
  opid?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
  price_in_cny?: Maybe<Scalars['bigint']>
  price_in_eur?: Maybe<Scalars['bigint']>
  price_in_gbp?: Maybe<Scalars['bigint']>
  price_in_jpy?: Maybe<Scalars['bigint']>
  price_in_krw?: Maybe<Scalars['bigint']>
  price_in_usd?: Maybe<Scalars['bigint']>
  price_increment?: Maybe<Scalars['bigint']>
  reserve?: Maybe<Scalars['bigint']>
  royalties?: Maybe<Scalars['bigint']>
  start_price?: Maybe<Scalars['bigint']>
  swap_id?: Maybe<Scalars['bigint']>
  total_price?: Maybe<Scalars['bigint']>
}

/** order by sum() on columns of table "events" */
export type Events_Sum_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** aggregate var_pop on columns */
export type Events_Var_Pop_Fields = {
  __typename?: 'events_var_pop_fields'
  amount?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  auction_id?: Maybe<Scalars['Float']>
  bid?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  collection_id?: Maybe<Scalars['Float']>
  current_price?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  extension_time?: Maybe<Scalars['Float']>
  issuer_id?: Maybe<Scalars['Float']>
  iteration?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  opid?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  price_in_cny?: Maybe<Scalars['Float']>
  price_in_eur?: Maybe<Scalars['Float']>
  price_in_gbp?: Maybe<Scalars['Float']>
  price_in_jpy?: Maybe<Scalars['Float']>
  price_in_krw?: Maybe<Scalars['Float']>
  price_in_usd?: Maybe<Scalars['Float']>
  price_increment?: Maybe<Scalars['Float']>
  reserve?: Maybe<Scalars['Float']>
  royalties?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
  total_price?: Maybe<Scalars['Float']>
}

/** order by var_pop() on columns of table "events" */
export type Events_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** aggregate var_samp on columns */
export type Events_Var_Samp_Fields = {
  __typename?: 'events_var_samp_fields'
  amount?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  auction_id?: Maybe<Scalars['Float']>
  bid?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  collection_id?: Maybe<Scalars['Float']>
  current_price?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  extension_time?: Maybe<Scalars['Float']>
  issuer_id?: Maybe<Scalars['Float']>
  iteration?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  opid?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  price_in_cny?: Maybe<Scalars['Float']>
  price_in_eur?: Maybe<Scalars['Float']>
  price_in_gbp?: Maybe<Scalars['Float']>
  price_in_jpy?: Maybe<Scalars['Float']>
  price_in_krw?: Maybe<Scalars['Float']>
  price_in_usd?: Maybe<Scalars['Float']>
  price_increment?: Maybe<Scalars['Float']>
  reserve?: Maybe<Scalars['Float']>
  royalties?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
  total_price?: Maybe<Scalars['Float']>
}

/** order by var_samp() on columns of table "events" */
export type Events_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** aggregate variance on columns */
export type Events_Variance_Fields = {
  __typename?: 'events_variance_fields'
  amount?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  auction_id?: Maybe<Scalars['Float']>
  bid?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  collection_id?: Maybe<Scalars['Float']>
  current_price?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  extension_time?: Maybe<Scalars['Float']>
  issuer_id?: Maybe<Scalars['Float']>
  iteration?: Maybe<Scalars['Float']>
  level?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  opid?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  price_in_cny?: Maybe<Scalars['Float']>
  price_in_eur?: Maybe<Scalars['Float']>
  price_in_gbp?: Maybe<Scalars['Float']>
  price_in_jpy?: Maybe<Scalars['Float']>
  price_in_krw?: Maybe<Scalars['Float']>
  price_in_usd?: Maybe<Scalars['Float']>
  price_increment?: Maybe<Scalars['Float']>
  reserve?: Maybe<Scalars['Float']>
  royalties?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
  total_price?: Maybe<Scalars['Float']>
}

/** order by variance() on columns of table "events" */
export type Events_Variance_Order_By = {
  amount?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  auction_id?: InputMaybe<Order_By>
  bid?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  collection_id?: InputMaybe<Order_By>
  current_price?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  extension_time?: InputMaybe<Order_By>
  issuer_id?: InputMaybe<Order_By>
  iteration?: InputMaybe<Order_By>
  level?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  opid?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  price_in_cny?: InputMaybe<Order_By>
  price_in_eur?: InputMaybe<Order_By>
  price_in_gbp?: InputMaybe<Order_By>
  price_in_jpy?: InputMaybe<Order_By>
  price_in_krw?: InputMaybe<Order_By>
  price_in_usd?: InputMaybe<Order_By>
  price_increment?: InputMaybe<Order_By>
  reserve?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  total_price?: InputMaybe<Order_By>
}

/** columns and relationships of "holdings" */
export type Holdings = {
  __typename?: 'holdings'
  amount: Scalars['bigint']
  fa2_address: Scalars['String']
  first_received_at?: Maybe<Scalars['timestamptz']>
  holder_address: Scalars['String']
  /** An object relationship */
  holder_profile?: Maybe<Teia_Users>
  last_received_at?: Maybe<Scalars['timestamptz']>
  /** An object relationship */
  token?: Maybe<Tokens>
  token_id: Scalars['String']
}

/** aggregated selection of "holdings" */
export type Holdings_Aggregate = {
  __typename?: 'holdings_aggregate'
  aggregate?: Maybe<Holdings_Aggregate_Fields>
  nodes: Array<Holdings>
}

/** aggregate fields of "holdings" */
export type Holdings_Aggregate_Fields = {
  __typename?: 'holdings_aggregate_fields'
  avg?: Maybe<Holdings_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Holdings_Max_Fields>
  min?: Maybe<Holdings_Min_Fields>
  stddev?: Maybe<Holdings_Stddev_Fields>
  stddev_pop?: Maybe<Holdings_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Holdings_Stddev_Samp_Fields>
  sum?: Maybe<Holdings_Sum_Fields>
  var_pop?: Maybe<Holdings_Var_Pop_Fields>
  var_samp?: Maybe<Holdings_Var_Samp_Fields>
  variance?: Maybe<Holdings_Variance_Fields>
}

/** aggregate fields of "holdings" */
export type Holdings_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Holdings_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** order by aggregate values of table "holdings" */
export type Holdings_Aggregate_Order_By = {
  avg?: InputMaybe<Holdings_Avg_Order_By>
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Holdings_Max_Order_By>
  min?: InputMaybe<Holdings_Min_Order_By>
  stddev?: InputMaybe<Holdings_Stddev_Order_By>
  stddev_pop?: InputMaybe<Holdings_Stddev_Pop_Order_By>
  stddev_samp?: InputMaybe<Holdings_Stddev_Samp_Order_By>
  sum?: InputMaybe<Holdings_Sum_Order_By>
  var_pop?: InputMaybe<Holdings_Var_Pop_Order_By>
  var_samp?: InputMaybe<Holdings_Var_Samp_Order_By>
  variance?: InputMaybe<Holdings_Variance_Order_By>
}

/** aggregate avg on columns */
export type Holdings_Avg_Fields = {
  __typename?: 'holdings_avg_fields'
  amount?: Maybe<Scalars['Float']>
}

/** order by avg() on columns of table "holdings" */
export type Holdings_Avg_Order_By = {
  amount?: InputMaybe<Order_By>
}

/** Boolean expression to filter rows from the table "holdings". All fields are combined with a logical 'AND'. */
export type Holdings_Bool_Exp = {
  _and?: InputMaybe<Array<Holdings_Bool_Exp>>
  _not?: InputMaybe<Holdings_Bool_Exp>
  _or?: InputMaybe<Array<Holdings_Bool_Exp>>
  amount?: InputMaybe<Bigint_Comparison_Exp>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  first_received_at?: InputMaybe<Timestamptz_Comparison_Exp>
  holder_address?: InputMaybe<String_Comparison_Exp>
  holder_profile?: InputMaybe<Teia_Users_Bool_Exp>
  last_received_at?: InputMaybe<Timestamptz_Comparison_Exp>
  token?: InputMaybe<Tokens_Bool_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
}

/** aggregate max on columns */
export type Holdings_Max_Fields = {
  __typename?: 'holdings_max_fields'
  amount?: Maybe<Scalars['bigint']>
  fa2_address?: Maybe<Scalars['String']>
  first_received_at?: Maybe<Scalars['timestamptz']>
  holder_address?: Maybe<Scalars['String']>
  last_received_at?: Maybe<Scalars['timestamptz']>
  token_id?: Maybe<Scalars['String']>
}

/** order by max() on columns of table "holdings" */
export type Holdings_Max_Order_By = {
  amount?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  first_received_at?: InputMaybe<Order_By>
  holder_address?: InputMaybe<Order_By>
  last_received_at?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** aggregate min on columns */
export type Holdings_Min_Fields = {
  __typename?: 'holdings_min_fields'
  amount?: Maybe<Scalars['bigint']>
  fa2_address?: Maybe<Scalars['String']>
  first_received_at?: Maybe<Scalars['timestamptz']>
  holder_address?: Maybe<Scalars['String']>
  last_received_at?: Maybe<Scalars['timestamptz']>
  token_id?: Maybe<Scalars['String']>
}

/** order by min() on columns of table "holdings" */
export type Holdings_Min_Order_By = {
  amount?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  first_received_at?: InputMaybe<Order_By>
  holder_address?: InputMaybe<Order_By>
  last_received_at?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "holdings". */
export type Holdings_Order_By = {
  amount?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  first_received_at?: InputMaybe<Order_By>
  holder_address?: InputMaybe<Order_By>
  holder_profile?: InputMaybe<Teia_Users_Order_By>
  last_received_at?: InputMaybe<Order_By>
  token?: InputMaybe<Tokens_Order_By>
  token_id?: InputMaybe<Order_By>
}

/** select columns of table "holdings" */
export enum Holdings_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  FirstReceivedAt = 'first_received_at',
  /** column name */
  HolderAddress = 'holder_address',
  /** column name */
  LastReceivedAt = 'last_received_at',
  /** column name */
  TokenId = 'token_id',
}

/** aggregate stddev on columns */
export type Holdings_Stddev_Fields = {
  __typename?: 'holdings_stddev_fields'
  amount?: Maybe<Scalars['Float']>
}

/** order by stddev() on columns of table "holdings" */
export type Holdings_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>
}

/** aggregate stddev_pop on columns */
export type Holdings_Stddev_Pop_Fields = {
  __typename?: 'holdings_stddev_pop_fields'
  amount?: Maybe<Scalars['Float']>
}

/** order by stddev_pop() on columns of table "holdings" */
export type Holdings_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
}

/** aggregate stddev_samp on columns */
export type Holdings_Stddev_Samp_Fields = {
  __typename?: 'holdings_stddev_samp_fields'
  amount?: Maybe<Scalars['Float']>
}

/** order by stddev_samp() on columns of table "holdings" */
export type Holdings_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
}

/** aggregate sum on columns */
export type Holdings_Sum_Fields = {
  __typename?: 'holdings_sum_fields'
  amount?: Maybe<Scalars['bigint']>
}

/** order by sum() on columns of table "holdings" */
export type Holdings_Sum_Order_By = {
  amount?: InputMaybe<Order_By>
}

/** aggregate var_pop on columns */
export type Holdings_Var_Pop_Fields = {
  __typename?: 'holdings_var_pop_fields'
  amount?: Maybe<Scalars['Float']>
}

/** order by var_pop() on columns of table "holdings" */
export type Holdings_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
}

/** aggregate var_samp on columns */
export type Holdings_Var_Samp_Fields = {
  __typename?: 'holdings_var_samp_fields'
  amount?: Maybe<Scalars['Float']>
}

/** order by var_samp() on columns of table "holdings" */
export type Holdings_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
}

/** aggregate variance on columns */
export type Holdings_Variance_Fields = {
  __typename?: 'holdings_variance_fields'
  amount?: Maybe<Scalars['Float']>
}

/** order by variance() on columns of table "holdings" */
export type Holdings_Variance_Order_By = {
  amount?: InputMaybe<Order_By>
}

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>
}

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']>
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']>
  _eq?: InputMaybe<Scalars['jsonb']>
  _gt?: InputMaybe<Scalars['jsonb']>
  _gte?: InputMaybe<Scalars['jsonb']>
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']>
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']>>
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']>>
  _in?: InputMaybe<Array<Scalars['jsonb']>>
  _is_null?: InputMaybe<Scalars['Boolean']>
  _lt?: InputMaybe<Scalars['jsonb']>
  _lte?: InputMaybe<Scalars['jsonb']>
  _neq?: InputMaybe<Scalars['jsonb']>
  _nin?: InputMaybe<Array<Scalars['jsonb']>>
}

/** columns and relationships of "listings" */
export type Listings = {
  __typename?: 'listings'
  amount: Scalars['bigint']
  amount_left: Scalars['bigint']
  ask_id?: Maybe<Scalars['bigint']>
  burn_on_end?: Maybe<Scalars['Boolean']>
  contract_address: Scalars['String']
  created_at: Scalars['timestamptz']
  currency?: Maybe<Scalars['String']>
  end_price?: Maybe<Scalars['bigint']>
  end_time?: Maybe<Scalars['timestamptz']>
  fa2_address: Scalars['String']
  offer_id?: Maybe<Scalars['bigint']>
  price: Scalars['bigint']
  seller_address: Scalars['String']
  /** An object relationship */
  seller_profile?: Maybe<Teia_Users>
  start_price?: Maybe<Scalars['bigint']>
  status: Scalars['String']
  swap_id?: Maybe<Scalars['bigint']>
  /** An object relationship */
  token?: Maybe<Tokens>
  token_id: Scalars['String']
  type: Scalars['String']
}

/** aggregated selection of "listings" */
export type Listings_Aggregate = {
  __typename?: 'listings_aggregate'
  aggregate?: Maybe<Listings_Aggregate_Fields>
  nodes: Array<Listings>
}

/** aggregate fields of "listings" */
export type Listings_Aggregate_Fields = {
  __typename?: 'listings_aggregate_fields'
  avg?: Maybe<Listings_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Listings_Max_Fields>
  min?: Maybe<Listings_Min_Fields>
  stddev?: Maybe<Listings_Stddev_Fields>
  stddev_pop?: Maybe<Listings_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Listings_Stddev_Samp_Fields>
  sum?: Maybe<Listings_Sum_Fields>
  var_pop?: Maybe<Listings_Var_Pop_Fields>
  var_samp?: Maybe<Listings_Var_Samp_Fields>
  variance?: Maybe<Listings_Variance_Fields>
}

/** aggregate fields of "listings" */
export type Listings_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Listings_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** order by aggregate values of table "listings" */
export type Listings_Aggregate_Order_By = {
  avg?: InputMaybe<Listings_Avg_Order_By>
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Listings_Max_Order_By>
  min?: InputMaybe<Listings_Min_Order_By>
  stddev?: InputMaybe<Listings_Stddev_Order_By>
  stddev_pop?: InputMaybe<Listings_Stddev_Pop_Order_By>
  stddev_samp?: InputMaybe<Listings_Stddev_Samp_Order_By>
  sum?: InputMaybe<Listings_Sum_Order_By>
  var_pop?: InputMaybe<Listings_Var_Pop_Order_By>
  var_samp?: InputMaybe<Listings_Var_Samp_Order_By>
  variance?: InputMaybe<Listings_Variance_Order_By>
}

/** aggregate avg on columns */
export type Listings_Avg_Fields = {
  __typename?: 'listings_avg_fields'
  amount?: Maybe<Scalars['Float']>
  amount_left?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
}

/** order by avg() on columns of table "listings" */
export type Listings_Avg_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** Boolean expression to filter rows from the table "listings". All fields are combined with a logical 'AND'. */
export type Listings_Bool_Exp = {
  _and?: InputMaybe<Array<Listings_Bool_Exp>>
  _not?: InputMaybe<Listings_Bool_Exp>
  _or?: InputMaybe<Array<Listings_Bool_Exp>>
  amount?: InputMaybe<Bigint_Comparison_Exp>
  amount_left?: InputMaybe<Bigint_Comparison_Exp>
  ask_id?: InputMaybe<Bigint_Comparison_Exp>
  burn_on_end?: InputMaybe<Boolean_Comparison_Exp>
  contract_address?: InputMaybe<String_Comparison_Exp>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  currency?: InputMaybe<String_Comparison_Exp>
  end_price?: InputMaybe<Bigint_Comparison_Exp>
  end_time?: InputMaybe<Timestamptz_Comparison_Exp>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  offer_id?: InputMaybe<Bigint_Comparison_Exp>
  price?: InputMaybe<Bigint_Comparison_Exp>
  seller_address?: InputMaybe<String_Comparison_Exp>
  seller_profile?: InputMaybe<Teia_Users_Bool_Exp>
  start_price?: InputMaybe<Bigint_Comparison_Exp>
  status?: InputMaybe<String_Comparison_Exp>
  swap_id?: InputMaybe<Bigint_Comparison_Exp>
  token?: InputMaybe<Tokens_Bool_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
  type?: InputMaybe<String_Comparison_Exp>
}

/** aggregate max on columns */
export type Listings_Max_Fields = {
  __typename?: 'listings_max_fields'
  amount?: Maybe<Scalars['bigint']>
  amount_left?: Maybe<Scalars['bigint']>
  ask_id?: Maybe<Scalars['bigint']>
  contract_address?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  currency?: Maybe<Scalars['String']>
  end_price?: Maybe<Scalars['bigint']>
  end_time?: Maybe<Scalars['timestamptz']>
  fa2_address?: Maybe<Scalars['String']>
  offer_id?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
  seller_address?: Maybe<Scalars['String']>
  start_price?: Maybe<Scalars['bigint']>
  status?: Maybe<Scalars['String']>
  swap_id?: Maybe<Scalars['bigint']>
  token_id?: Maybe<Scalars['String']>
  type?: Maybe<Scalars['String']>
}

/** order by max() on columns of table "listings" */
export type Listings_Max_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  end_time?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  seller_address?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** aggregate min on columns */
export type Listings_Min_Fields = {
  __typename?: 'listings_min_fields'
  amount?: Maybe<Scalars['bigint']>
  amount_left?: Maybe<Scalars['bigint']>
  ask_id?: Maybe<Scalars['bigint']>
  contract_address?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  currency?: Maybe<Scalars['String']>
  end_price?: Maybe<Scalars['bigint']>
  end_time?: Maybe<Scalars['timestamptz']>
  fa2_address?: Maybe<Scalars['String']>
  offer_id?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
  seller_address?: Maybe<Scalars['String']>
  start_price?: Maybe<Scalars['bigint']>
  status?: Maybe<Scalars['String']>
  swap_id?: Maybe<Scalars['bigint']>
  token_id?: Maybe<Scalars['String']>
  type?: Maybe<Scalars['String']>
}

/** order by min() on columns of table "listings" */
export type Listings_Min_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  end_time?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  seller_address?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "listings". */
export type Listings_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  burn_on_end?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  end_time?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  seller_address?: InputMaybe<Order_By>
  seller_profile?: InputMaybe<Teia_Users_Order_By>
  start_price?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
  token?: InputMaybe<Tokens_Order_By>
  token_id?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** select columns of table "listings" */
export enum Listings_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  AmountLeft = 'amount_left',
  /** column name */
  AskId = 'ask_id',
  /** column name */
  BurnOnEnd = 'burn_on_end',
  /** column name */
  ContractAddress = 'contract_address',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Currency = 'currency',
  /** column name */
  EndPrice = 'end_price',
  /** column name */
  EndTime = 'end_time',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  Price = 'price',
  /** column name */
  SellerAddress = 'seller_address',
  /** column name */
  StartPrice = 'start_price',
  /** column name */
  Status = 'status',
  /** column name */
  SwapId = 'swap_id',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  Type = 'type',
}

/** aggregate stddev on columns */
export type Listings_Stddev_Fields = {
  __typename?: 'listings_stddev_fields'
  amount?: Maybe<Scalars['Float']>
  amount_left?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
}

/** order by stddev() on columns of table "listings" */
export type Listings_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** aggregate stddev_pop on columns */
export type Listings_Stddev_Pop_Fields = {
  __typename?: 'listings_stddev_pop_fields'
  amount?: Maybe<Scalars['Float']>
  amount_left?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
}

/** order by stddev_pop() on columns of table "listings" */
export type Listings_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** aggregate stddev_samp on columns */
export type Listings_Stddev_Samp_Fields = {
  __typename?: 'listings_stddev_samp_fields'
  amount?: Maybe<Scalars['Float']>
  amount_left?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
}

/** order by stddev_samp() on columns of table "listings" */
export type Listings_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** aggregate sum on columns */
export type Listings_Sum_Fields = {
  __typename?: 'listings_sum_fields'
  amount?: Maybe<Scalars['bigint']>
  amount_left?: Maybe<Scalars['bigint']>
  ask_id?: Maybe<Scalars['bigint']>
  end_price?: Maybe<Scalars['bigint']>
  offer_id?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
  start_price?: Maybe<Scalars['bigint']>
  swap_id?: Maybe<Scalars['bigint']>
}

/** order by sum() on columns of table "listings" */
export type Listings_Sum_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** aggregate var_pop on columns */
export type Listings_Var_Pop_Fields = {
  __typename?: 'listings_var_pop_fields'
  amount?: Maybe<Scalars['Float']>
  amount_left?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
}

/** order by var_pop() on columns of table "listings" */
export type Listings_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** aggregate var_samp on columns */
export type Listings_Var_Samp_Fields = {
  __typename?: 'listings_var_samp_fields'
  amount?: Maybe<Scalars['Float']>
  amount_left?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
}

/** order by var_samp() on columns of table "listings" */
export type Listings_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** aggregate variance on columns */
export type Listings_Variance_Fields = {
  __typename?: 'listings_variance_fields'
  amount?: Maybe<Scalars['Float']>
  amount_left?: Maybe<Scalars['Float']>
  ask_id?: Maybe<Scalars['Float']>
  end_price?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  start_price?: Maybe<Scalars['Float']>
  swap_id?: Maybe<Scalars['Float']>
}

/** order by variance() on columns of table "listings" */
export type Listings_Variance_Order_By = {
  amount?: InputMaybe<Order_By>
  amount_left?: InputMaybe<Order_By>
  ask_id?: InputMaybe<Order_By>
  end_price?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  start_price?: InputMaybe<Order_By>
  swap_id?: InputMaybe<Order_By>
}

/** columns and relationships of "offers" */
export type Offers = {
  __typename?: 'offers'
  amount?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  buyer_address: Scalars['String']
  contract_address: Scalars['String']
  created_at: Scalars['timestamptz']
  currency?: Maybe<Scalars['String']>
  fa2_address: Scalars['String']
  offer_id?: Maybe<Scalars['bigint']>
  price: Scalars['bigint']
  status: Scalars['String']
  /** An object relationship */
  token?: Maybe<Tokens>
  token_id: Scalars['String']
  type: Scalars['String']
}

/** aggregated selection of "offers" */
export type Offers_Aggregate = {
  __typename?: 'offers_aggregate'
  aggregate?: Maybe<Offers_Aggregate_Fields>
  nodes: Array<Offers>
}

/** aggregate fields of "offers" */
export type Offers_Aggregate_Fields = {
  __typename?: 'offers_aggregate_fields'
  avg?: Maybe<Offers_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Offers_Max_Fields>
  min?: Maybe<Offers_Min_Fields>
  stddev?: Maybe<Offers_Stddev_Fields>
  stddev_pop?: Maybe<Offers_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Offers_Stddev_Samp_Fields>
  sum?: Maybe<Offers_Sum_Fields>
  var_pop?: Maybe<Offers_Var_Pop_Fields>
  var_samp?: Maybe<Offers_Var_Samp_Fields>
  variance?: Maybe<Offers_Variance_Fields>
}

/** aggregate fields of "offers" */
export type Offers_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Offers_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** order by aggregate values of table "offers" */
export type Offers_Aggregate_Order_By = {
  avg?: InputMaybe<Offers_Avg_Order_By>
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Offers_Max_Order_By>
  min?: InputMaybe<Offers_Min_Order_By>
  stddev?: InputMaybe<Offers_Stddev_Order_By>
  stddev_pop?: InputMaybe<Offers_Stddev_Pop_Order_By>
  stddev_samp?: InputMaybe<Offers_Stddev_Samp_Order_By>
  sum?: InputMaybe<Offers_Sum_Order_By>
  var_pop?: InputMaybe<Offers_Var_Pop_Order_By>
  var_samp?: InputMaybe<Offers_Var_Samp_Order_By>
  variance?: InputMaybe<Offers_Variance_Order_By>
}

/** aggregate avg on columns */
export type Offers_Avg_Fields = {
  __typename?: 'offers_avg_fields'
  amount?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
}

/** order by avg() on columns of table "offers" */
export type Offers_Avg_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

/** Boolean expression to filter rows from the table "offers". All fields are combined with a logical 'AND'. */
export type Offers_Bool_Exp = {
  _and?: InputMaybe<Array<Offers_Bool_Exp>>
  _not?: InputMaybe<Offers_Bool_Exp>
  _or?: InputMaybe<Array<Offers_Bool_Exp>>
  amount?: InputMaybe<Bigint_Comparison_Exp>
  bid_id?: InputMaybe<Bigint_Comparison_Exp>
  buyer_address?: InputMaybe<String_Comparison_Exp>
  contract_address?: InputMaybe<String_Comparison_Exp>
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>
  currency?: InputMaybe<String_Comparison_Exp>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  offer_id?: InputMaybe<Bigint_Comparison_Exp>
  price?: InputMaybe<Bigint_Comparison_Exp>
  status?: InputMaybe<String_Comparison_Exp>
  token?: InputMaybe<Tokens_Bool_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
  type?: InputMaybe<String_Comparison_Exp>
}

/** aggregate max on columns */
export type Offers_Max_Fields = {
  __typename?: 'offers_max_fields'
  amount?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  buyer_address?: Maybe<Scalars['String']>
  contract_address?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  currency?: Maybe<Scalars['String']>
  fa2_address?: Maybe<Scalars['String']>
  offer_id?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
  status?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  type?: Maybe<Scalars['String']>
}

/** order by max() on columns of table "offers" */
export type Offers_Max_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  buyer_address?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** aggregate min on columns */
export type Offers_Min_Fields = {
  __typename?: 'offers_min_fields'
  amount?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  buyer_address?: Maybe<Scalars['String']>
  contract_address?: Maybe<Scalars['String']>
  created_at?: Maybe<Scalars['timestamptz']>
  currency?: Maybe<Scalars['String']>
  fa2_address?: Maybe<Scalars['String']>
  offer_id?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
  status?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  type?: Maybe<Scalars['String']>
}

/** order by min() on columns of table "offers" */
export type Offers_Min_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  buyer_address?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "offers". */
export type Offers_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  buyer_address?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  created_at?: InputMaybe<Order_By>
  currency?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  token?: InputMaybe<Tokens_Order_By>
  token_id?: InputMaybe<Order_By>
  type?: InputMaybe<Order_By>
}

/** select columns of table "offers" */
export enum Offers_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  BidId = 'bid_id',
  /** column name */
  BuyerAddress = 'buyer_address',
  /** column name */
  ContractAddress = 'contract_address',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Currency = 'currency',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  Price = 'price',
  /** column name */
  Status = 'status',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  Type = 'type',
}

/** aggregate stddev on columns */
export type Offers_Stddev_Fields = {
  __typename?: 'offers_stddev_fields'
  amount?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
}

/** order by stddev() on columns of table "offers" */
export type Offers_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

/** aggregate stddev_pop on columns */
export type Offers_Stddev_Pop_Fields = {
  __typename?: 'offers_stddev_pop_fields'
  amount?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
}

/** order by stddev_pop() on columns of table "offers" */
export type Offers_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

/** aggregate stddev_samp on columns */
export type Offers_Stddev_Samp_Fields = {
  __typename?: 'offers_stddev_samp_fields'
  amount?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
}

/** order by stddev_samp() on columns of table "offers" */
export type Offers_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

/** aggregate sum on columns */
export type Offers_Sum_Fields = {
  __typename?: 'offers_sum_fields'
  amount?: Maybe<Scalars['bigint']>
  bid_id?: Maybe<Scalars['bigint']>
  offer_id?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
}

/** order by sum() on columns of table "offers" */
export type Offers_Sum_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

/** aggregate var_pop on columns */
export type Offers_Var_Pop_Fields = {
  __typename?: 'offers_var_pop_fields'
  amount?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
}

/** order by var_pop() on columns of table "offers" */
export type Offers_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

/** aggregate var_samp on columns */
export type Offers_Var_Samp_Fields = {
  __typename?: 'offers_var_samp_fields'
  amount?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
}

/** order by var_samp() on columns of table "offers" */
export type Offers_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

/** aggregate variance on columns */
export type Offers_Variance_Fields = {
  __typename?: 'offers_variance_fields'
  amount?: Maybe<Scalars['Float']>
  bid_id?: Maybe<Scalars['Float']>
  offer_id?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
}

/** order by variance() on columns of table "offers" */
export type Offers_Variance_Order_By = {
  amount?: InputMaybe<Order_By>
  bid_id?: InputMaybe<Order_By>
  offer_id?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
}

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
  DescNullsLast = 'desc_nulls_last',
}

export type Query_Root = {
  __typename?: 'query_root'
  /** fetch data from the table: "dipdup_contract" */
  dipdup_contract: Array<Dipdup_Contract>
  /** fetch aggregated fields from the table: "dipdup_contract" */
  dipdup_contract_aggregate: Dipdup_Contract_Aggregate
  /** fetch data from the table: "dipdup_contract" using primary key columns */
  dipdup_contract_by_pk?: Maybe<Dipdup_Contract>
  /** fetch data from the table: "dipdup_contract_metadata" */
  dipdup_contract_metadata: Array<Dipdup_Contract_Metadata>
  /** fetch aggregated fields from the table: "dipdup_contract_metadata" */
  dipdup_contract_metadata_aggregate: Dipdup_Contract_Metadata_Aggregate
  /** fetch data from the table: "dipdup_contract_metadata" using primary key columns */
  dipdup_contract_metadata_by_pk?: Maybe<Dipdup_Contract_Metadata>
  /** fetch data from the table: "dipdup_head" */
  dipdup_head: Array<Dipdup_Head>
  /** fetch aggregated fields from the table: "dipdup_head" */
  dipdup_head_aggregate: Dipdup_Head_Aggregate
  /** fetch data from the table: "dipdup_head" using primary key columns */
  dipdup_head_by_pk?: Maybe<Dipdup_Head>
  /** fetch data from the table: "dipdup_head_status" */
  dipdup_head_status: Array<Dipdup_Head_Status>
  /** fetch aggregated fields from the table: "dipdup_head_status" */
  dipdup_head_status_aggregate: Dipdup_Head_Status_Aggregate
  /** fetch data from the table: "dipdup_index" */
  dipdup_index: Array<Dipdup_Index>
  /** fetch aggregated fields from the table: "dipdup_index" */
  dipdup_index_aggregate: Dipdup_Index_Aggregate
  /** fetch data from the table: "dipdup_index" using primary key columns */
  dipdup_index_by_pk?: Maybe<Dipdup_Index>
  /** fetch data from the table: "dipdup_model_update" */
  dipdup_model_update: Array<Dipdup_Model_Update>
  /** fetch aggregated fields from the table: "dipdup_model_update" */
  dipdup_model_update_aggregate: Dipdup_Model_Update_Aggregate
  /** fetch data from the table: "dipdup_model_update" using primary key columns */
  dipdup_model_update_by_pk?: Maybe<Dipdup_Model_Update>
  /** fetch data from the table: "dipdup_schema" */
  dipdup_schema: Array<Dipdup_Schema>
  /** fetch aggregated fields from the table: "dipdup_schema" */
  dipdup_schema_aggregate: Dipdup_Schema_Aggregate
  /** fetch data from the table: "dipdup_schema" using primary key columns */
  dipdup_schema_by_pk?: Maybe<Dipdup_Schema>
  /** fetch data from the table: "dipdup_token_metadata" */
  dipdup_token_metadata: Array<Dipdup_Token_Metadata>
  /** fetch aggregated fields from the table: "dipdup_token_metadata" */
  dipdup_token_metadata_aggregate: Dipdup_Token_Metadata_Aggregate
  /** fetch data from the table: "dipdup_token_metadata" using primary key columns */
  dipdup_token_metadata_by_pk?: Maybe<Dipdup_Token_Metadata>
  /** An array relationship */
  events: Array<Events>
  /** An aggregate relationship */
  events_aggregate: Events_Aggregate
  /** fetch data from the table: "events" using primary key columns */
  events_by_pk?: Maybe<Events>
  /** An array relationship */
  holdings: Array<Holdings>
  /** An aggregate relationship */
  holdings_aggregate: Holdings_Aggregate
  /** fetch data from the table: "holdings" using primary key columns */
  holdings_by_pk?: Maybe<Holdings>
  /** An array relationship */
  listings: Array<Listings>
  /** An aggregate relationship */
  listings_aggregate: Listings_Aggregate
  /** An array relationship */
  offers: Array<Offers>
  /** An aggregate relationship */
  offers_aggregate: Offers_Aggregate
  /** An array relationship */
  royalty_receivers: Array<Royalty_Receivers>
  /** fetch data from the table: "royalty_receivers" using primary key columns */
  royalty_receivers_by_pk?: Maybe<Royalty_Receivers>
  /** An array relationship */
  tags: Array<Tags>
  /** fetch data from the table: "tags" using primary key columns */
  tags_by_pk?: Maybe<Tags>
  /** fetch data from the table: "teia_shareholders" */
  teia_shareholders: Array<Teia_Shareholders>
  /** fetch data from the table: "teia_shareholders" using primary key columns */
  teia_shareholders_by_pk?: Maybe<Teia_Shareholders>
  /** fetch data from the table: "teia_signatures" */
  teia_signatures: Array<Teia_Signatures>
  /** fetch data from the table: "teia_signatures" using primary key columns */
  teia_signatures_by_pk?: Maybe<Teia_Signatures>
  /** fetch data from the table: "teia_split_contracts" */
  teia_split_contracts: Array<Teia_Split_Contracts>
  /** fetch data from the table: "teia_split_contracts" using primary key columns */
  teia_split_contracts_by_pk?: Maybe<Teia_Split_Contracts>
  /** fetch data from the table: "teia_tokens_meta" */
  teia_tokens_meta: Array<Teia_Tokens_Meta>
  /** fetch data from the table: "teia_tokens_meta" using primary key columns */
  teia_tokens_meta_by_pk?: Maybe<Teia_Tokens_Meta>
  /** fetch data from the table: "teia_users" */
  teia_users: Array<Teia_Users>
  /** fetch data from the table: "teia_users" using primary key columns */
  teia_users_by_pk?: Maybe<Teia_Users>
  /** fetch data from the table: "token_metadata" */
  token_metadata: Array<Token_Metadata>
  /** fetch data from the table: "tokens" */
  tokens: Array<Tokens>
  /** fetch aggregated fields from the table: "tokens" */
  tokens_aggregate: Tokens_Aggregate
  /** fetch data from the table: "tokens" using primary key columns */
  tokens_by_pk?: Maybe<Tokens>
  /** fetch data from the table: "tzprofiles" */
  tzprofiles: Array<Tzprofiles>
  /** fetch aggregated fields from the table: "tzprofiles" */
  tzprofiles_aggregate: Tzprofiles_Aggregate
  /** fetch data from the table: "tzprofiles" using primary key columns */
  tzprofiles_by_pk?: Maybe<Tzprofiles>
}

export type Query_RootDipdup_ContractArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Bool_Exp>
}

export type Query_RootDipdup_Contract_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Bool_Exp>
}

export type Query_RootDipdup_Contract_By_PkArgs = {
  name: Scalars['String']
}

export type Query_RootDipdup_Contract_MetadataArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Metadata_Bool_Exp>
}

export type Query_RootDipdup_Contract_Metadata_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Metadata_Bool_Exp>
}

export type Query_RootDipdup_Contract_Metadata_By_PkArgs = {
  id: Scalars['Int']
}

export type Query_RootDipdup_HeadArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Order_By>>
  where?: InputMaybe<Dipdup_Head_Bool_Exp>
}

export type Query_RootDipdup_Head_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Order_By>>
  where?: InputMaybe<Dipdup_Head_Bool_Exp>
}

export type Query_RootDipdup_Head_By_PkArgs = {
  name: Scalars['String']
}

export type Query_RootDipdup_Head_StatusArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Status_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Status_Order_By>>
  where?: InputMaybe<Dipdup_Head_Status_Bool_Exp>
}

export type Query_RootDipdup_Head_Status_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Status_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Status_Order_By>>
  where?: InputMaybe<Dipdup_Head_Status_Bool_Exp>
}

export type Query_RootDipdup_IndexArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Index_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Index_Order_By>>
  where?: InputMaybe<Dipdup_Index_Bool_Exp>
}

export type Query_RootDipdup_Index_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Index_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Index_Order_By>>
  where?: InputMaybe<Dipdup_Index_Bool_Exp>
}

export type Query_RootDipdup_Index_By_PkArgs = {
  name: Scalars['String']
}

export type Query_RootDipdup_Model_UpdateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Model_Update_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Model_Update_Order_By>>
  where?: InputMaybe<Dipdup_Model_Update_Bool_Exp>
}

export type Query_RootDipdup_Model_Update_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Model_Update_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Model_Update_Order_By>>
  where?: InputMaybe<Dipdup_Model_Update_Bool_Exp>
}

export type Query_RootDipdup_Model_Update_By_PkArgs = {
  id: Scalars['Int']
}

export type Query_RootDipdup_SchemaArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Schema_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Schema_Order_By>>
  where?: InputMaybe<Dipdup_Schema_Bool_Exp>
}

export type Query_RootDipdup_Schema_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Schema_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Schema_Order_By>>
  where?: InputMaybe<Dipdup_Schema_Bool_Exp>
}

export type Query_RootDipdup_Schema_By_PkArgs = {
  name: Scalars['String']
}

export type Query_RootDipdup_Token_MetadataArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Token_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Token_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Token_Metadata_Bool_Exp>
}

export type Query_RootDipdup_Token_Metadata_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Token_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Token_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Token_Metadata_Bool_Exp>
}

export type Query_RootDipdup_Token_Metadata_By_PkArgs = {
  id: Scalars['Int']
}

export type Query_RootEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Events_Order_By>>
  where?: InputMaybe<Events_Bool_Exp>
}

export type Query_RootEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Events_Order_By>>
  where?: InputMaybe<Events_Bool_Exp>
}

export type Query_RootEvents_By_PkArgs = {
  id: Scalars['String']
}

export type Query_RootHoldingsArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Holdings_Order_By>>
  where?: InputMaybe<Holdings_Bool_Exp>
}

export type Query_RootHoldings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Holdings_Order_By>>
  where?: InputMaybe<Holdings_Bool_Exp>
}

export type Query_RootHoldings_By_PkArgs = {
  fa2_address: Scalars['String']
  holder_address: Scalars['String']
  token_id: Scalars['String']
}

export type Query_RootListingsArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Listings_Order_By>>
  where?: InputMaybe<Listings_Bool_Exp>
}

export type Query_RootListings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Listings_Order_By>>
  where?: InputMaybe<Listings_Bool_Exp>
}

export type Query_RootOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Offers_Order_By>>
  where?: InputMaybe<Offers_Bool_Exp>
}

export type Query_RootOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Offers_Order_By>>
  where?: InputMaybe<Offers_Bool_Exp>
}

export type Query_RootRoyalty_ReceiversArgs = {
  distinct_on?: InputMaybe<Array<Royalty_Receivers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Royalty_Receivers_Order_By>>
  where?: InputMaybe<Royalty_Receivers_Bool_Exp>
}

export type Query_RootRoyalty_Receivers_By_PkArgs = {
  fa2_address: Scalars['String']
  receiver_address: Scalars['String']
  token_id: Scalars['String']
}

export type Query_RootTagsArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tags_Order_By>>
  where?: InputMaybe<Tags_Bool_Exp>
}

export type Query_RootTags_By_PkArgs = {
  fa2_address: Scalars['String']
  tag: Scalars['String']
  token_id: Scalars['String']
}

export type Query_RootTeia_ShareholdersArgs = {
  distinct_on?: InputMaybe<Array<Teia_Shareholders_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Shareholders_Order_By>>
  where?: InputMaybe<Teia_Shareholders_Bool_Exp>
}

export type Query_RootTeia_Shareholders_By_PkArgs = {
  contract_address: Scalars['String']
  holder_type: Scalars['String']
  shareholder_address: Scalars['String']
}

export type Query_RootTeia_SignaturesArgs = {
  distinct_on?: InputMaybe<Array<Teia_Signatures_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Signatures_Order_By>>
  where?: InputMaybe<Teia_Signatures_Bool_Exp>
}

export type Query_RootTeia_Signatures_By_PkArgs = {
  fa2_address: Scalars['String']
  shareholder_address: Scalars['String']
  token_id: Scalars['String']
}

export type Query_RootTeia_Split_ContractsArgs = {
  distinct_on?: InputMaybe<Array<Teia_Split_Contracts_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Split_Contracts_Order_By>>
  where?: InputMaybe<Teia_Split_Contracts_Bool_Exp>
}

export type Query_RootTeia_Split_Contracts_By_PkArgs = {
  contract_address: Scalars['String']
}

export type Query_RootTeia_Tokens_MetaArgs = {
  distinct_on?: InputMaybe<Array<Teia_Tokens_Meta_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Tokens_Meta_Order_By>>
  where?: InputMaybe<Teia_Tokens_Meta_Bool_Exp>
}

export type Query_RootTeia_Tokens_Meta_By_PkArgs = {
  fa2_address: Scalars['String']
  token_id: Scalars['String']
}

export type Query_RootTeia_UsersArgs = {
  distinct_on?: InputMaybe<Array<Teia_Users_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Users_Order_By>>
  where?: InputMaybe<Teia_Users_Bool_Exp>
}

export type Query_RootTeia_Users_By_PkArgs = {
  user_address: Scalars['String']
}

export type Query_RootToken_MetadataArgs = {
  distinct_on?: InputMaybe<Array<Token_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Token_Metadata_Order_By>>
  where?: InputMaybe<Token_Metadata_Bool_Exp>
}

export type Query_RootTokensArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tokens_Order_By>>
  where?: InputMaybe<Tokens_Bool_Exp>
}

export type Query_RootTokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tokens_Order_By>>
  where?: InputMaybe<Tokens_Bool_Exp>
}

export type Query_RootTokens_By_PkArgs = {
  fa2_address: Scalars['String']
  token_id: Scalars['String']
}

export type Query_RootTzprofilesArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>
  where?: InputMaybe<Tzprofiles_Bool_Exp>
}

export type Query_RootTzprofiles_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>
  where?: InputMaybe<Tzprofiles_Bool_Exp>
}

export type Query_RootTzprofiles_By_PkArgs = {
  account: Scalars['String']
}

/** columns and relationships of "royalty_receivers" */
export type Royalty_Receivers = {
  __typename?: 'royalty_receivers'
  fa2_address: Scalars['String']
  receiver_address: Scalars['String']
  royalties: Scalars['bigint']
  /** An object relationship */
  token?: Maybe<Tokens>
  token_id: Scalars['String']
}

/** order by aggregate values of table "royalty_receivers" */
export type Royalty_Receivers_Aggregate_Order_By = {
  avg?: InputMaybe<Royalty_Receivers_Avg_Order_By>
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Royalty_Receivers_Max_Order_By>
  min?: InputMaybe<Royalty_Receivers_Min_Order_By>
  stddev?: InputMaybe<Royalty_Receivers_Stddev_Order_By>
  stddev_pop?: InputMaybe<Royalty_Receivers_Stddev_Pop_Order_By>
  stddev_samp?: InputMaybe<Royalty_Receivers_Stddev_Samp_Order_By>
  sum?: InputMaybe<Royalty_Receivers_Sum_Order_By>
  var_pop?: InputMaybe<Royalty_Receivers_Var_Pop_Order_By>
  var_samp?: InputMaybe<Royalty_Receivers_Var_Samp_Order_By>
  variance?: InputMaybe<Royalty_Receivers_Variance_Order_By>
}

/** order by avg() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Avg_Order_By = {
  royalties?: InputMaybe<Order_By>
}

/** Boolean expression to filter rows from the table "royalty_receivers". All fields are combined with a logical 'AND'. */
export type Royalty_Receivers_Bool_Exp = {
  _and?: InputMaybe<Array<Royalty_Receivers_Bool_Exp>>
  _not?: InputMaybe<Royalty_Receivers_Bool_Exp>
  _or?: InputMaybe<Array<Royalty_Receivers_Bool_Exp>>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  receiver_address?: InputMaybe<String_Comparison_Exp>
  royalties?: InputMaybe<Bigint_Comparison_Exp>
  token?: InputMaybe<Tokens_Bool_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
}

/** order by max() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Max_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  receiver_address?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** order by min() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Min_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  receiver_address?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "royalty_receivers". */
export type Royalty_Receivers_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  receiver_address?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  token?: InputMaybe<Tokens_Order_By>
  token_id?: InputMaybe<Order_By>
}

/** select columns of table "royalty_receivers" */
export enum Royalty_Receivers_Select_Column {
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  ReceiverAddress = 'receiver_address',
  /** column name */
  Royalties = 'royalties',
  /** column name */
  TokenId = 'token_id',
}

/** order by stddev() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Stddev_Order_By = {
  royalties?: InputMaybe<Order_By>
}

/** order by stddev_pop() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Stddev_Pop_Order_By = {
  royalties?: InputMaybe<Order_By>
}

/** order by stddev_samp() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Stddev_Samp_Order_By = {
  royalties?: InputMaybe<Order_By>
}

/** order by sum() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Sum_Order_By = {
  royalties?: InputMaybe<Order_By>
}

/** order by var_pop() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Var_Pop_Order_By = {
  royalties?: InputMaybe<Order_By>
}

/** order by var_samp() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Var_Samp_Order_By = {
  royalties?: InputMaybe<Order_By>
}

/** order by variance() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Variance_Order_By = {
  royalties?: InputMaybe<Order_By>
}

export type Subscription_Root = {
  __typename?: 'subscription_root'
  /** fetch data from the table: "dipdup_contract" */
  dipdup_contract: Array<Dipdup_Contract>
  /** fetch aggregated fields from the table: "dipdup_contract" */
  dipdup_contract_aggregate: Dipdup_Contract_Aggregate
  /** fetch data from the table: "dipdup_contract" using primary key columns */
  dipdup_contract_by_pk?: Maybe<Dipdup_Contract>
  /** fetch data from the table: "dipdup_contract_metadata" */
  dipdup_contract_metadata: Array<Dipdup_Contract_Metadata>
  /** fetch aggregated fields from the table: "dipdup_contract_metadata" */
  dipdup_contract_metadata_aggregate: Dipdup_Contract_Metadata_Aggregate
  /** fetch data from the table: "dipdup_contract_metadata" using primary key columns */
  dipdup_contract_metadata_by_pk?: Maybe<Dipdup_Contract_Metadata>
  /** fetch data from the table in a streaming manner: "dipdup_contract_metadata" */
  dipdup_contract_metadata_stream: Array<Dipdup_Contract_Metadata>
  /** fetch data from the table in a streaming manner: "dipdup_contract" */
  dipdup_contract_stream: Array<Dipdup_Contract>
  /** fetch data from the table: "dipdup_head" */
  dipdup_head: Array<Dipdup_Head>
  /** fetch aggregated fields from the table: "dipdup_head" */
  dipdup_head_aggregate: Dipdup_Head_Aggregate
  /** fetch data from the table: "dipdup_head" using primary key columns */
  dipdup_head_by_pk?: Maybe<Dipdup_Head>
  /** fetch data from the table: "dipdup_head_status" */
  dipdup_head_status: Array<Dipdup_Head_Status>
  /** fetch aggregated fields from the table: "dipdup_head_status" */
  dipdup_head_status_aggregate: Dipdup_Head_Status_Aggregate
  /** fetch data from the table in a streaming manner: "dipdup_head_status" */
  dipdup_head_status_stream: Array<Dipdup_Head_Status>
  /** fetch data from the table in a streaming manner: "dipdup_head" */
  dipdup_head_stream: Array<Dipdup_Head>
  /** fetch data from the table: "dipdup_index" */
  dipdup_index: Array<Dipdup_Index>
  /** fetch aggregated fields from the table: "dipdup_index" */
  dipdup_index_aggregate: Dipdup_Index_Aggregate
  /** fetch data from the table: "dipdup_index" using primary key columns */
  dipdup_index_by_pk?: Maybe<Dipdup_Index>
  /** fetch data from the table in a streaming manner: "dipdup_index" */
  dipdup_index_stream: Array<Dipdup_Index>
  /** fetch data from the table: "dipdup_model_update" */
  dipdup_model_update: Array<Dipdup_Model_Update>
  /** fetch aggregated fields from the table: "dipdup_model_update" */
  dipdup_model_update_aggregate: Dipdup_Model_Update_Aggregate
  /** fetch data from the table: "dipdup_model_update" using primary key columns */
  dipdup_model_update_by_pk?: Maybe<Dipdup_Model_Update>
  /** fetch data from the table in a streaming manner: "dipdup_model_update" */
  dipdup_model_update_stream: Array<Dipdup_Model_Update>
  /** fetch data from the table: "dipdup_schema" */
  dipdup_schema: Array<Dipdup_Schema>
  /** fetch aggregated fields from the table: "dipdup_schema" */
  dipdup_schema_aggregate: Dipdup_Schema_Aggregate
  /** fetch data from the table: "dipdup_schema" using primary key columns */
  dipdup_schema_by_pk?: Maybe<Dipdup_Schema>
  /** fetch data from the table in a streaming manner: "dipdup_schema" */
  dipdup_schema_stream: Array<Dipdup_Schema>
  /** fetch data from the table: "dipdup_token_metadata" */
  dipdup_token_metadata: Array<Dipdup_Token_Metadata>
  /** fetch aggregated fields from the table: "dipdup_token_metadata" */
  dipdup_token_metadata_aggregate: Dipdup_Token_Metadata_Aggregate
  /** fetch data from the table: "dipdup_token_metadata" using primary key columns */
  dipdup_token_metadata_by_pk?: Maybe<Dipdup_Token_Metadata>
  /** fetch data from the table in a streaming manner: "dipdup_token_metadata" */
  dipdup_token_metadata_stream: Array<Dipdup_Token_Metadata>
  /** An array relationship */
  events: Array<Events>
  /** An aggregate relationship */
  events_aggregate: Events_Aggregate
  /** fetch data from the table: "events" using primary key columns */
  events_by_pk?: Maybe<Events>
  /** An array relationship */
  holdings: Array<Holdings>
  /** An aggregate relationship */
  holdings_aggregate: Holdings_Aggregate
  /** fetch data from the table: "holdings" using primary key columns */
  holdings_by_pk?: Maybe<Holdings>
  /** An array relationship */
  listings: Array<Listings>
  /** An aggregate relationship */
  listings_aggregate: Listings_Aggregate
  /** An array relationship */
  offers: Array<Offers>
  /** An aggregate relationship */
  offers_aggregate: Offers_Aggregate
  /** An array relationship */
  royalty_receivers: Array<Royalty_Receivers>
  /** fetch data from the table: "royalty_receivers" using primary key columns */
  royalty_receivers_by_pk?: Maybe<Royalty_Receivers>
  /** An array relationship */
  tags: Array<Tags>
  /** fetch data from the table: "tags" using primary key columns */
  tags_by_pk?: Maybe<Tags>
  /** fetch data from the table: "teia_shareholders" */
  teia_shareholders: Array<Teia_Shareholders>
  /** fetch data from the table: "teia_shareholders" using primary key columns */
  teia_shareholders_by_pk?: Maybe<Teia_Shareholders>
  /** fetch data from the table: "teia_signatures" */
  teia_signatures: Array<Teia_Signatures>
  /** fetch data from the table: "teia_signatures" using primary key columns */
  teia_signatures_by_pk?: Maybe<Teia_Signatures>
  /** fetch data from the table: "teia_split_contracts" */
  teia_split_contracts: Array<Teia_Split_Contracts>
  /** fetch data from the table: "teia_split_contracts" using primary key columns */
  teia_split_contracts_by_pk?: Maybe<Teia_Split_Contracts>
  /** fetch data from the table: "teia_tokens_meta" */
  teia_tokens_meta: Array<Teia_Tokens_Meta>
  /** fetch data from the table: "teia_tokens_meta" using primary key columns */
  teia_tokens_meta_by_pk?: Maybe<Teia_Tokens_Meta>
  /** fetch data from the table: "teia_users" */
  teia_users: Array<Teia_Users>
  /** fetch data from the table: "teia_users" using primary key columns */
  teia_users_by_pk?: Maybe<Teia_Users>
  /** fetch data from the table: "token_metadata" */
  token_metadata: Array<Token_Metadata>
  /** fetch data from the table: "tokens" */
  tokens: Array<Tokens>
  /** fetch aggregated fields from the table: "tokens" */
  tokens_aggregate: Tokens_Aggregate
  /** fetch data from the table: "tokens" using primary key columns */
  tokens_by_pk?: Maybe<Tokens>
  /** fetch data from the table: "tzprofiles" */
  tzprofiles: Array<Tzprofiles>
  /** fetch aggregated fields from the table: "tzprofiles" */
  tzprofiles_aggregate: Tzprofiles_Aggregate
  /** fetch data from the table: "tzprofiles" using primary key columns */
  tzprofiles_by_pk?: Maybe<Tzprofiles>
  /** fetch data from the table in a streaming manner: "tzprofiles" */
  tzprofiles_stream: Array<Tzprofiles>
}

export type Subscription_RootDipdup_ContractArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Bool_Exp>
}

export type Subscription_RootDipdup_Contract_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Bool_Exp>
}

export type Subscription_RootDipdup_Contract_By_PkArgs = {
  name: Scalars['String']
}

export type Subscription_RootDipdup_Contract_MetadataArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Metadata_Bool_Exp>
}

export type Subscription_RootDipdup_Contract_Metadata_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Contract_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Contract_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Contract_Metadata_Bool_Exp>
}

export type Subscription_RootDipdup_Contract_Metadata_By_PkArgs = {
  id: Scalars['Int']
}

export type Subscription_RootDipdup_Contract_Metadata_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Contract_Metadata_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Contract_Metadata_Bool_Exp>
}

export type Subscription_RootDipdup_Contract_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Contract_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Contract_Bool_Exp>
}

export type Subscription_RootDipdup_HeadArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Order_By>>
  where?: InputMaybe<Dipdup_Head_Bool_Exp>
}

export type Subscription_RootDipdup_Head_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Order_By>>
  where?: InputMaybe<Dipdup_Head_Bool_Exp>
}

export type Subscription_RootDipdup_Head_By_PkArgs = {
  name: Scalars['String']
}

export type Subscription_RootDipdup_Head_StatusArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Status_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Status_Order_By>>
  where?: InputMaybe<Dipdup_Head_Status_Bool_Exp>
}

export type Subscription_RootDipdup_Head_Status_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Head_Status_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Head_Status_Order_By>>
  where?: InputMaybe<Dipdup_Head_Status_Bool_Exp>
}

export type Subscription_RootDipdup_Head_Status_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Head_Status_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Head_Status_Bool_Exp>
}

export type Subscription_RootDipdup_Head_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Head_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Head_Bool_Exp>
}

export type Subscription_RootDipdup_IndexArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Index_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Index_Order_By>>
  where?: InputMaybe<Dipdup_Index_Bool_Exp>
}

export type Subscription_RootDipdup_Index_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Index_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Index_Order_By>>
  where?: InputMaybe<Dipdup_Index_Bool_Exp>
}

export type Subscription_RootDipdup_Index_By_PkArgs = {
  name: Scalars['String']
}

export type Subscription_RootDipdup_Index_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Index_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Index_Bool_Exp>
}

export type Subscription_RootDipdup_Model_UpdateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Model_Update_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Model_Update_Order_By>>
  where?: InputMaybe<Dipdup_Model_Update_Bool_Exp>
}

export type Subscription_RootDipdup_Model_Update_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Model_Update_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Model_Update_Order_By>>
  where?: InputMaybe<Dipdup_Model_Update_Bool_Exp>
}

export type Subscription_RootDipdup_Model_Update_By_PkArgs = {
  id: Scalars['Int']
}

export type Subscription_RootDipdup_Model_Update_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Model_Update_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Model_Update_Bool_Exp>
}

export type Subscription_RootDipdup_SchemaArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Schema_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Schema_Order_By>>
  where?: InputMaybe<Dipdup_Schema_Bool_Exp>
}

export type Subscription_RootDipdup_Schema_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Schema_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Schema_Order_By>>
  where?: InputMaybe<Dipdup_Schema_Bool_Exp>
}

export type Subscription_RootDipdup_Schema_By_PkArgs = {
  name: Scalars['String']
}

export type Subscription_RootDipdup_Schema_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Schema_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Schema_Bool_Exp>
}

export type Subscription_RootDipdup_Token_MetadataArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Token_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Token_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Token_Metadata_Bool_Exp>
}

export type Subscription_RootDipdup_Token_Metadata_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Dipdup_Token_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Dipdup_Token_Metadata_Order_By>>
  where?: InputMaybe<Dipdup_Token_Metadata_Bool_Exp>
}

export type Subscription_RootDipdup_Token_Metadata_By_PkArgs = {
  id: Scalars['Int']
}

export type Subscription_RootDipdup_Token_Metadata_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Dipdup_Token_Metadata_Stream_Cursor_Input>>
  where?: InputMaybe<Dipdup_Token_Metadata_Bool_Exp>
}

export type Subscription_RootEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Events_Order_By>>
  where?: InputMaybe<Events_Bool_Exp>
}

export type Subscription_RootEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Events_Order_By>>
  where?: InputMaybe<Events_Bool_Exp>
}

export type Subscription_RootEvents_By_PkArgs = {
  id: Scalars['String']
}

export type Subscription_RootHoldingsArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Holdings_Order_By>>
  where?: InputMaybe<Holdings_Bool_Exp>
}

export type Subscription_RootHoldings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Holdings_Order_By>>
  where?: InputMaybe<Holdings_Bool_Exp>
}

export type Subscription_RootHoldings_By_PkArgs = {
  fa2_address: Scalars['String']
  holder_address: Scalars['String']
  token_id: Scalars['String']
}

export type Subscription_RootListingsArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Listings_Order_By>>
  where?: InputMaybe<Listings_Bool_Exp>
}

export type Subscription_RootListings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Listings_Order_By>>
  where?: InputMaybe<Listings_Bool_Exp>
}

export type Subscription_RootOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Offers_Order_By>>
  where?: InputMaybe<Offers_Bool_Exp>
}

export type Subscription_RootOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Offers_Order_By>>
  where?: InputMaybe<Offers_Bool_Exp>
}

export type Subscription_RootRoyalty_ReceiversArgs = {
  distinct_on?: InputMaybe<Array<Royalty_Receivers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Royalty_Receivers_Order_By>>
  where?: InputMaybe<Royalty_Receivers_Bool_Exp>
}

export type Subscription_RootRoyalty_Receivers_By_PkArgs = {
  fa2_address: Scalars['String']
  receiver_address: Scalars['String']
  token_id: Scalars['String']
}

export type Subscription_RootTagsArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tags_Order_By>>
  where?: InputMaybe<Tags_Bool_Exp>
}

export type Subscription_RootTags_By_PkArgs = {
  fa2_address: Scalars['String']
  tag: Scalars['String']
  token_id: Scalars['String']
}

export type Subscription_RootTeia_ShareholdersArgs = {
  distinct_on?: InputMaybe<Array<Teia_Shareholders_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Shareholders_Order_By>>
  where?: InputMaybe<Teia_Shareholders_Bool_Exp>
}

export type Subscription_RootTeia_Shareholders_By_PkArgs = {
  contract_address: Scalars['String']
  holder_type: Scalars['String']
  shareholder_address: Scalars['String']
}

export type Subscription_RootTeia_SignaturesArgs = {
  distinct_on?: InputMaybe<Array<Teia_Signatures_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Signatures_Order_By>>
  where?: InputMaybe<Teia_Signatures_Bool_Exp>
}

export type Subscription_RootTeia_Signatures_By_PkArgs = {
  fa2_address: Scalars['String']
  shareholder_address: Scalars['String']
  token_id: Scalars['String']
}

export type Subscription_RootTeia_Split_ContractsArgs = {
  distinct_on?: InputMaybe<Array<Teia_Split_Contracts_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Split_Contracts_Order_By>>
  where?: InputMaybe<Teia_Split_Contracts_Bool_Exp>
}

export type Subscription_RootTeia_Split_Contracts_By_PkArgs = {
  contract_address: Scalars['String']
}

export type Subscription_RootTeia_Tokens_MetaArgs = {
  distinct_on?: InputMaybe<Array<Teia_Tokens_Meta_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Tokens_Meta_Order_By>>
  where?: InputMaybe<Teia_Tokens_Meta_Bool_Exp>
}

export type Subscription_RootTeia_Tokens_Meta_By_PkArgs = {
  fa2_address: Scalars['String']
  token_id: Scalars['String']
}

export type Subscription_RootTeia_UsersArgs = {
  distinct_on?: InputMaybe<Array<Teia_Users_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Users_Order_By>>
  where?: InputMaybe<Teia_Users_Bool_Exp>
}

export type Subscription_RootTeia_Users_By_PkArgs = {
  user_address: Scalars['String']
}

export type Subscription_RootToken_MetadataArgs = {
  distinct_on?: InputMaybe<Array<Token_Metadata_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Token_Metadata_Order_By>>
  where?: InputMaybe<Token_Metadata_Bool_Exp>
}

export type Subscription_RootTokensArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tokens_Order_By>>
  where?: InputMaybe<Tokens_Bool_Exp>
}

export type Subscription_RootTokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tokens_Order_By>>
  where?: InputMaybe<Tokens_Bool_Exp>
}

export type Subscription_RootTokens_By_PkArgs = {
  fa2_address: Scalars['String']
  token_id: Scalars['String']
}

export type Subscription_RootTzprofilesArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>
  where?: InputMaybe<Tzprofiles_Bool_Exp>
}

export type Subscription_RootTzprofiles_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>
  where?: InputMaybe<Tzprofiles_Bool_Exp>
}

export type Subscription_RootTzprofiles_By_PkArgs = {
  account: Scalars['String']
}

export type Subscription_RootTzprofiles_StreamArgs = {
  batch_size: Scalars['Int']
  cursor: Array<InputMaybe<Tzprofiles_Stream_Cursor_Input>>
  where?: InputMaybe<Tzprofiles_Bool_Exp>
}

/** columns and relationships of "tags" */
export type Tags = {
  __typename?: 'tags'
  fa2_address: Scalars['String']
  tag: Scalars['String']
  /** An object relationship */
  token?: Maybe<Tokens>
  token_id: Scalars['String']
}

/** order by aggregate values of table "tags" */
export type Tags_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Tags_Max_Order_By>
  min?: InputMaybe<Tags_Min_Order_By>
}

/** Boolean expression to filter rows from the table "tags". All fields are combined with a logical 'AND'. */
export type Tags_Bool_Exp = {
  _and?: InputMaybe<Array<Tags_Bool_Exp>>
  _not?: InputMaybe<Tags_Bool_Exp>
  _or?: InputMaybe<Array<Tags_Bool_Exp>>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  tag?: InputMaybe<String_Comparison_Exp>
  token?: InputMaybe<Tokens_Bool_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
}

/** order by max() on columns of table "tags" */
export type Tags_Max_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  tag?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** order by min() on columns of table "tags" */
export type Tags_Min_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  tag?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "tags". */
export type Tags_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  tag?: InputMaybe<Order_By>
  token?: InputMaybe<Tokens_Order_By>
  token_id?: InputMaybe<Order_By>
}

/** select columns of table "tags" */
export enum Tags_Select_Column {
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  Tag = 'tag',
  /** column name */
  TokenId = 'token_id',
}

/** columns and relationships of "teia_shareholders" */
export type Teia_Shareholders = {
  __typename?: 'teia_shareholders'
  contract_address: Scalars['String']
  holder_type: Scalars['String']
  shareholder_address: Scalars['String']
  /** An object relationship */
  shareholder_profile?: Maybe<Teia_Users>
  shares?: Maybe<Scalars['bigint']>
  /** An array relationship */
  signatures: Array<Teia_Signatures>
  /** An object relationship */
  split_contract?: Maybe<Teia_Split_Contracts>
}

/** columns and relationships of "teia_shareholders" */
export type Teia_ShareholdersSignaturesArgs = {
  distinct_on?: InputMaybe<Array<Teia_Signatures_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Signatures_Order_By>>
  where?: InputMaybe<Teia_Signatures_Bool_Exp>
}

/** order by aggregate values of table "teia_shareholders" */
export type Teia_Shareholders_Aggregate_Order_By = {
  avg?: InputMaybe<Teia_Shareholders_Avg_Order_By>
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Teia_Shareholders_Max_Order_By>
  min?: InputMaybe<Teia_Shareholders_Min_Order_By>
  stddev?: InputMaybe<Teia_Shareholders_Stddev_Order_By>
  stddev_pop?: InputMaybe<Teia_Shareholders_Stddev_Pop_Order_By>
  stddev_samp?: InputMaybe<Teia_Shareholders_Stddev_Samp_Order_By>
  sum?: InputMaybe<Teia_Shareholders_Sum_Order_By>
  var_pop?: InputMaybe<Teia_Shareholders_Var_Pop_Order_By>
  var_samp?: InputMaybe<Teia_Shareholders_Var_Samp_Order_By>
  variance?: InputMaybe<Teia_Shareholders_Variance_Order_By>
}

/** order by avg() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Avg_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** Boolean expression to filter rows from the table "teia_shareholders". All fields are combined with a logical 'AND'. */
export type Teia_Shareholders_Bool_Exp = {
  _and?: InputMaybe<Array<Teia_Shareholders_Bool_Exp>>
  _not?: InputMaybe<Teia_Shareholders_Bool_Exp>
  _or?: InputMaybe<Array<Teia_Shareholders_Bool_Exp>>
  contract_address?: InputMaybe<String_Comparison_Exp>
  holder_type?: InputMaybe<String_Comparison_Exp>
  shareholder_address?: InputMaybe<String_Comparison_Exp>
  shareholder_profile?: InputMaybe<Teia_Users_Bool_Exp>
  shares?: InputMaybe<Bigint_Comparison_Exp>
  signatures?: InputMaybe<Teia_Signatures_Bool_Exp>
  split_contract?: InputMaybe<Teia_Split_Contracts_Bool_Exp>
}

/** order by max() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Max_Order_By = {
  contract_address?: InputMaybe<Order_By>
  holder_type?: InputMaybe<Order_By>
  shareholder_address?: InputMaybe<Order_By>
  shares?: InputMaybe<Order_By>
}

/** order by min() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Min_Order_By = {
  contract_address?: InputMaybe<Order_By>
  holder_type?: InputMaybe<Order_By>
  shareholder_address?: InputMaybe<Order_By>
  shares?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "teia_shareholders". */
export type Teia_Shareholders_Order_By = {
  contract_address?: InputMaybe<Order_By>
  holder_type?: InputMaybe<Order_By>
  shareholder_address?: InputMaybe<Order_By>
  shareholder_profile?: InputMaybe<Teia_Users_Order_By>
  shares?: InputMaybe<Order_By>
  signatures_aggregate?: InputMaybe<Teia_Signatures_Aggregate_Order_By>
  split_contract?: InputMaybe<Teia_Split_Contracts_Order_By>
}

/** select columns of table "teia_shareholders" */
export enum Teia_Shareholders_Select_Column {
  /** column name */
  ContractAddress = 'contract_address',
  /** column name */
  HolderType = 'holder_type',
  /** column name */
  ShareholderAddress = 'shareholder_address',
  /** column name */
  Shares = 'shares',
}

/** order by stddev() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Stddev_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** order by stddev_pop() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Stddev_Pop_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** order by stddev_samp() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Stddev_Samp_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** order by sum() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Sum_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** order by var_pop() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Var_Pop_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** order by var_samp() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Var_Samp_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** order by variance() on columns of table "teia_shareholders" */
export type Teia_Shareholders_Variance_Order_By = {
  shares?: InputMaybe<Order_By>
}

/** columns and relationships of "teia_signatures" */
export type Teia_Signatures = {
  __typename?: 'teia_signatures'
  fa2_address: Scalars['String']
  shareholder_address: Scalars['String']
  token_id: Scalars['String']
}

/** order by aggregate values of table "teia_signatures" */
export type Teia_Signatures_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Teia_Signatures_Max_Order_By>
  min?: InputMaybe<Teia_Signatures_Min_Order_By>
}

/** Boolean expression to filter rows from the table "teia_signatures". All fields are combined with a logical 'AND'. */
export type Teia_Signatures_Bool_Exp = {
  _and?: InputMaybe<Array<Teia_Signatures_Bool_Exp>>
  _not?: InputMaybe<Teia_Signatures_Bool_Exp>
  _or?: InputMaybe<Array<Teia_Signatures_Bool_Exp>>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  shareholder_address?: InputMaybe<String_Comparison_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
}

/** order by max() on columns of table "teia_signatures" */
export type Teia_Signatures_Max_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  shareholder_address?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** order by min() on columns of table "teia_signatures" */
export type Teia_Signatures_Min_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  shareholder_address?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "teia_signatures". */
export type Teia_Signatures_Order_By = {
  fa2_address?: InputMaybe<Order_By>
  shareholder_address?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** select columns of table "teia_signatures" */
export enum Teia_Signatures_Select_Column {
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  ShareholderAddress = 'shareholder_address',
  /** column name */
  TokenId = 'token_id',
}

/** columns and relationships of "teia_split_contracts" */
export type Teia_Split_Contracts = {
  __typename?: 'teia_split_contracts'
  administrator_address: Scalars['String']
  contract_address: Scalars['String']
  /** An object relationship */
  contract_profile?: Maybe<Teia_Users>
  /** An array relationship */
  created_tokens: Array<Tokens>
  /** An aggregate relationship */
  created_tokens_aggregate: Tokens_Aggregate
  /** An array relationship */
  shareholders: Array<Teia_Shareholders>
  total_shares?: Maybe<Scalars['bigint']>
}

/** columns and relationships of "teia_split_contracts" */
export type Teia_Split_ContractsCreated_TokensArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tokens_Order_By>>
  where?: InputMaybe<Tokens_Bool_Exp>
}

/** columns and relationships of "teia_split_contracts" */
export type Teia_Split_ContractsCreated_Tokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tokens_Order_By>>
  where?: InputMaybe<Tokens_Bool_Exp>
}

/** columns and relationships of "teia_split_contracts" */
export type Teia_Split_ContractsShareholdersArgs = {
  distinct_on?: InputMaybe<Array<Teia_Shareholders_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Shareholders_Order_By>>
  where?: InputMaybe<Teia_Shareholders_Bool_Exp>
}

/** Boolean expression to filter rows from the table "teia_split_contracts". All fields are combined with a logical 'AND'. */
export type Teia_Split_Contracts_Bool_Exp = {
  _and?: InputMaybe<Array<Teia_Split_Contracts_Bool_Exp>>
  _not?: InputMaybe<Teia_Split_Contracts_Bool_Exp>
  _or?: InputMaybe<Array<Teia_Split_Contracts_Bool_Exp>>
  administrator_address?: InputMaybe<String_Comparison_Exp>
  contract_address?: InputMaybe<String_Comparison_Exp>
  contract_profile?: InputMaybe<Teia_Users_Bool_Exp>
  created_tokens?: InputMaybe<Tokens_Bool_Exp>
  shareholders?: InputMaybe<Teia_Shareholders_Bool_Exp>
  total_shares?: InputMaybe<Bigint_Comparison_Exp>
}

/** Ordering options when selecting data from "teia_split_contracts". */
export type Teia_Split_Contracts_Order_By = {
  administrator_address?: InputMaybe<Order_By>
  contract_address?: InputMaybe<Order_By>
  contract_profile?: InputMaybe<Teia_Users_Order_By>
  created_tokens_aggregate?: InputMaybe<Tokens_Aggregate_Order_By>
  shareholders_aggregate?: InputMaybe<Teia_Shareholders_Aggregate_Order_By>
  total_shares?: InputMaybe<Order_By>
}

/** select columns of table "teia_split_contracts" */
export enum Teia_Split_Contracts_Select_Column {
  /** column name */
  AdministratorAddress = 'administrator_address',
  /** column name */
  ContractAddress = 'contract_address',
  /** column name */
  TotalShares = 'total_shares',
}

/** columns and relationships of "teia_tokens_meta" */
export type Teia_Tokens_Meta = {
  __typename?: 'teia_tokens_meta'
  accessibility?: Maybe<Scalars['jsonb']>
  content_rating?: Maybe<Scalars['String']>
  fa2_address: Scalars['String']
  is_signed: Scalars['Boolean']
  preview_uri?: Maybe<Scalars['String']>
  token_id: Scalars['String']
}

/** columns and relationships of "teia_tokens_meta" */
export type Teia_Tokens_MetaAccessibilityArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** Boolean expression to filter rows from the table "teia_tokens_meta". All fields are combined with a logical 'AND'. */
export type Teia_Tokens_Meta_Bool_Exp = {
  _and?: InputMaybe<Array<Teia_Tokens_Meta_Bool_Exp>>
  _not?: InputMaybe<Teia_Tokens_Meta_Bool_Exp>
  _or?: InputMaybe<Array<Teia_Tokens_Meta_Bool_Exp>>
  accessibility?: InputMaybe<Jsonb_Comparison_Exp>
  content_rating?: InputMaybe<String_Comparison_Exp>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  is_signed?: InputMaybe<Boolean_Comparison_Exp>
  preview_uri?: InputMaybe<String_Comparison_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
}

/** Ordering options when selecting data from "teia_tokens_meta". */
export type Teia_Tokens_Meta_Order_By = {
  accessibility?: InputMaybe<Order_By>
  content_rating?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  is_signed?: InputMaybe<Order_By>
  preview_uri?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
}

/** select columns of table "teia_tokens_meta" */
export enum Teia_Tokens_Meta_Select_Column {
  /** column name */
  Accessibility = 'accessibility',
  /** column name */
  ContentRating = 'content_rating',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  IsSigned = 'is_signed',
  /** column name */
  PreviewUri = 'preview_uri',
  /** column name */
  TokenId = 'token_id',
}

/** columns and relationships of "teia_users" */
export type Teia_Users = {
  __typename?: 'teia_users'
  is_split?: Maybe<Scalars['Boolean']>
  /** An object relationship */
  metadata?: Maybe<Token_Metadata>
  metadata_uri?: Maybe<Scalars['String']>
  name?: Maybe<Scalars['String']>
  /** An object relationship */
  split_contract?: Maybe<Teia_Split_Contracts>
  user_address: Scalars['String']
}

/** Boolean expression to filter rows from the table "teia_users". All fields are combined with a logical 'AND'. */
export type Teia_Users_Bool_Exp = {
  _and?: InputMaybe<Array<Teia_Users_Bool_Exp>>
  _not?: InputMaybe<Teia_Users_Bool_Exp>
  _or?: InputMaybe<Array<Teia_Users_Bool_Exp>>
  is_split?: InputMaybe<Boolean_Comparison_Exp>
  metadata?: InputMaybe<Token_Metadata_Bool_Exp>
  metadata_uri?: InputMaybe<String_Comparison_Exp>
  name?: InputMaybe<String_Comparison_Exp>
  split_contract?: InputMaybe<Teia_Split_Contracts_Bool_Exp>
  user_address?: InputMaybe<String_Comparison_Exp>
}

/** Ordering options when selecting data from "teia_users". */
export type Teia_Users_Order_By = {
  is_split?: InputMaybe<Order_By>
  metadata?: InputMaybe<Token_Metadata_Order_By>
  metadata_uri?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  split_contract?: InputMaybe<Teia_Split_Contracts_Order_By>
  user_address?: InputMaybe<Order_By>
}

/** select columns of table "teia_users" */
export enum Teia_Users_Select_Column {
  /** column name */
  IsSplit = 'is_split',
  /** column name */
  MetadataUri = 'metadata_uri',
  /** column name */
  Name = 'name',
  /** column name */
  UserAddress = 'user_address',
}

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']>
  _gt?: InputMaybe<Scalars['timestamptz']>
  _gte?: InputMaybe<Scalars['timestamptz']>
  _in?: InputMaybe<Array<Scalars['timestamptz']>>
  _is_null?: InputMaybe<Scalars['Boolean']>
  _lt?: InputMaybe<Scalars['timestamptz']>
  _lte?: InputMaybe<Scalars['timestamptz']>
  _neq?: InputMaybe<Scalars['timestamptz']>
  _nin?: InputMaybe<Array<Scalars['timestamptz']>>
}

/** columns and relationships of "token_metadata" */
export type Token_Metadata = {
  __typename?: 'token_metadata'
  data?: Maybe<Scalars['jsonb']>
  status: Scalars['String']
  uri: Scalars['String']
}

/** columns and relationships of "token_metadata" */
export type Token_MetadataDataArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** Boolean expression to filter rows from the table "token_metadata". All fields are combined with a logical 'AND'. */
export type Token_Metadata_Bool_Exp = {
  _and?: InputMaybe<Array<Token_Metadata_Bool_Exp>>
  _not?: InputMaybe<Token_Metadata_Bool_Exp>
  _or?: InputMaybe<Array<Token_Metadata_Bool_Exp>>
  data?: InputMaybe<Jsonb_Comparison_Exp>
  status?: InputMaybe<String_Comparison_Exp>
  uri?: InputMaybe<String_Comparison_Exp>
}

/** Ordering options when selecting data from "token_metadata". */
export type Token_Metadata_Order_By = {
  data?: InputMaybe<Order_By>
  status?: InputMaybe<Order_By>
  uri?: InputMaybe<Order_By>
}

/** select columns of table "token_metadata" */
export enum Token_Metadata_Select_Column {
  /** column name */
  Data = 'data',
  /** column name */
  Status = 'status',
  /** column name */
  Uri = 'uri',
}

/** columns and relationships of "tokens" */
export type Tokens = {
  __typename?: 'tokens'
  artifact_metadata?: Maybe<Scalars['jsonb']>
  artifact_uri?: Maybe<Scalars['String']>
  artist_address?: Maybe<Scalars['String']>
  /** An object relationship */
  artist_profile?: Maybe<Teia_Users>
  assets?: Maybe<Scalars['jsonb']>
  attributes?: Maybe<Scalars['jsonb']>
  burned_editions?: Maybe<Scalars['bigint']>
  contributors?: Maybe<Scalars['jsonb']>
  creators?: Maybe<Scalars['jsonb']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>
  description?: Maybe<Scalars['String']>
  display_uri?: Maybe<Scalars['String']>
  editions?: Maybe<Scalars['bigint']>
  /** An array relationship */
  events: Array<Events>
  /** An aggregate relationship */
  events_aggregate: Events_Aggregate
  external_uri?: Maybe<Scalars['String']>
  fa2_address: Scalars['String']
  first_sales_price?: Maybe<Scalars['bigint']>
  formats?: Maybe<Scalars['jsonb']>
  highest_offer_price?: Maybe<Scalars['bigint']>
  highest_sales_price?: Maybe<Scalars['bigint']>
  /** An array relationship */
  holdings: Array<Holdings>
  /** An aggregate relationship */
  holdings_aggregate: Holdings_Aggregate
  is_verified_artist?: Maybe<Scalars['Boolean']>
  last_processed_event_id?: Maybe<Scalars['String']>
  last_processed_event_level?: Maybe<Scalars['bigint']>
  last_processed_event_timestamp?: Maybe<Scalars['timestamptz']>
  last_sale_at?: Maybe<Scalars['timestamptz']>
  last_sales_price?: Maybe<Scalars['bigint']>
  /** An array relationship */
  listings: Array<Listings>
  /** An aggregate relationship */
  listings_aggregate: Listings_Aggregate
  lowest_price_listing?: Maybe<Scalars['jsonb']>
  lowest_sales_price?: Maybe<Scalars['bigint']>
  metadata_status: Scalars['String']
  metadata_uri?: Maybe<Scalars['String']>
  mime_type?: Maybe<Scalars['String']>
  mint_price?: Maybe<Scalars['bigint']>
  minted_at?: Maybe<Scalars['timestamptz']>
  name?: Maybe<Scalars['String']>
  /** An array relationship */
  offers: Array<Offers>
  /** An aggregate relationship */
  offers_aggregate: Offers_Aggregate
  platform?: Maybe<Scalars['String']>
  price?: Maybe<Scalars['bigint']>
  right_uri?: Maybe<Scalars['String']>
  rights?: Maybe<Scalars['String']>
  royalties?: Maybe<Scalars['jsonb']>
  royalties_total?: Maybe<Scalars['bigint']>
  /** An array relationship */
  royalty_receivers: Array<Royalty_Receivers>
  sales_count?: Maybe<Scalars['bigint']>
  sales_volume?: Maybe<Scalars['bigint']>
  /** An array relationship */
  signatures: Array<Teia_Signatures>
  symbol?: Maybe<Scalars['String']>
  /** An array relationship */
  tags: Array<Tags>
  /** An object relationship */
  teia_meta?: Maybe<Teia_Tokens_Meta>
  thumbnail_uri?: Maybe<Scalars['String']>
  token_id: Scalars['String']
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** columns and relationships of "tokens" */
export type TokensArtifact_MetadataArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensAssetsArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensAttributesArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensContributorsArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensCreatorsArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Events_Order_By>>
  where?: InputMaybe<Events_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Events_Order_By>>
  where?: InputMaybe<Events_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensFormatsArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensHoldingsArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Holdings_Order_By>>
  where?: InputMaybe<Holdings_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensHoldings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Holdings_Order_By>>
  where?: InputMaybe<Holdings_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensListingsArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Listings_Order_By>>
  where?: InputMaybe<Listings_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensListings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Listings_Order_By>>
  where?: InputMaybe<Listings_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensLowest_Price_ListingArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Offers_Order_By>>
  where?: InputMaybe<Offers_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Offers_Order_By>>
  where?: InputMaybe<Offers_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensRoyaltiesArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tokens" */
export type TokensRoyalty_ReceiversArgs = {
  distinct_on?: InputMaybe<Array<Royalty_Receivers_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Royalty_Receivers_Order_By>>
  where?: InputMaybe<Royalty_Receivers_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensSignaturesArgs = {
  distinct_on?: InputMaybe<Array<Teia_Signatures_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Teia_Signatures_Order_By>>
  where?: InputMaybe<Teia_Signatures_Bool_Exp>
}

/** columns and relationships of "tokens" */
export type TokensTagsArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>
  limit?: InputMaybe<Scalars['Int']>
  offset?: InputMaybe<Scalars['Int']>
  order_by?: InputMaybe<Array<Tags_Order_By>>
  where?: InputMaybe<Tags_Bool_Exp>
}

/** aggregated selection of "tokens" */
export type Tokens_Aggregate = {
  __typename?: 'tokens_aggregate'
  aggregate?: Maybe<Tokens_Aggregate_Fields>
  nodes: Array<Tokens>
}

/** aggregate fields of "tokens" */
export type Tokens_Aggregate_Fields = {
  __typename?: 'tokens_aggregate_fields'
  avg?: Maybe<Tokens_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Tokens_Max_Fields>
  min?: Maybe<Tokens_Min_Fields>
  stddev?: Maybe<Tokens_Stddev_Fields>
  stddev_pop?: Maybe<Tokens_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Tokens_Stddev_Samp_Fields>
  sum?: Maybe<Tokens_Sum_Fields>
  var_pop?: Maybe<Tokens_Var_Pop_Fields>
  var_samp?: Maybe<Tokens_Var_Samp_Fields>
  variance?: Maybe<Tokens_Variance_Fields>
}

/** aggregate fields of "tokens" */
export type Tokens_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Tokens_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** order by aggregate values of table "tokens" */
export type Tokens_Aggregate_Order_By = {
  avg?: InputMaybe<Tokens_Avg_Order_By>
  count?: InputMaybe<Order_By>
  max?: InputMaybe<Tokens_Max_Order_By>
  min?: InputMaybe<Tokens_Min_Order_By>
  stddev?: InputMaybe<Tokens_Stddev_Order_By>
  stddev_pop?: InputMaybe<Tokens_Stddev_Pop_Order_By>
  stddev_samp?: InputMaybe<Tokens_Stddev_Samp_Order_By>
  sum?: InputMaybe<Tokens_Sum_Order_By>
  var_pop?: InputMaybe<Tokens_Var_Pop_Order_By>
  var_samp?: InputMaybe<Tokens_Var_Samp_Order_By>
  variance?: InputMaybe<Tokens_Variance_Order_By>
}

/** aggregate avg on columns */
export type Tokens_Avg_Fields = {
  __typename?: 'tokens_avg_fields'
  burned_editions?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  first_sales_price?: Maybe<Scalars['Float']>
  highest_offer_price?: Maybe<Scalars['Float']>
  highest_sales_price?: Maybe<Scalars['Float']>
  last_processed_event_level?: Maybe<Scalars['Float']>
  last_sales_price?: Maybe<Scalars['Float']>
  lowest_sales_price?: Maybe<Scalars['Float']>
  mint_price?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  royalties_total?: Maybe<Scalars['Float']>
  sales_count?: Maybe<Scalars['Float']>
  sales_volume?: Maybe<Scalars['Float']>
}

/** order by avg() on columns of table "tokens" */
export type Tokens_Avg_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** Boolean expression to filter rows from the table "tokens". All fields are combined with a logical 'AND'. */
export type Tokens_Bool_Exp = {
  _and?: InputMaybe<Array<Tokens_Bool_Exp>>
  _not?: InputMaybe<Tokens_Bool_Exp>
  _or?: InputMaybe<Array<Tokens_Bool_Exp>>
  artifact_metadata?: InputMaybe<Jsonb_Comparison_Exp>
  artifact_uri?: InputMaybe<String_Comparison_Exp>
  artist_address?: InputMaybe<String_Comparison_Exp>
  artist_profile?: InputMaybe<Teia_Users_Bool_Exp>
  assets?: InputMaybe<Jsonb_Comparison_Exp>
  attributes?: InputMaybe<Jsonb_Comparison_Exp>
  burned_editions?: InputMaybe<Bigint_Comparison_Exp>
  contributors?: InputMaybe<Jsonb_Comparison_Exp>
  creators?: InputMaybe<Jsonb_Comparison_Exp>
  current_price_to_first_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>
  current_price_to_first_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>
  current_price_to_highest_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>
  current_price_to_highest_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>
  current_price_to_last_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>
  current_price_to_last_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>
  description?: InputMaybe<String_Comparison_Exp>
  display_uri?: InputMaybe<String_Comparison_Exp>
  editions?: InputMaybe<Bigint_Comparison_Exp>
  events?: InputMaybe<Events_Bool_Exp>
  external_uri?: InputMaybe<String_Comparison_Exp>
  fa2_address?: InputMaybe<String_Comparison_Exp>
  first_sales_price?: InputMaybe<Bigint_Comparison_Exp>
  formats?: InputMaybe<Jsonb_Comparison_Exp>
  highest_offer_price?: InputMaybe<Bigint_Comparison_Exp>
  highest_sales_price?: InputMaybe<Bigint_Comparison_Exp>
  holdings?: InputMaybe<Holdings_Bool_Exp>
  is_verified_artist?: InputMaybe<Boolean_Comparison_Exp>
  last_processed_event_id?: InputMaybe<String_Comparison_Exp>
  last_processed_event_level?: InputMaybe<Bigint_Comparison_Exp>
  last_processed_event_timestamp?: InputMaybe<Timestamptz_Comparison_Exp>
  last_sale_at?: InputMaybe<Timestamptz_Comparison_Exp>
  last_sales_price?: InputMaybe<Bigint_Comparison_Exp>
  listings?: InputMaybe<Listings_Bool_Exp>
  lowest_price_listing?: InputMaybe<Jsonb_Comparison_Exp>
  lowest_sales_price?: InputMaybe<Bigint_Comparison_Exp>
  metadata_status?: InputMaybe<String_Comparison_Exp>
  metadata_uri?: InputMaybe<String_Comparison_Exp>
  mime_type?: InputMaybe<String_Comparison_Exp>
  mint_price?: InputMaybe<Bigint_Comparison_Exp>
  minted_at?: InputMaybe<Timestamptz_Comparison_Exp>
  name?: InputMaybe<String_Comparison_Exp>
  offers?: InputMaybe<Offers_Bool_Exp>
  platform?: InputMaybe<String_Comparison_Exp>
  price?: InputMaybe<Bigint_Comparison_Exp>
  right_uri?: InputMaybe<String_Comparison_Exp>
  rights?: InputMaybe<String_Comparison_Exp>
  royalties?: InputMaybe<Jsonb_Comparison_Exp>
  royalties_total?: InputMaybe<Bigint_Comparison_Exp>
  royalty_receivers?: InputMaybe<Royalty_Receivers_Bool_Exp>
  sales_count?: InputMaybe<Bigint_Comparison_Exp>
  sales_volume?: InputMaybe<Bigint_Comparison_Exp>
  signatures?: InputMaybe<Teia_Signatures_Bool_Exp>
  symbol?: InputMaybe<String_Comparison_Exp>
  tags?: InputMaybe<Tags_Bool_Exp>
  teia_meta?: InputMaybe<Teia_Tokens_Meta_Bool_Exp>
  thumbnail_uri?: InputMaybe<String_Comparison_Exp>
  token_id?: InputMaybe<String_Comparison_Exp>
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>
}

/** aggregate max on columns */
export type Tokens_Max_Fields = {
  __typename?: 'tokens_max_fields'
  artifact_uri?: Maybe<Scalars['String']>
  artist_address?: Maybe<Scalars['String']>
  burned_editions?: Maybe<Scalars['bigint']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>
  description?: Maybe<Scalars['String']>
  display_uri?: Maybe<Scalars['String']>
  editions?: Maybe<Scalars['bigint']>
  external_uri?: Maybe<Scalars['String']>
  fa2_address?: Maybe<Scalars['String']>
  first_sales_price?: Maybe<Scalars['bigint']>
  highest_offer_price?: Maybe<Scalars['bigint']>
  highest_sales_price?: Maybe<Scalars['bigint']>
  last_processed_event_id?: Maybe<Scalars['String']>
  last_processed_event_level?: Maybe<Scalars['bigint']>
  last_processed_event_timestamp?: Maybe<Scalars['timestamptz']>
  last_sale_at?: Maybe<Scalars['timestamptz']>
  last_sales_price?: Maybe<Scalars['bigint']>
  lowest_sales_price?: Maybe<Scalars['bigint']>
  metadata_status?: Maybe<Scalars['String']>
  metadata_uri?: Maybe<Scalars['String']>
  mime_type?: Maybe<Scalars['String']>
  mint_price?: Maybe<Scalars['bigint']>
  minted_at?: Maybe<Scalars['timestamptz']>
  name?: Maybe<Scalars['String']>
  platform?: Maybe<Scalars['String']>
  price?: Maybe<Scalars['bigint']>
  right_uri?: Maybe<Scalars['String']>
  rights?: Maybe<Scalars['String']>
  royalties_total?: Maybe<Scalars['bigint']>
  sales_count?: Maybe<Scalars['bigint']>
  sales_volume?: Maybe<Scalars['bigint']>
  symbol?: Maybe<Scalars['String']>
  thumbnail_uri?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** order by max() on columns of table "tokens" */
export type Tokens_Max_Order_By = {
  artifact_uri?: InputMaybe<Order_By>
  artist_address?: InputMaybe<Order_By>
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  description?: InputMaybe<Order_By>
  display_uri?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  external_uri?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_id?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_processed_event_timestamp?: InputMaybe<Order_By>
  last_sale_at?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  metadata_status?: InputMaybe<Order_By>
  metadata_uri?: InputMaybe<Order_By>
  mime_type?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  minted_at?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  platform?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  right_uri?: InputMaybe<Order_By>
  rights?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
  symbol?: InputMaybe<Order_By>
  thumbnail_uri?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** aggregate min on columns */
export type Tokens_Min_Fields = {
  __typename?: 'tokens_min_fields'
  artifact_uri?: Maybe<Scalars['String']>
  artist_address?: Maybe<Scalars['String']>
  burned_editions?: Maybe<Scalars['bigint']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>
  description?: Maybe<Scalars['String']>
  display_uri?: Maybe<Scalars['String']>
  editions?: Maybe<Scalars['bigint']>
  external_uri?: Maybe<Scalars['String']>
  fa2_address?: Maybe<Scalars['String']>
  first_sales_price?: Maybe<Scalars['bigint']>
  highest_offer_price?: Maybe<Scalars['bigint']>
  highest_sales_price?: Maybe<Scalars['bigint']>
  last_processed_event_id?: Maybe<Scalars['String']>
  last_processed_event_level?: Maybe<Scalars['bigint']>
  last_processed_event_timestamp?: Maybe<Scalars['timestamptz']>
  last_sale_at?: Maybe<Scalars['timestamptz']>
  last_sales_price?: Maybe<Scalars['bigint']>
  lowest_sales_price?: Maybe<Scalars['bigint']>
  metadata_status?: Maybe<Scalars['String']>
  metadata_uri?: Maybe<Scalars['String']>
  mime_type?: Maybe<Scalars['String']>
  mint_price?: Maybe<Scalars['bigint']>
  minted_at?: Maybe<Scalars['timestamptz']>
  name?: Maybe<Scalars['String']>
  platform?: Maybe<Scalars['String']>
  price?: Maybe<Scalars['bigint']>
  right_uri?: Maybe<Scalars['String']>
  rights?: Maybe<Scalars['String']>
  royalties_total?: Maybe<Scalars['bigint']>
  sales_count?: Maybe<Scalars['bigint']>
  sales_volume?: Maybe<Scalars['bigint']>
  symbol?: Maybe<Scalars['String']>
  thumbnail_uri?: Maybe<Scalars['String']>
  token_id?: Maybe<Scalars['String']>
  updated_at?: Maybe<Scalars['timestamptz']>
}

/** order by min() on columns of table "tokens" */
export type Tokens_Min_Order_By = {
  artifact_uri?: InputMaybe<Order_By>
  artist_address?: InputMaybe<Order_By>
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  description?: InputMaybe<Order_By>
  display_uri?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  external_uri?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_id?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_processed_event_timestamp?: InputMaybe<Order_By>
  last_sale_at?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  metadata_status?: InputMaybe<Order_By>
  metadata_uri?: InputMaybe<Order_By>
  mime_type?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  minted_at?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  platform?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  right_uri?: InputMaybe<Order_By>
  rights?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
  symbol?: InputMaybe<Order_By>
  thumbnail_uri?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** Ordering options when selecting data from "tokens". */
export type Tokens_Order_By = {
  artifact_metadata?: InputMaybe<Order_By>
  artifact_uri?: InputMaybe<Order_By>
  artist_address?: InputMaybe<Order_By>
  artist_profile?: InputMaybe<Teia_Users_Order_By>
  assets?: InputMaybe<Order_By>
  attributes?: InputMaybe<Order_By>
  burned_editions?: InputMaybe<Order_By>
  contributors?: InputMaybe<Order_By>
  creators?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  description?: InputMaybe<Order_By>
  display_uri?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  events_aggregate?: InputMaybe<Events_Aggregate_Order_By>
  external_uri?: InputMaybe<Order_By>
  fa2_address?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  formats?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  holdings_aggregate?: InputMaybe<Holdings_Aggregate_Order_By>
  is_verified_artist?: InputMaybe<Order_By>
  last_processed_event_id?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_processed_event_timestamp?: InputMaybe<Order_By>
  last_sale_at?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  listings_aggregate?: InputMaybe<Listings_Aggregate_Order_By>
  lowest_price_listing?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  metadata_status?: InputMaybe<Order_By>
  metadata_uri?: InputMaybe<Order_By>
  mime_type?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  minted_at?: InputMaybe<Order_By>
  name?: InputMaybe<Order_By>
  offers_aggregate?: InputMaybe<Offers_Aggregate_Order_By>
  platform?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  right_uri?: InputMaybe<Order_By>
  rights?: InputMaybe<Order_By>
  royalties?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  royalty_receivers_aggregate?: InputMaybe<Royalty_Receivers_Aggregate_Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
  signatures_aggregate?: InputMaybe<Teia_Signatures_Aggregate_Order_By>
  symbol?: InputMaybe<Order_By>
  tags_aggregate?: InputMaybe<Tags_Aggregate_Order_By>
  teia_meta?: InputMaybe<Teia_Tokens_Meta_Order_By>
  thumbnail_uri?: InputMaybe<Order_By>
  token_id?: InputMaybe<Order_By>
  updated_at?: InputMaybe<Order_By>
}

/** select columns of table "tokens" */
export enum Tokens_Select_Column {
  /** column name */
  ArtifactMetadata = 'artifact_metadata',
  /** column name */
  ArtifactUri = 'artifact_uri',
  /** column name */
  ArtistAddress = 'artist_address',
  /** column name */
  Assets = 'assets',
  /** column name */
  Attributes = 'attributes',
  /** column name */
  BurnedEditions = 'burned_editions',
  /** column name */
  Contributors = 'contributors',
  /** column name */
  Creators = 'creators',
  /** column name */
  CurrentPriceToFirstSalesPriceDiff = 'current_price_to_first_sales_price_diff',
  /** column name */
  CurrentPriceToFirstSalesPricePct = 'current_price_to_first_sales_price_pct',
  /** column name */
  CurrentPriceToHighestSalesPriceDiff = 'current_price_to_highest_sales_price_diff',
  /** column name */
  CurrentPriceToHighestSalesPricePct = 'current_price_to_highest_sales_price_pct',
  /** column name */
  CurrentPriceToLastSalesPriceDiff = 'current_price_to_last_sales_price_diff',
  /** column name */
  CurrentPriceToLastSalesPricePct = 'current_price_to_last_sales_price_pct',
  /** column name */
  CurrentPriceToLowestSalesPriceDiff = 'current_price_to_lowest_sales_price_diff',
  /** column name */
  CurrentPriceToLowestSalesPricePct = 'current_price_to_lowest_sales_price_pct',
  /** column name */
  Description = 'description',
  /** column name */
  DisplayUri = 'display_uri',
  /** column name */
  Editions = 'editions',
  /** column name */
  ExternalUri = 'external_uri',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  FirstSalesPrice = 'first_sales_price',
  /** column name */
  Formats = 'formats',
  /** column name */
  HighestOfferPrice = 'highest_offer_price',
  /** column name */
  HighestSalesPrice = 'highest_sales_price',
  /** column name */
  IsVerifiedArtist = 'is_verified_artist',
  /** column name */
  LastProcessedEventId = 'last_processed_event_id',
  /** column name */
  LastProcessedEventLevel = 'last_processed_event_level',
  /** column name */
  LastProcessedEventTimestamp = 'last_processed_event_timestamp',
  /** column name */
  LastSaleAt = 'last_sale_at',
  /** column name */
  LastSalesPrice = 'last_sales_price',
  /** column name */
  LowestPriceListing = 'lowest_price_listing',
  /** column name */
  LowestSalesPrice = 'lowest_sales_price',
  /** column name */
  MetadataStatus = 'metadata_status',
  /** column name */
  MetadataUri = 'metadata_uri',
  /** column name */
  MimeType = 'mime_type',
  /** column name */
  MintPrice = 'mint_price',
  /** column name */
  MintedAt = 'minted_at',
  /** column name */
  Name = 'name',
  /** column name */
  Platform = 'platform',
  /** column name */
  Price = 'price',
  /** column name */
  RightUri = 'right_uri',
  /** column name */
  Rights = 'rights',
  /** column name */
  Royalties = 'royalties',
  /** column name */
  RoyaltiesTotal = 'royalties_total',
  /** column name */
  SalesCount = 'sales_count',
  /** column name */
  SalesVolume = 'sales_volume',
  /** column name */
  Symbol = 'symbol',
  /** column name */
  ThumbnailUri = 'thumbnail_uri',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  UpdatedAt = 'updated_at',
}

/** aggregate stddev on columns */
export type Tokens_Stddev_Fields = {
  __typename?: 'tokens_stddev_fields'
  burned_editions?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  first_sales_price?: Maybe<Scalars['Float']>
  highest_offer_price?: Maybe<Scalars['Float']>
  highest_sales_price?: Maybe<Scalars['Float']>
  last_processed_event_level?: Maybe<Scalars['Float']>
  last_sales_price?: Maybe<Scalars['Float']>
  lowest_sales_price?: Maybe<Scalars['Float']>
  mint_price?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  royalties_total?: Maybe<Scalars['Float']>
  sales_count?: Maybe<Scalars['Float']>
  sales_volume?: Maybe<Scalars['Float']>
}

/** order by stddev() on columns of table "tokens" */
export type Tokens_Stddev_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** aggregate stddev_pop on columns */
export type Tokens_Stddev_Pop_Fields = {
  __typename?: 'tokens_stddev_pop_fields'
  burned_editions?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  first_sales_price?: Maybe<Scalars['Float']>
  highest_offer_price?: Maybe<Scalars['Float']>
  highest_sales_price?: Maybe<Scalars['Float']>
  last_processed_event_level?: Maybe<Scalars['Float']>
  last_sales_price?: Maybe<Scalars['Float']>
  lowest_sales_price?: Maybe<Scalars['Float']>
  mint_price?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  royalties_total?: Maybe<Scalars['Float']>
  sales_count?: Maybe<Scalars['Float']>
  sales_volume?: Maybe<Scalars['Float']>
}

/** order by stddev_pop() on columns of table "tokens" */
export type Tokens_Stddev_Pop_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** aggregate stddev_samp on columns */
export type Tokens_Stddev_Samp_Fields = {
  __typename?: 'tokens_stddev_samp_fields'
  burned_editions?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  first_sales_price?: Maybe<Scalars['Float']>
  highest_offer_price?: Maybe<Scalars['Float']>
  highest_sales_price?: Maybe<Scalars['Float']>
  last_processed_event_level?: Maybe<Scalars['Float']>
  last_sales_price?: Maybe<Scalars['Float']>
  lowest_sales_price?: Maybe<Scalars['Float']>
  mint_price?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  royalties_total?: Maybe<Scalars['Float']>
  sales_count?: Maybe<Scalars['Float']>
  sales_volume?: Maybe<Scalars['Float']>
}

/** order by stddev_samp() on columns of table "tokens" */
export type Tokens_Stddev_Samp_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** aggregate sum on columns */
export type Tokens_Sum_Fields = {
  __typename?: 'tokens_sum_fields'
  burned_editions?: Maybe<Scalars['bigint']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>
  editions?: Maybe<Scalars['bigint']>
  first_sales_price?: Maybe<Scalars['bigint']>
  highest_offer_price?: Maybe<Scalars['bigint']>
  highest_sales_price?: Maybe<Scalars['bigint']>
  last_processed_event_level?: Maybe<Scalars['bigint']>
  last_sales_price?: Maybe<Scalars['bigint']>
  lowest_sales_price?: Maybe<Scalars['bigint']>
  mint_price?: Maybe<Scalars['bigint']>
  price?: Maybe<Scalars['bigint']>
  royalties_total?: Maybe<Scalars['bigint']>
  sales_count?: Maybe<Scalars['bigint']>
  sales_volume?: Maybe<Scalars['bigint']>
}

/** order by sum() on columns of table "tokens" */
export type Tokens_Sum_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** aggregate var_pop on columns */
export type Tokens_Var_Pop_Fields = {
  __typename?: 'tokens_var_pop_fields'
  burned_editions?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  first_sales_price?: Maybe<Scalars['Float']>
  highest_offer_price?: Maybe<Scalars['Float']>
  highest_sales_price?: Maybe<Scalars['Float']>
  last_processed_event_level?: Maybe<Scalars['Float']>
  last_sales_price?: Maybe<Scalars['Float']>
  lowest_sales_price?: Maybe<Scalars['Float']>
  mint_price?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  royalties_total?: Maybe<Scalars['Float']>
  sales_count?: Maybe<Scalars['Float']>
  sales_volume?: Maybe<Scalars['Float']>
}

/** order by var_pop() on columns of table "tokens" */
export type Tokens_Var_Pop_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** aggregate var_samp on columns */
export type Tokens_Var_Samp_Fields = {
  __typename?: 'tokens_var_samp_fields'
  burned_editions?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  first_sales_price?: Maybe<Scalars['Float']>
  highest_offer_price?: Maybe<Scalars['Float']>
  highest_sales_price?: Maybe<Scalars['Float']>
  last_processed_event_level?: Maybe<Scalars['Float']>
  last_sales_price?: Maybe<Scalars['Float']>
  lowest_sales_price?: Maybe<Scalars['Float']>
  mint_price?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  royalties_total?: Maybe<Scalars['Float']>
  sales_count?: Maybe<Scalars['Float']>
  sales_volume?: Maybe<Scalars['Float']>
}

/** order by var_samp() on columns of table "tokens" */
export type Tokens_Var_Samp_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** aggregate variance on columns */
export type Tokens_Variance_Fields = {
  __typename?: 'tokens_variance_fields'
  burned_editions?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>
  editions?: Maybe<Scalars['Float']>
  first_sales_price?: Maybe<Scalars['Float']>
  highest_offer_price?: Maybe<Scalars['Float']>
  highest_sales_price?: Maybe<Scalars['Float']>
  last_processed_event_level?: Maybe<Scalars['Float']>
  last_sales_price?: Maybe<Scalars['Float']>
  lowest_sales_price?: Maybe<Scalars['Float']>
  mint_price?: Maybe<Scalars['Float']>
  price?: Maybe<Scalars['Float']>
  royalties_total?: Maybe<Scalars['Float']>
  sales_count?: Maybe<Scalars['Float']>
  sales_volume?: Maybe<Scalars['Float']>
}

/** order by variance() on columns of table "tokens" */
export type Tokens_Variance_Order_By = {
  burned_editions?: InputMaybe<Order_By>
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>
  editions?: InputMaybe<Order_By>
  first_sales_price?: InputMaybe<Order_By>
  highest_offer_price?: InputMaybe<Order_By>
  highest_sales_price?: InputMaybe<Order_By>
  last_processed_event_level?: InputMaybe<Order_By>
  last_sales_price?: InputMaybe<Order_By>
  lowest_sales_price?: InputMaybe<Order_By>
  mint_price?: InputMaybe<Order_By>
  price?: InputMaybe<Order_By>
  royalties_total?: InputMaybe<Order_By>
  sales_count?: InputMaybe<Order_By>
  sales_volume?: InputMaybe<Order_By>
}

/** columns and relationships of "tzprofiles" */
export type Tzprofiles = {
  __typename?: 'tzprofiles'
  account: Scalars['String']
  alias?: Maybe<Scalars['String']>
  contract: Scalars['String']
  description?: Maybe<Scalars['String']>
  discord?: Maybe<Scalars['String']>
  domain_name?: Maybe<Scalars['String']>
  ethereum?: Maybe<Scalars['String']>
  failed: Scalars['Boolean']
  github?: Maybe<Scalars['String']>
  invalid_claims: Scalars['jsonb']
  logo?: Maybe<Scalars['String']>
  resolved: Scalars['Boolean']
  twitter?: Maybe<Scalars['String']>
  unprocessed_claims: Scalars['jsonb']
  valid_claims: Scalars['jsonb']
  website?: Maybe<Scalars['String']>
}

/** columns and relationships of "tzprofiles" */
export type TzprofilesInvalid_ClaimsArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tzprofiles" */
export type TzprofilesUnprocessed_ClaimsArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** columns and relationships of "tzprofiles" */
export type TzprofilesValid_ClaimsArgs = {
  path?: InputMaybe<Scalars['String']>
}

/** aggregated selection of "tzprofiles" */
export type Tzprofiles_Aggregate = {
  __typename?: 'tzprofiles_aggregate'
  aggregate?: Maybe<Tzprofiles_Aggregate_Fields>
  nodes: Array<Tzprofiles>
}

/** aggregate fields of "tzprofiles" */
export type Tzprofiles_Aggregate_Fields = {
  __typename?: 'tzprofiles_aggregate_fields'
  count: Scalars['Int']
  max?: Maybe<Tzprofiles_Max_Fields>
  min?: Maybe<Tzprofiles_Min_Fields>
}

/** aggregate fields of "tzprofiles" */
export type Tzprofiles_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Tzprofiles_Select_Column>>
  distinct?: InputMaybe<Scalars['Boolean']>
}

/** Boolean expression to filter rows from the table "tzprofiles". All fields are combined with a logical 'AND'. */
export type Tzprofiles_Bool_Exp = {
  _and?: InputMaybe<Array<Tzprofiles_Bool_Exp>>
  _not?: InputMaybe<Tzprofiles_Bool_Exp>
  _or?: InputMaybe<Array<Tzprofiles_Bool_Exp>>
  account?: InputMaybe<String_Comparison_Exp>
  alias?: InputMaybe<String_Comparison_Exp>
  contract?: InputMaybe<String_Comparison_Exp>
  description?: InputMaybe<String_Comparison_Exp>
  discord?: InputMaybe<String_Comparison_Exp>
  domain_name?: InputMaybe<String_Comparison_Exp>
  ethereum?: InputMaybe<String_Comparison_Exp>
  failed?: InputMaybe<Boolean_Comparison_Exp>
  github?: InputMaybe<String_Comparison_Exp>
  invalid_claims?: InputMaybe<Jsonb_Comparison_Exp>
  logo?: InputMaybe<String_Comparison_Exp>
  resolved?: InputMaybe<Boolean_Comparison_Exp>
  twitter?: InputMaybe<String_Comparison_Exp>
  unprocessed_claims?: InputMaybe<Jsonb_Comparison_Exp>
  valid_claims?: InputMaybe<Jsonb_Comparison_Exp>
  website?: InputMaybe<String_Comparison_Exp>
}

/** aggregate max on columns */
export type Tzprofiles_Max_Fields = {
  __typename?: 'tzprofiles_max_fields'
  account?: Maybe<Scalars['String']>
  alias?: Maybe<Scalars['String']>
  contract?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  discord?: Maybe<Scalars['String']>
  domain_name?: Maybe<Scalars['String']>
  ethereum?: Maybe<Scalars['String']>
  github?: Maybe<Scalars['String']>
  logo?: Maybe<Scalars['String']>
  twitter?: Maybe<Scalars['String']>
  website?: Maybe<Scalars['String']>
}

/** aggregate min on columns */
export type Tzprofiles_Min_Fields = {
  __typename?: 'tzprofiles_min_fields'
  account?: Maybe<Scalars['String']>
  alias?: Maybe<Scalars['String']>
  contract?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  discord?: Maybe<Scalars['String']>
  domain_name?: Maybe<Scalars['String']>
  ethereum?: Maybe<Scalars['String']>
  github?: Maybe<Scalars['String']>
  logo?: Maybe<Scalars['String']>
  twitter?: Maybe<Scalars['String']>
  website?: Maybe<Scalars['String']>
}

/** Ordering options when selecting data from "tzprofiles". */
export type Tzprofiles_Order_By = {
  account?: InputMaybe<Order_By>
  alias?: InputMaybe<Order_By>
  contract?: InputMaybe<Order_By>
  description?: InputMaybe<Order_By>
  discord?: InputMaybe<Order_By>
  domain_name?: InputMaybe<Order_By>
  ethereum?: InputMaybe<Order_By>
  failed?: InputMaybe<Order_By>
  github?: InputMaybe<Order_By>
  invalid_claims?: InputMaybe<Order_By>
  logo?: InputMaybe<Order_By>
  resolved?: InputMaybe<Order_By>
  twitter?: InputMaybe<Order_By>
  unprocessed_claims?: InputMaybe<Order_By>
  valid_claims?: InputMaybe<Order_By>
  website?: InputMaybe<Order_By>
}

/** select columns of table "tzprofiles" */
export enum Tzprofiles_Select_Column {
  /** column name */
  Account = 'account',
  /** column name */
  Alias = 'alias',
  /** column name */
  Contract = 'contract',
  /** column name */
  Description = 'description',
  /** column name */
  Discord = 'discord',
  /** column name */
  DomainName = 'domain_name',
  /** column name */
  Ethereum = 'ethereum',
  /** column name */
  Failed = 'failed',
  /** column name */
  Github = 'github',
  /** column name */
  InvalidClaims = 'invalid_claims',
  /** column name */
  Logo = 'logo',
  /** column name */
  Resolved = 'resolved',
  /** column name */
  Twitter = 'twitter',
  /** column name */
  UnprocessedClaims = 'unprocessed_claims',
  /** column name */
  ValidClaims = 'valid_claims',
  /** column name */
  Website = 'website',
}

/** Streaming cursor of the table "tzprofiles" */
export type Tzprofiles_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Tzprofiles_Stream_Cursor_Value_Input
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>
}

/** Initial value of the column from where the streaming should start */
export type Tzprofiles_Stream_Cursor_Value_Input = {
  account?: InputMaybe<Scalars['String']>
  alias?: InputMaybe<Scalars['String']>
  contract?: InputMaybe<Scalars['String']>
  description?: InputMaybe<Scalars['String']>
  discord?: InputMaybe<Scalars['String']>
  domain_name?: InputMaybe<Scalars['String']>
  ethereum?: InputMaybe<Scalars['String']>
  failed?: InputMaybe<Scalars['Boolean']>
  github?: InputMaybe<Scalars['String']>
  invalid_claims?: InputMaybe<Scalars['jsonb']>
  logo?: InputMaybe<Scalars['String']>
  resolved?: InputMaybe<Scalars['Boolean']>
  twitter?: InputMaybe<Scalars['String']>
  unprocessed_claims?: InputMaybe<Scalars['jsonb']>
  valid_claims?: InputMaybe<Scalars['jsonb']>
  website?: InputMaybe<Scalars['String']>
}

export type BaseTokenFieldsFragment = {
  __typename?: 'tokens'
  artifact_uri?: string | null
  display_uri?: string | null
  thumbnail_uri?: string | null
  metadata_uri?: string | null
  artist_address?: string | null
  description?: string | null
  editions?: any | null
  fa2_address: string
  mime_type?: string | null
  minted_at?: any | null
  metadata_status: string
  name?: string | null
  price?: any | null
  royalties?: any | null
  royalties_total?: any | null
  token_id: string
  artist_profile?: {
    __typename?: 'teia_users'
    name?: string | null
    is_split?: boolean | null
  } | null
  listings: Array<{
    __typename?: 'listings'
    amount: any
    amount_left: any
    contract_address: string
    price: any
    status: string
    type: string
  }>
  royalty_receivers: Array<{
    __typename?: 'royalty_receivers'
    receiver_address: string
    royalties: any
  }>
  teia_meta?: {
    __typename?: 'teia_tokens_meta'
    accessibility?: any | null
    content_rating?: string | null
    is_signed: boolean
    preview_uri?: string | null
  } | null
}

export type BaseTokenFieldsFragmentVariables = Exact<{ [key: string]: never }>

export type ObjktQueryVariables = Exact<{
  id: Scalars['String']
}>

export type ObjktQuery = {
  __typename?: 'query_root'
  tokens_by_pk?: {
    __typename?: 'tokens'
    rights?: string | null
    right_uri?: string | null
    artifact_uri?: string | null
    display_uri?: string | null
    thumbnail_uri?: string | null
    metadata_uri?: string | null
    artist_address?: string | null
    description?: string | null
    editions?: any | null
    fa2_address: string
    mime_type?: string | null
    minted_at?: any | null
    metadata_status: string
    name?: string | null
    price?: any | null
    royalties?: any | null
    royalties_total?: any | null
    token_id: string
    artist_profile?: {
      __typename?: 'teia_users'
      name?: string | null
      is_split?: boolean | null
      split_contract?: {
        __typename?: 'teia_split_contracts'
        administrator_address: string
        shareholders: Array<{
          __typename?: 'teia_shareholders'
          shareholder_address: string
          holder_type: string
          shares?: any | null
          shareholder_profile?: {
            __typename?: 'teia_users'
            user_address: string
            name?: string | null
          } | null
        }>
      } | null
    } | null
    signatures: Array<{
      __typename?: 'teia_signatures'
      shareholder_address: string
    }>
    listings: Array<{
      __typename?: 'listings'
      type: string
      contract_address: string
      amount: any
      amount_left: any
      swap_id?: any | null
      ask_id?: any | null
      offer_id?: any | null
      price: any
      start_price?: any | null
      end_price?: any | null
      seller_address: string
      status: string
      seller_profile?: {
        __typename?: 'teia_users'
        name?: string | null
      } | null
    }>
    holdings: Array<{
      __typename?: 'holdings'
      holder_address: string
      amount: any
      holder_profile?: {
        __typename?: 'teia_users'
        name?: string | null
      } | null
    }>
    tags: Array<{ __typename?: 'tags'; tag: string }>
    events: Array<{
      __typename?: 'events'
      timestamp: any
      implements?: string | null
      ophash?: string | null
      id: string
      type?: string | null
      price?: any | null
      amount?: any | null
      editions?: any | null
      seller_address?: string | null
      buyer_address?: string | null
      from_address?: string | null
      to_address?: string | null
      seller_profile?: {
        __typename?: 'teia_users'
        name?: string | null
      } | null
      buyer_profile?: { __typename?: 'teia_users'; name?: string | null } | null
      from_profile?: { __typename?: 'teia_users'; name?: string | null } | null
      to_profile?: { __typename?: 'teia_users'; name?: string | null } | null
    }>
    royalty_receivers: Array<{
      __typename?: 'royalty_receivers'
      receiver_address: string
      royalties: any
    }>
    teia_meta?: {
      __typename?: 'teia_tokens_meta'
      accessibility?: any | null
      content_rating?: string | null
      is_signed: boolean
      preview_uri?: string | null
    } | null
  } | null
}

export type UriMintedByAddressQueryVariables = Exact<{
  address: Scalars['String']
  uris?: InputMaybe<Array<Scalars['String']> | Scalars['String']>
}>

export type UriMintedByAddressQuery = {
  __typename?: 'query_root'
  tokens: Array<{
    __typename?: 'tokens'
    token_id: string
    editions?: any | null
  }>
}

export type GetCollabsForAddressQueryVariables = Exact<{
  address: Scalars['String']
}>

export type GetCollabsForAddressQuery = {
  __typename?: 'query_root'
  split_contracts: Array<{
    __typename?: 'teia_split_contracts'
    contract_address: string
    administrator_address: string
    contract_profile?: {
      __typename?: 'teia_users'
      name?: string | null
      metadata?: { __typename?: 'token_metadata'; data?: any | null } | null
    } | null
    shareholders: Array<{
      __typename?: 'teia_shareholders'
      shareholder_address: string
      shares?: any | null
      holder_type: string
      shareholder_profile?: {
        __typename?: 'teia_users'
        name?: string | null
      } | null
    }>
  }>
}

export type CollabCreationsTokensFragment = {
  __typename?: 'tokens'
  artifact_uri?: string | null
  display_uri?: string | null
  thumbnail_uri?: string | null
  metadata_uri?: string | null
  artist_address?: string | null
  description?: string | null
  editions?: any | null
  fa2_address: string
  mime_type?: string | null
  minted_at?: any | null
  metadata_status: string
  name?: string | null
  price?: any | null
  royalties?: any | null
  royalties_total?: any | null
  token_id: string
  tags: Array<{ __typename?: 'tags'; tag: string }>
  artist_profile?: {
    __typename?: 'teia_users'
    name?: string | null
    is_split?: boolean | null
  } | null
  listings: Array<{
    __typename?: 'listings'
    amount: any
    amount_left: any
    contract_address: string
    price: any
    status: string
    type: string
  }>
  royalty_receivers: Array<{
    __typename?: 'royalty_receivers'
    receiver_address: string
    royalties: any
  }>
  teia_meta?: {
    __typename?: 'teia_tokens_meta'
    accessibility?: any | null
    content_rating?: string | null
    is_signed: boolean
    preview_uri?: string | null
  } | null
}

export type CollabCreationsTokensFragmentVariables = Exact<{
  [key: string]: never
}>

export type CollabCreationsSplitFragment = {
  __typename?: 'teia_split_contracts'
  administrator_address: string
  contract_address: string
  shareholders: Array<{
    __typename?: 'teia_shareholders'
    shareholder_address: string
    holder_type: string
    shareholder_profile?: {
      __typename?: 'teia_users'
      name?: string | null
    } | null
  }>
  contract_profile?: {
    __typename?: 'teia_users'
    name?: string | null
    metadata?: { __typename?: 'token_metadata'; data?: any | null } | null
  } | null
}

export type CollabCreationsSplitFragmentVariables = Exact<{
  [key: string]: never
}>

export type CollabCreationsFromAddressQueryVariables = Exact<{
  addressOrSubjkt: Scalars['String']
}>

export type CollabCreationsFromAddressQuery = {
  __typename?: 'query_root'
  tokens: Array<{
    __typename?: 'tokens'
    artifact_uri?: string | null
    display_uri?: string | null
    thumbnail_uri?: string | null
    metadata_uri?: string | null
    artist_address?: string | null
    description?: string | null
    editions?: any | null
    fa2_address: string
    mime_type?: string | null
    minted_at?: any | null
    metadata_status: string
    name?: string | null
    price?: any | null
    royalties?: any | null
    royalties_total?: any | null
    token_id: string
    tags: Array<{ __typename?: 'tags'; tag: string }>
    artist_profile?: {
      __typename?: 'teia_users'
      name?: string | null
      is_split?: boolean | null
    } | null
    listings: Array<{
      __typename?: 'listings'
      amount: any
      amount_left: any
      contract_address: string
      price: any
      status: string
      type: string
    }>
    royalty_receivers: Array<{
      __typename?: 'royalty_receivers'
      receiver_address: string
      royalties: any
    }>
    teia_meta?: {
      __typename?: 'teia_tokens_meta'
      accessibility?: any | null
      content_rating?: string | null
      is_signed: boolean
      preview_uri?: string | null
    } | null
  }>
  split_contracts: Array<{
    __typename?: 'teia_split_contracts'
    administrator_address: string
    contract_address: string
    shareholders: Array<{
      __typename?: 'teia_shareholders'
      shareholder_address: string
      holder_type: string
      shareholder_profile?: {
        __typename?: 'teia_users'
        name?: string | null
      } | null
    }>
    contract_profile?: {
      __typename?: 'teia_users'
      name?: string | null
      metadata?: { __typename?: 'token_metadata'; data?: any | null } | null
    } | null
  }>
}

export type CollabCreationsFromNameQueryVariables = Exact<{
  addressOrSubjkt: Scalars['String']
}>

export type CollabCreationsFromNameQuery = {
  __typename?: 'query_root'
  tokens: Array<{
    __typename?: 'tokens'
    artifact_uri?: string | null
    display_uri?: string | null
    thumbnail_uri?: string | null
    metadata_uri?: string | null
    artist_address?: string | null
    description?: string | null
    editions?: any | null
    fa2_address: string
    mime_type?: string | null
    minted_at?: any | null
    metadata_status: string
    name?: string | null
    price?: any | null
    royalties?: any | null
    royalties_total?: any | null
    token_id: string
    tags: Array<{ __typename?: 'tags'; tag: string }>
    artist_profile?: {
      __typename?: 'teia_users'
      name?: string | null
      is_split?: boolean | null
    } | null
    listings: Array<{
      __typename?: 'listings'
      amount: any
      amount_left: any
      contract_address: string
      price: any
      status: string
      type: string
    }>
    royalty_receivers: Array<{
      __typename?: 'royalty_receivers'
      receiver_address: string
      royalties: any
    }>
    teia_meta?: {
      __typename?: 'teia_tokens_meta'
      accessibility?: any | null
      content_rating?: string | null
      is_signed: boolean
      preview_uri?: string | null
    } | null
  }>
  split_contracts: Array<{
    __typename?: 'teia_split_contracts'
    administrator_address: string
    contract_address: string
    shareholders: Array<{
      __typename?: 'teia_shareholders'
      shareholder_address: string
      holder_type: string
      shareholder_profile?: {
        __typename?: 'teia_users'
        name?: string | null
      } | null
    }>
    contract_profile?: {
      __typename?: 'teia_users'
      name?: string | null
      metadata?: { __typename?: 'token_metadata'; data?: any | null } | null
    } | null
  }>
}

export type UserFragmentFragment = {
  __typename?: 'teia_users'
  user_address: string
  name?: string | null
  metadata?: { __typename?: 'token_metadata'; data?: any | null } | null
}

export type UserFragmentFragmentVariables = Exact<{ [key: string]: never }>

export type UserByNameQueryVariables = Exact<{
  addressOrSubjkt: Scalars['String']
}>

export type UserByNameQuery = {
  __typename?: 'query_root'
  teia_users: Array<{
    __typename?: 'teia_users'
    user_address: string
    name?: string | null
    metadata?: { __typename?: 'token_metadata'; data?: any | null } | null
  }>
}

export type UserByAddressQueryVariables = Exact<{
  addressOrSubjkt: Scalars['String']
}>

export type UserByAddressQuery = {
  __typename?: 'query_root'
  teia_users: Array<{
    __typename?: 'teia_users'
    user_address: string
    name?: string | null
    metadata?: { __typename?: 'token_metadata'; data?: any | null } | null
  }>
}

export const BaseTokenFieldsFragmentDoc = gql`
  fragment baseTokenFields on tokens {
    artifact_uri
    display_uri
    thumbnail_uri
    metadata_uri
    artist_address
    artist_profile {
      name
      is_split
    }
    description
    editions
    fa2_address
    listings(where: { status: { _eq: "active" } }, order_by: { price: asc }) {
      amount
      amount_left
      contract_address
      price
      status
      type
    }
    mime_type
    minted_at
    metadata_status
    name
    price
    royalties
    royalties_total
    royalty_receivers {
      receiver_address
      royalties
    }
    teia_meta {
      accessibility
      content_rating
      is_signed
      preview_uri
    }
    token_id
  }
`
export const CollabCreationsTokensFragmentDoc = gql`
  fragment collabCreationsTokens on tokens {
    ...baseTokenFields
    tags {
      tag
    }
  }
  ${BaseTokenFieldsFragmentDoc}
`
export const CollabCreationsSplitFragmentDoc = gql`
  fragment collabCreationsSplit on teia_split_contracts {
    administrator_address
    shareholders {
      shareholder_address
      shareholder_profile {
        name
      }
      holder_type
    }
    contract_address
    contract_profile {
      name
      metadata {
        data
      }
    }
  }
`
export const UserFragmentFragmentDoc = gql`
  fragment userFragment on teia_users {
    user_address
    name
    metadata {
      data
    }
  }
`
export const ObjktDocument = gql`
  query objkt($id: String!) {
    tokens_by_pk(
      fa2_address: "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton"
      token_id: $id
    ) {
      ...baseTokenFields
      artist_profile {
        name
        is_split
        split_contract {
          administrator_address
          shareholders {
            shareholder_address
            shareholder_profile {
              user_address
              name
            }
            holder_type
            shares
          }
        }
      }
      signatures {
        shareholder_address
      }
      rights
      right_uri
      listings(where: { status: { _eq: "active" } }, order_by: { price: asc }) {
        type
        contract_address
        amount
        amount_left
        swap_id
        ask_id
        offer_id
        price
        start_price
        end_price
        seller_address
        seller_profile {
          name
        }
        status
      }
      holdings(where: { amount: { _gt: "0" } }) {
        holder_address
        amount
        holder_profile {
          name
        }
      }
      tags {
        tag
      }
      events(
        where: {
          _or: [
            { implements: { _eq: "SALE" } }
            {
              type: {
                _in: [
                  "HEN_MINT"
                  "TEIA_SWAP"
                  "HEN_SWAP"
                  "HEN_SWAP_V2"
                  "VERSUM_SWAP"
                  "FA2_TRANSFER"
                ]
              }
            }
          ]
        }
        order_by: [{ level: desc }, { opid: desc }]
      ) {
        timestamp
        implements
        ophash
        id
        type
        price
        amount
        editions
        seller_address
        seller_profile {
          name
        }
        buyer_address
        buyer_profile {
          name
        }
        from_address
        from_profile {
          name
        }
        to_address
        to_profile {
          name
        }
      }
    }
  }
  ${BaseTokenFieldsFragmentDoc}
`
export const UriMintedByAddressDocument = gql`
  query uriMintedByAddress($address: String!, $uris: [String!] = "") {
    tokens(
      order_by: { minted_at: desc }
      where: {
        metadata_status: { _eq: "processed" }
        artifact_uri: { _in: $uris }
        artist_address: { _eq: $address }
      }
    ) {
      token_id
      editions
    }
  }
`
export const GetCollabsForAddressDocument = gql`
  query getCollabsForAddress($address: String!) {
    split_contracts: teia_split_contracts(
      where: {
        _or: [
          { administrator_address: { _eq: $address } }
          { shareholders: { shareholder_address: { _eq: $address } } }
        ]
      }
    ) {
      contract_address
      contract_profile {
        name
        metadata {
          data
        }
      }
      administrator_address
      shareholders {
        shareholder_address
        shareholder_profile {
          name
        }
        shares
        holder_type
      }
    }
  }
`
export const CollabCreationsFromAddressDocument = gql`
  query collabCreationsFromAddress($addressOrSubjkt: String!) {
    tokens(
      where: {
        artist_address: { _eq: $addressOrSubjkt }
        editions: { _gt: "0" }
      }
      order_by: { token_id: desc }
    ) {
      ...collabCreationsTokens
    }
    split_contracts: teia_split_contracts(
      where: { contract_address: { _eq: $addressOrSubjkt } }
    ) {
      ...collabCreationsSplit
    }
  }
  ${CollabCreationsTokensFragmentDoc}
  ${CollabCreationsSplitFragmentDoc}
`
export const CollabCreationsFromNameDocument = gql`
  query collabCreationsFromName($addressOrSubjkt: String!) {
    tokens(
      where: {
        artist_profile: { name: { _eq: $addressOrSubjkt } }
        editions: { _gt: "0" }
      }
      order_by: { token_id: desc }
    ) {
      ...collabCreationsTokens
    }
    split_contracts: teia_split_contracts(
      where: { contract_profile: { name: { _eq: $addressOrSubjkt } } }
    ) {
      ...collabCreationsSplit
    }
  }
  ${CollabCreationsTokensFragmentDoc}
  ${CollabCreationsSplitFragmentDoc}
`
export const UserByNameDocument = gql`
  query userByName($addressOrSubjkt: String!) {
    teia_users(where: { name: { _eq: $addressOrSubjkt } }) {
      ...userFragment
    }
  }
  ${UserFragmentFragmentDoc}
`
export const UserByAddressDocument = gql`
  query userByAddress($addressOrSubjkt: String!) {
    teia_users(where: { user_address: { _eq: $addressOrSubjkt } }) {
      ...userFragment
    }
  }
  ${UserFragmentFragmentDoc}
`

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action()

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    objkt(
      variables: ObjktQueryVariables,
      requestHeaders?: Dom.RequestInit['headers']
    ): Promise<ObjktQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ObjktQuery>(ObjktDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'objkt',
        'query'
      )
    },
    uriMintedByAddress(
      variables: UriMintedByAddressQueryVariables,
      requestHeaders?: Dom.RequestInit['headers']
    ): Promise<UriMintedByAddressQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UriMintedByAddressQuery>(
            UriMintedByAddressDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        'uriMintedByAddress',
        'query'
      )
    },
    getCollabsForAddress(
      variables: GetCollabsForAddressQueryVariables,
      requestHeaders?: Dom.RequestInit['headers']
    ): Promise<GetCollabsForAddressQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetCollabsForAddressQuery>(
            GetCollabsForAddressDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        'getCollabsForAddress',
        'query'
      )
    },
    collabCreationsFromAddress(
      variables: CollabCreationsFromAddressQueryVariables,
      requestHeaders?: Dom.RequestInit['headers']
    ): Promise<CollabCreationsFromAddressQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CollabCreationsFromAddressQuery>(
            CollabCreationsFromAddressDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        'collabCreationsFromAddress',
        'query'
      )
    },
    collabCreationsFromName(
      variables: CollabCreationsFromNameQueryVariables,
      requestHeaders?: Dom.RequestInit['headers']
    ): Promise<CollabCreationsFromNameQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CollabCreationsFromNameQuery>(
            CollabCreationsFromNameDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        'collabCreationsFromName',
        'query'
      )
    },
    userByName(
      variables: UserByNameQueryVariables,
      requestHeaders?: Dom.RequestInit['headers']
    ): Promise<UserByNameQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UserByNameQuery>(UserByNameDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'userByName',
        'query'
      )
    },
    userByAddress(
      variables: UserByAddressQueryVariables,
      requestHeaders?: Dom.RequestInit['headers']
    ): Promise<UserByAddressQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UserByAddressQuery>(UserByAddressDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'userByAddress',
        'query'
      )
    },
  }
}
export type Sdk = ReturnType<typeof getSdk>
export function getSdkWithHooks(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  const sdk = getSdk(client, withWrapper)
  return {
    ...sdk,
    useObjkt(
      key: SWRKeyInterface,
      variables: ObjktQueryVariables,
      config?: SWRConfigInterface<ObjktQuery, ClientError>
    ) {
      return useSWR<ObjktQuery, ClientError>(
        key,
        () => sdk.objkt(variables),
        config
      )
    },
    useUriMintedByAddress(
      key: SWRKeyInterface,
      variables: UriMintedByAddressQueryVariables,
      config?: SWRConfigInterface<UriMintedByAddressQuery, ClientError>
    ) {
      return useSWR<UriMintedByAddressQuery, ClientError>(
        key,
        () => sdk.uriMintedByAddress(variables),
        config
      )
    },
    useGetCollabsForAddress(
      key: SWRKeyInterface,
      variables: GetCollabsForAddressQueryVariables,
      config?: SWRConfigInterface<GetCollabsForAddressQuery, ClientError>
    ) {
      return useSWR<GetCollabsForAddressQuery, ClientError>(
        key,
        () => sdk.getCollabsForAddress(variables),
        config
      )
    },
    useCollabCreationsFromAddress(
      key: SWRKeyInterface,
      variables: CollabCreationsFromAddressQueryVariables,
      config?: SWRConfigInterface<CollabCreationsFromAddressQuery, ClientError>
    ) {
      return useSWR<CollabCreationsFromAddressQuery, ClientError>(
        key,
        () => sdk.collabCreationsFromAddress(variables),
        config
      )
    },
    useCollabCreationsFromName(
      key: SWRKeyInterface,
      variables: CollabCreationsFromNameQueryVariables,
      config?: SWRConfigInterface<CollabCreationsFromNameQuery, ClientError>
    ) {
      return useSWR<CollabCreationsFromNameQuery, ClientError>(
        key,
        () => sdk.collabCreationsFromName(variables),
        config
      )
    },
    useUserByName(
      key: SWRKeyInterface,
      variables: UserByNameQueryVariables,
      config?: SWRConfigInterface<UserByNameQuery, ClientError>
    ) {
      return useSWR<UserByNameQuery, ClientError>(
        key,
        () => sdk.userByName(variables),
        config
      )
    },
    useUserByAddress(
      key: SWRKeyInterface,
      variables: UserByAddressQueryVariables,
      config?: SWRConfigInterface<UserByAddressQuery, ClientError>
    ) {
      return useSWR<UserByAddressQuery, ClientError>(
        key,
        () => sdk.userByAddress(variables),
        config
      )
    },
  }
}
export type SdkWithHooks = ReturnType<typeof getSdkWithHooks>
