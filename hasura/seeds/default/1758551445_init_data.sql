--
-- PostgreSQL database dump
--

\restrict SJIFpfUjTfx1emW8M2xXcef7D3oaCB3lvuhdGMe8Qyp8lDhwIjCCuudVk6M0hVl

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: hdb_action_log; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_cron_events; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_cron_event_invocation_logs; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_metadata; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.hdb_metadata (id, metadata, resource_version) VALUES (1, '{"sources":[{"configuration":{"connection_info":{"database_url":{"connection_parameters":{"database":"postgres","host":"postgres","password":"0SROIBPW2CkFc5DiP7Zt8W8W","port":5432,"username":"postgres"}},"isolation_level":"read-committed","use_prepared_statements":false}},"kind":"postgres","name":"default","tables":[{"delete_permissions":[{"comment":"","permission":{"filter":{"userId":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"insert_permissions":[{"comment":"","permission":{"check":{"userId":{"_eq":"X-Hasura-User-Id"}},"columns":["expires_at","provider","providerAccountId","scope","session_state","token_type","type","access_token","id_token","refresh_token","created_at","updated_at","id","userId"],"set":{"userId":"x-hasura-User-Id"}},"role":"user"}],"object_relationships":[{"name":"user","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"comment":"","permission":{"columns":["expires_at","provider","providerAccountId","scope","session_state","token_type","type","access_token","id_token","refresh_token","created_at","updated_at","id","userId"],"filter":{"userId":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"table":{"name":"accounts","schema":"public"},"update_permissions":[{"comment":"","permission":{"check":{"userId":{"_eq":"X-Hasura-User-Id"}},"columns":["access_token","expires_at","id_token","provider","providerAccountId","refresh_token","scope","session_state","token_type","type","updated_at","userId"],"filter":{}},"role":"user"}]},{"array_relationships":[{"name":"lists","using":{"foreign_key_constraint_on":{"column":"board_id","table":{"name":"lists","schema":"public"}}}}],"delete_permissions":[{"comment":"","permission":{"filter":{"user_id":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"insert_permissions":[{"comment":"","permission":{"check":{"user_id":{"_eq":"X-Hasura-User-Id"}},"columns":["sort_order","name","created_at","updated_at","id","user_id"],"set":{"user_id":"x-hasura-User-Id"}},"role":"user"}],"object_relationships":[{"name":"user","using":{"foreign_key_constraint_on":"user_id"}}],"select_permissions":[{"comment":"","permission":{"columns":["sort_order","name","created_at","updated_at","id","user_id"],"filter":{"user_id":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"table":{"name":"boards","schema":"public"},"update_permissions":[{"comment":"","permission":{"check":{"user_id":{"_eq":"X-Hasura-User-Id"}},"columns":["name","sort_order","updated_at","user_id"],"filter":{}},"role":"user"}]},{"array_relationships":[{"name":"todos","using":{"foreign_key_constraint_on":{"column":"list_id","table":{"name":"todos","schema":"public"}}}}],"delete_permissions":[{"comment":"","permission":{"filter":{"board":{"user_id":{"_eq":"X-Hasura-User-Id"}}}},"role":"user"}],"insert_permissions":[{"comment":"","permission":{"check":{},"columns":["board_id","created_at","id","name","sort_order","updated_at"]},"role":"user"}],"object_relationships":[{"name":"board","using":{"foreign_key_constraint_on":"board_id"}}],"select_permissions":[{"comment":"","permission":{"columns":["board_id","created_at","id","name","sort_order","updated_at"],"filter":{"board":{"user_id":{"_eq":"X-Hasura-User-Id"}}}},"role":"user"}],"table":{"name":"lists","schema":"public"},"update_permissions":[{"comment":"","permission":{"check":{},"columns":["board_id","name","sort_order","updated_at"],"filter":{"board":{"user_id":{"_eq":"X-Hasura-User-Id"}}}},"role":"user"}]},{"delete_permissions":[{"comment":"","permission":{"filter":{"userId":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"insert_permissions":[{"comment":"","permission":{"check":{"userId":{"_eq":"X-Hasura-User-Id"}},"columns":["created_at","expires","id","sessionToken","updated_at","userId"],"set":{"userId":"x-hasura-User-Id"}},"role":"user"}],"object_relationships":[{"name":"user","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"comment":"","permission":{"columns":["sessionToken","created_at","expires","updated_at","id","userId"],"filter":{"userId":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"table":{"name":"sessions","schema":"public"},"update_permissions":[{"comment":"","permission":{"check":{"userId":{"_eq":"X-Hasura-User-Id"}},"columns":["expires","sessionToken","updated_at","userId"],"filter":{}},"role":"user"}]},{"delete_permissions":[{"comment":"","permission":{"filter":{"user_id":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"insert_permissions":[{"comment":"","permission":{"check":{"user_id":{"_eq":"X-Hasura-User-Id"}},"columns":["completed_at","content","created_at","due_on","id","list_id","sort_order","title","updated_at","user_id"],"set":{"user_id":"x-hasura-User-Id"}},"role":"user"}],"object_relationships":[{"name":"list","using":{"foreign_key_constraint_on":"list_id"}},{"name":"user","using":{"foreign_key_constraint_on":"user_id"}}],"select_permissions":[{"comment":"","permission":{"allow_aggregations":true,"columns":["completed_at","content","created_at","due_on","id","list_id","sort_order","title","updated_at","user_id"],"filter":{"user_id":{"_eq":"X-Hasura-User-Id"}},"query_root_fields":["select","select_aggregate","select_by_pk"],"subscription_root_fields":["select","select_aggregate","select_by_pk"]},"role":"user"}],"table":{"name":"todos","schema":"public"},"update_permissions":[{"comment":"","permission":{"check":{"user_id":{"_eq":"X-Hasura-User-Id"}},"columns":["completed_at","content","due_on","list_id","sort_order","title","updated_at","user_id"],"filter":{}},"role":"user"}]},{"array_relationships":[{"name":"accounts","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"accounts","schema":"public"}}}},{"name":"boards","using":{"foreign_key_constraint_on":{"column":"user_id","table":{"name":"boards","schema":"public"}}}},{"name":"sessions","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"sessions","schema":"public"}}}},{"name":"todos","using":{"foreign_key_constraint_on":{"column":"user_id","table":{"name":"todos","schema":"public"}}}}],"delete_permissions":[{"comment":"","permission":{"filter":{"id":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"insert_permissions":[{"comment":"","permission":{"check":{"id":{"_eq":"X-Hasura-User-Id"}},"columns":["email","name","image","created_at","emailVerified","updated_at","id"]},"role":"user"}],"select_permissions":[{"comment":"","permission":{"columns":["email","name","image","created_at","emailVerified","updated_at","id"],"filter":{"id":{"_eq":"X-Hasura-User-Id"}}},"role":"user"}],"table":{"name":"users","schema":"public"},"update_permissions":[{"comment":"","permission":{"check":{"id":{"_eq":"X-Hasura-User-Id"}},"columns":["email","emailVerified","image","name","updated_at"],"filter":{}},"role":"user"}]},{"table":{"name":"verification_tokens","schema":"public"}}]}],"version":3}', 2);


