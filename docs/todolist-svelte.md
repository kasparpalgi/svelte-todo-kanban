# SvelteKit Todo Application Assignment

## Introduction

Create an interactive task management application that allows users to efficiently organize and track their work activities. The application will be built on the modern SvelteKit framework and will communicate with an existing REST API. Users will not only be able to create and manage tasks, but also visualize them in various ways—from a classic list to a Kanban board. In addition to a text description, each task can include visual documentation in the form of attached photos. The system will also offer advanced features such as automatic deadline tracking, task categorization, and clear visualization of work progress.

The application emphasizes:
- Intuitive user interface with multiple display types
- Efficient data management with immediate response
- Robust image attachment processing
- Responsive design for use on all devices
- Optimized performance and smooth transitions between states

## Technical Specifications

- SvelteKit 2.0+
- TypeScript
- Tailwind CSS for styling
- Vitest for unit tests
- Playwright for E2E tests
- Zod for form validation
- Lucide for icons

## API Specifications

The application communicates with the backend API using the following endpoints:

### 1. List of all tasks
- **Endpoint**: GET `/api/tasks/`
- **Functionality**: Get a complete list of tasks
- **Response**: Array of tasks in JSON format
- **Use in the application**: 
  - Display on the dashboard
  - Kanban board
  - Filterable list

### 2. Creating a task
- **Endpoint**: POST `/api/tasks/`
- **Data**: 
  - `title`: required, max. 100 characters
  - `description`: optional, max. 500 characters
  - `due_date`: optional
  - `photo`: optional, file (image)
- **Content-Type**: multipart/form-data
- **Response**: Created task including ID
- **Specifics**: 
  - Validation of all input fields
  - Handling image uploads
  - Error handling

### 3. Task details
- **Endpoint**: GET `/api/tasks/{id}/`
- **Parameters**: Task ID in the URL
- **Response**: Task details including all fields
- **Error states**: 404 if the task does not exist
- **Use**: Displaying task details and editing tasks

### 4. Task update
- **Endpoint**: PUT `/api/tasks/{id}/`
- **Data**: Same structure as when creating
- **Specifics**:
  - Option for partial update
  - Retention of existing image
  - Optimistic updates

### 5. Deleting a task
- **Endpoint**: DELETE `/api/tasks/{id}/`
- **Response**: 204 No Content
- **Functionality**:
  - Confirmation dialog
  - Optimistic updates
  - Error handling

### 6. Nearest deadline
- **Endpoint**: GET `/api/tasks/nearest-deadline/`
- **Functionality**: Returns the task with the nearest deadline
- **Usage**: Special display on the dashboard

## Required features

### Dashboard
1. Overview page (`/`)
   - Display of the nearest deadline
   - Switchable views:
     - Task list
     - Kanban board
   - Filters and sorting
   - Infinite scroll for the list

### Task management
1. Task creation (`/task/new`)
   - Validated form
   - Image upload (drag & drop)
   - Progress indicators
   - Image preview before upload

2. Details and editing (`/task/[id]`)
   - Inline editing
   - Attachment management
   - Change history

### Technical implementation
1. State Management
   - Central state management
   - Optimistic updates
   - Data caching

2. Performance
   - Lazy loading of components
   - Image optimization
   - Data prefetching

3. UX
   - Loading states
   - Error handling
   - Transition animations
   - Responsive design

## Testing

### Required test types
1. Unit tests
   - Components
   - Stores
   - Utility functions

2. Integration tests
   - API communication
   - State management
   - Form validation

3. E2E tests
   - Critical user flows
   - Error scenarios
   - Edge cases

## Submission

### Required outputs
1. Public GitHub repository link
   - Clear structure
   - Documentation
   - Setup instructions

2. Video presentation (max. 10 minutes) - youtube link
   - Demonstration of features - DEMO
   - Architectural decisions
   - Interesting implementation details

### Documentation
- README.md with:
  - Setup instructions
  - Application architecture
  - Technologies used
  - Description of extended features

## Evaluation criteria

### Key areas
1. Code quality
   - TypeScript usage
   - Application structure
   - Code cleanliness

2. Functionality
   - Meeting requirements
   - Error handling
   - Edge cases

3. Performance
   - Load times
   - Bundle size
   - Optimization

4. UX/UI
   - Responsive design
   - Accessibility
   - Consistency

### Bonus points
- CI/CD pipeline
- A11Y features
- Localization (CS/EN)
- Dark/light mode
- Analytics
- SSR optimization