export const staffService = {
  list: jest.fn(() => Promise.resolve({ 
    documents: [
      {
        $id: 'user-1',
        userId: 'USR001',
        name: 'John Doe',
        email: 'john@example.com',
        roles: ['STAFF'],
        departmentId: 'dept-1',
        active: true
      }
    ] 
  })),
  create: jest.fn((data) => Promise.resolve({ 
    $id: 'new-user-id',
    ...data
  })),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve())
}