--
-- Data for Name: hdb_scheduled_events; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_scheduled_event_invocation_logs; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_schema_notifications; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.hdb_schema_notifications (id, notification, resource_version, instance_id, updated_at) VALUES (1, '{"metadata":false,"remote_schemas":[],"sources":["default"],"data_connectors":[]}', 2, 'd2bb905d-da7d-4acf-82e8-2e62d151089d', '2025-09-21 14:40:46.835529+00');


--
-- Data for Name: hdb_version; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.hdb_version (hasura_uuid, version, upgraded_on, cli_state, console_state, ee_client_id, ee_client_secret) VALUES ('29203160-1c26-46fb-853a-53bedba79d73', '48', '2025-09-21 14:34:17.134234+00', '{"settings": {"migration_mode": "true"}, "migrations": {"default": {"1758364716828": false, "1758367893374": false, "1758369029329": false, "1758371035521": false, "1758371054098": false, "1758371264336": false, "1758371354575": false, "1758371402392": false, "1758371424190": false, "1758371431656": false, "1758371447419": false, "1758371461407": false, "1758441301439": false, "1758441359961": false, "1758441677360": false, "1758441758245": false, "1758441774888": false}}, "isStateCopyCompleted": true}', '{}', NULL, NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, name, email, "emailVerified", image, created_at, updated_at) VALUES ('f0e3a808-0ab6-41ba-9e07-9c729718855b', 'Kaspar L. Palgi', 'kaspar.lemmo@gmail.com', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocKzmDdzVW1pCgAlH0-a67aWmK-hEV6-mmgS_djDKcFZvhTpi6o=s96-c', '2025-09-21 14:42:00.34052+00', '2025-09-21 14:42:00.34052+00');
INSERT INTO public.users (id, name, email, "emailVerified", image, created_at, updated_at) VALUES ('166ca52b-4ecf-4d30-842f-95f97656aeb5', 'Test User', 'test@test.com', '2025-09-22 13:57:23.76+00', NULL, '2025-09-22 13:57:12.047493+00', '2025-09-22 13:57:12.047493+00');


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accounts (id, type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, "userId", created_at, updated_at) VALUES ('a78343a5-93aa-426b-a302-aedee2e4c863', 'oidc', 'google', '113863520526202023851', NULL, 'ya29.a0AQQ_BDQVZHzuTB0HsP7cMYlaLtZbV2dSrIF2ZnQ2zOkhKaQJgolydytsrHT6kWzS9Lgo10fcsvFwmQFz_SJMxRn3UHTZuWL3rlgFQ3X-4LHK8BjMogYP1fpBL4KYFxu2gRFq5eiHZAq0OKbmy8slnhrqT-pBWNmQTgAloOwrwnQN897_1-CCC7XBFJSWRB93qoWUSDAaCgYKAcISARMSFQHGX2Mig6R8dSOq6lhaSQk00YY6yg0206', 1758469318, 'bearer', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid', 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjkyN2I4ZmI2N2JiYWQ3NzQ0NWU1ZmVhNGM3MWFhOTg0NmQ3ZGRkMDEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MjIwNDE2NTYzNjgtZW9jZjQybzVrbzQya3VjbjdrcjE0Yzg3bW50bGQ4ZDAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MjIwNDE2NTYzNjgtZW9jZjQybzVrbzQya3VjbjdrcjE0Yzg3bW50bGQ4ZDAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTM4NjM1MjA1MjYyMDIwMjM4NTEiLCJlbWFpbCI6Imthc3Bhci5sZW1tb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IkhoZXJjSjZ0MEU3Q1RkRkIxTDNldnciLCJuYW1lIjoiS2FzcGFyIEwuIFBhbGdpIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0t6bURkelZXMXBDZ0FsSDAtYTY3YVdtSy1oRVY2LW1tZ1NfZGpES2NGWnZoVHBpNm89czk2LWMiLCJnaXZlbl9uYW1lIjoiS2FzcGFyIEwuIiwiZmFtaWx5X25hbWUiOiJQYWxnaSIsImlhdCI6MTc1ODQ2NTcyMCwiZXhwIjoxNzU4NDY5MzIwfQ.g8BGP1W9jJQNaL1ej81yLWB6ffuyKLW8MnVaMGrfozNJvIhVegUtVItHxWYUaYmIJBc0OK0NatJbYq_0UZyaGb1tSF0f0-DvTa1C1rglB86__YNtnB3vcnYAPmlUt4i8bFdYSFoRdMfG8QejGy7v_jMPGFWcdm6hzuJu7UDx1gofl84v1vnX5cRk-GVwHxX3kptC6HMNMBDznCl22F2hYaSPWxlD-GOxjx-jn9DlKUGCxk5LHa7pIBtJMe4zWUMRBpQvDVYXBLx0H_A2hq4qMEP58LBYHyZGavRAAzgge0PFSRgoiXOYctBKHloVlhSP1K_uSfSjW42ZJ14miohdRw', NULL, 'f0e3a808-0ab6-41ba-9e07-9c729718855b', '2025-09-21 14:42:00.355954+00', '2025-09-21 14:42:00.355954+00');


--
-- Data for Name: boards; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.boards (id, user_id, name, sort_order, created_at, updated_at) VALUES ('45caf46b-c44d-476e-b692-f1d935b5b001', '166ca52b-4ecf-4d30-842f-95f97656aeb5', 'ToDo App', 1, '2025-09-22 14:00:35.381634+00', '2025-09-22 14:09:15.890039+00');
INSERT INTO public.boards (id, user_id, name, sort_order, created_at, updated_at) VALUES ('d7afbec5-90ae-4434-9634-48e6a61724f8', 'f0e3a808-0ab6-41ba-9e07-9c729718855b', 'Kaspar''s board', 1, '2025-09-22 13:12:09.056928+00', '2025-09-22 14:14:20.034058+00');


--
-- Data for Name: lists; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lists (id, name, sort_order, created_at, updated_at, board_id) VALUES ('9d86b24a-4563-498d-b578-0b121e7a5c24', 'Doing', 1, '2025-09-22 14:01:04.78332+00', '2025-09-22 14:01:04.78332+00', '45caf46b-c44d-476e-b692-f1d935b5b001');
INSERT INTO public.lists (id, name, sort_order, created_at, updated_at, board_id) VALUES ('f3e864d9-3b8f-48f7-8896-a3ef69eaf06f', 'ToDo', 2, '2025-09-22 14:14:59.547993+00', '2025-09-22 14:15:13.312551+00', '45caf46b-c44d-476e-b692-f1d935b5b001');
INSERT INTO public.lists (id, name, sort_order, created_at, updated_at, board_id) VALUES ('799d1a11-1e6b-420a-aba8-bf334e7279a0', 'Future', 1, '2025-09-21 14:43:25.981375+00', '2025-09-22 14:17:21.651121+00', 'd7afbec5-90ae-4434-9634-48e6a61724f8');
INSERT INTO public.lists (id, name, sort_order, created_at, updated_at, board_id) VALUES ('c2d94992-b820-4e46-8162-70bd3ce571dc', 'Today', 1, '2025-09-21 14:43:20.666013+00', '2025-09-22 14:17:31.000316+00', 'd7afbec5-90ae-4434-9634-48e6a61724f8');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: todos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.todos (id, user_id, list_id, title, content, completed_at, created_at, updated_at, due_on, sort_order) VALUES ('b2ce8055-e399-4112-a150-0a9410d3194a', 'f0e3a808-0ab6-41ba-9e07-9c729718855b', 'c2d94992-b820-4e46-8162-70bd3ce571dc', 'Shopping', NULL, '2025-09-21 14:45:07.225+00', '2025-09-21 14:42:23.895727+00', '2025-09-22 14:17:48.865811+00', NULL, 3);
INSERT INTO public.todos (id, user_id, list_id, title, content, completed_at, created_at, updated_at, due_on, sort_order) VALUES ('9a5ed23e-d1b1-4f56-aa9c-35161ac4b162', 'f0e3a808-0ab6-41ba-9e07-9c729718855b', '799d1a11-1e6b-420a-aba8-bf334e7279a0', 'Go to pool with kids', NULL, NULL, '2025-09-21 14:42:29.192584+00', '2025-09-22 14:18:17.369609+00', NULL, 2);
INSERT INTO public.todos (id, user_id, list_id, title, content, completed_at, created_at, updated_at, due_on, sort_order) VALUES ('c2ce642d-0b1b-4cde-a517-8004ffe5cdbb', '166ca52b-4ecf-4d30-842f-95f97656aeb5', NULL, 'Rich text & image upload', NULL, NULL, '2025-09-22 14:19:55.705448+00', '2025-09-22 14:19:55.705448+00', NULL, 1);
INSERT INTO public.todos (id, user_id, list_id, title, content, completed_at, created_at, updated_at, due_on, sort_order) VALUES ('8280abda-bcdf-4871-a1d5-29ba6c008001', 'f0e3a808-0ab6-41ba-9e07-9c729718855b', '799d1a11-1e6b-420a-aba8-bf334e7279a0', 'Test', NULL, NULL, '2025-09-21 14:42:17.83392+00', '2025-09-22 13:12:53.831108+00', NULL, 3);
INSERT INTO public.todos (id, user_id, list_id, title, content, completed_at, created_at, updated_at, due_on, sort_order) VALUES ('5c034f7d-b22a-476d-9dc6-9af7d57db3cf', '166ca52b-4ecf-4d30-842f-95f97656aeb5', 'f3e864d9-3b8f-48f7-8896-a3ef69eaf06f', 'Tests', NULL, NULL, '2025-09-22 14:02:06.161516+00', '2025-09-22 14:16:28.466133+00', NULL, 1);
INSERT INTO public.todos (id, user_id, list_id, title, content, completed_at, created_at, updated_at, due_on, sort_order) VALUES ('ce631cbf-06c1-4ccb-8dd9-53842b532230', '166ca52b-4ecf-4d30-842f-95f97656aeb5', '9d86b24a-4563-498d-b578-0b121e7a5c24', 'Fix list view', NULL, NULL, '2025-09-22 14:16:00.858708+00', '2025-09-22 14:16:31.473005+00', NULL, 1);
INSERT INTO public.todos (id, user_id, list_id, title, content, completed_at, created_at, updated_at, due_on, sort_order) VALUES ('ab14620d-ddcc-4fca-9952-28ba4e0444a5', '166ca52b-4ecf-4d30-842f-95f97656aeb5', '9d86b24a-4563-498d-b578-0b121e7a5c24', 'Update task', NULL, NULL, '2025-09-22 14:09:39.925051+00', '2025-09-22 14:16:31.47995+00', NULL, 2);


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict SJIFpfUjTfx1emW8M2xXcef7D3oaCB3lvuhdGMe8Qyp8lDhwIjCCuudVk6M0hVl

