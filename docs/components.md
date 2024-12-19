# UI Components Documentation

## Dashboard Components

### Layout Components

#### DashboardLayout (`src/app/dashboard/layout.tsx`)
Main layout component for the dashboard area.
```typescript
<DashboardLayout>
  {children}
</DashboardLayout>
```
Features:
- Responsive sidebar navigation
- Header with user profile
- Debug panel for development
- Content area with proper padding

#### Sidebar (`src/components/dashboard/sidebar.tsx`)
Navigation sidebar with collapsible functionality.
```typescript
<Sidebar />
```
Features:
- Collapsible navigation
- Icon + text navigation items
- Active state indication
- Role-based menu items

#### Header (`src/components/dashboard/header.tsx`)
Top navigation bar with user controls.
```typescript
<Header />
```
Features:
- User profile dropdown
- Logout functionality
- Responsive design
- Branding elements

#### DebugPanel (`src/components/dashboard/debug-panel.tsx`)
Development tool for JWT and permissions debugging.
```typescript
<DebugPanel />
```
Features:
- JWT token display
- Permission list
- Token expiration countdown
- Collapsible interface

### People Management Components

#### PeoplePage (`src/app/dashboard/people/page.tsx`)
Main interface for user management.
```typescript
<PeoplePage />
```
Features:
- User listing table
- Create/Edit/Delete actions
- Role assignment
- Status management

#### DataTable
Reusable table component with sorting and filtering.
```typescript
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```
Features:
- Sortable columns
- Pagination
- Row actions
- Selection support

### Role Management Components

#### RolesPage (`src/app/dashboard/roles/page.tsx`)
Interface for role and permission management.
```typescript
<RolesPage />
```
Features:
- Role cards
- Permission matrix
- Role actions
- Visual permission indicators

## Shared Components

### Authentication Components

#### LoginForm
```typescript
<LoginForm onSuccess={() => {}} />
```
Features:
- Email/Password inputs
- Validation
- Error handling
- Loading states

### UI Elements

#### Button
```typescript
<Button
  variant="default | secondary | ghost"
  size="default | sm | lg"
>
  Click me
</Button>
```
Variants:
- default: Primary action
- secondary: Secondary action
- ghost: Subtle action

#### Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```
Usage:
- Content containers
- Feature sections
- Form containers

#### Badge
```typescript
<Badge
  variant="default | secondary | outline"
>
  Label
</Badge>
```
Usage:
- Status indicators
- Tags
- Counts

#### DropdownMenu
```typescript
<DropdownMenu>
  <DropdownMenuTrigger>Open</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```
Usage:
- Action menus
- Selection menus
- User menu

## Hooks and Utilities

### useAuth
Authentication hook for user management.
```typescript
const { user, login, logout, loading } = useAuth();
```
Features:
- User state management
- Login/logout functions
- Loading states
- Error handling

### withTokenRefresh
Higher-order function for API calls.
```typescript
const result = await withTokenRefresh(() => 
  api.someMethod()
);
```
Features:
- Automatic token refresh
- Error handling
- Type safety

## Best Practices

### Component Structure
1. Use TypeScript for all components
2. Implement proper prop types
3. Use composition over inheritance
4. Keep components focused and small

### State Management
1. Use React hooks for local state
2. Implement proper loading states
3. Handle errors gracefully
4. Use context where appropriate

### Styling
1. Use Tailwind CSS classes
2. Follow design system
3. Ensure responsive design
4. Maintain consistency

### Accessibility
1. Use proper ARIA labels
2. Implement keyboard navigation
3. Ensure proper contrast
4. Test with screen readers

### Performance
1. Implement proper memoization
2. Lazy load components
3. Optimize re-renders
4. Monitor bundle size