// src/lib/testData.ts - Mock data for test users
export const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

export const mockTodos = [
	{
		id: '10000000-0000-4000-8000-000000000001',
		title: 'Sample Todo 1',
		content: 'This is a test todo item',
		due_on: null,
		sort_order: 1,
		list_id: '20000000-0000-4000-8000-000000000001',
		completed_at: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		list: {
			id: '20000000-0000-4000-8000-000000000001',
			name: 'Test List',
			sort_order: 1,
			board: {
				id: '30000000-0000-4000-8000-000000000001',
				name: 'Test Board',
				sort_order: 1
			}
		}
	},
	{
		id: '10000000-0000-4000-8000-000000000002',
		title: 'Sample Todo 2',
		content: 'Another test todo item',
		due_on: null,
		sort_order: 2,
		list_id: '20000000-0000-4000-8000-000000000001',
		completed_at: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		list: {
			id: '20000000-0000-4000-8000-000000000001',
			name: 'Test List',
			sort_order: 1,
			board: {
				id: '30000000-0000-4000-8000-000000000001',
				name: 'Test Board',
				sort_order: 1
			}
		}
	}
];

export const mockBoards = [
	{
		id: '30000000-0000-4000-8000-000000000001',
		name: 'Test Board',
		sort_order: 1,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	}
];

export const mockLists = [
	{
		id: '20000000-0000-4000-8000-000000000001',
		name: 'Test List',
		sort_order: 1,
		board_id: '30000000-0000-4000-8000-000000000001',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	}
];

// Helper function to check if current user is a test user
export function isTestUser(session: any): boolean {
	return session?.user?.id === TEST_USER_ID || session?.isTestUser === true;
}
