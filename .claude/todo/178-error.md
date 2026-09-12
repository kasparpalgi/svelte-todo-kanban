# Error

## Original Requirement

[NEVER REMOVE]

Logged in in a new browser with Google and it loaded the board but:

Failed to update settings: check constraint of an insert/update permission has failed: {"response":{"errors":[{"message":"check constraint of an insert/update permission has failed","extensions":{"path":"$","code":"permission-error"}}],"status":200,"headers":{}},"request":{"query":"\n mutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {\n update_users(where: $where, set: $set) {\n affected_rows\n returning {\n ...UserFields\n }\n }\n}\n fragment UserFields on users {\n id\n name\n username\n image\n email\n locale\n dark_mode\n settings\n default_labels\n emailVerified\n created_at\n updated_at\n}","variables":{"where":{"id":{"_eq":"3dd76df3-322a-481f-b7a6-67adf68e7b08"}},"_set":{"settings":{"tokens":{"groq":{"api_key":"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"},"github":{"username":"kasparpalgi","encrypted":"{\"encrypted\":\"a6bac7636a909ba3b149ee9c543f5a62681e82da207ca1e9d1795de0bffb47abc5224eb60277c38a\",\"iv\":\"bfb5a5c97226f10b7f4b3c4298f88d34\",\"authTag\":\"cd9df8db0e779f73aa8d986b78ec243a\"}","connectedAt":"2025-09-30T20:08:19.539Z"},"google_calendar":{"email":"kaspar.lemmo@gmail.com","encrypted":"{\"encrypted\":\"b2635996a141778718ef8a7e9e7becadb8b40bac4934d8b5c709377db27c9d519082fddbc9d51d01914ae3529565693395b4278d84315d71f68a6c751259b2194115ff4f108e337d6bf2477d124dd5affcb92f17d307e112218a6b4ded07220ff34a4270a3a6a68942cb943d12ea5dcebd72d8b7e0a8ffad6f178bef9960b5837ed5a7e5479dd371fa4c5953ce4536eeeb682e39f938e2e30c70bb793976ecf0a59eb3ae06255f411b3256ff3c81edf2779e9868231439f00710674333432073d006598fc9c9e4ca6f750cbb6c6fd26c0b6b4a6c7f9e709d40c026057c73e993a8519656193b98d5b0e588bd2bf369fcb07ced33875e46593fdf6a3791\",\"iv\":\"797c2cf7388cb4f51d5f9f06b74a9634\",\"authTag\":\"64657c415fd9eb5e66ad980ee164841d\"}","expires_at":1761585726654,"connectedAt":"2025-10-27T16:22:07.654Z","refresh_token":"{\"encrypted\":\"ded333db7fb8ae00fb4f6d2eae4290f1bb0af5cf1aee40d7f31279df0130a2b3a9fe99e4e49829b45af7e3728be802ece851f2316f9f8a6a1be11152bdb6958a8e5c19338700a96424766b2a92fd18fad784c379ceebfef9eb0ee2138f660422de82cc51ee0c83\",\"iv\":\"27cfc4f44d16ee56e05b6eb52f66735e\",\"authTag\":\"85a595cc8762371441751a847532cdb8\"}"}},"ai_model":"gpt-5-mini","viewMode":"kanban","lastBoardAlias":"todo-app","auto_ai_correct":false,"speech_provider":"groq"}}}}}

Also, can't see any other boards I have in a board switcher. See also all other errors at

_From Kanban card `f387f908-f1b8-4637-826b-109e385fc05b`._
