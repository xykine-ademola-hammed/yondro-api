# Advanced Workflow Management Backend

A comprehensive workflow management system with dynamic internal loops and approval flows, built with Node.js, Express, TypeScript, Sequelize, and MySQL.

## 🚀 Features

### Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Admin, Manager, and Employee roles with different permissions
- **Password Security**: Bcrypt hashing with salt rounds for secure password storage
- **Protected Routes**: Comprehensive middleware for route protection and authorization
- **User Management**: Complete user registration, login, logout, and profile management

### Core Workflow Features
- **Multi-stage Approval Workflows**: Define complex workflows with ordered stages
- **Dynamic Internal Loops**: Automatic sub-stages (Initiator → Reviewer → Approver) within departments
- **Flexible Stage Resolution**: Smart next-stage detection based on approval status
- **Rejection Handling**: Sophisticated resubmission flows with incremental sub-steps
- **Role-based Assignment**: Automatic user assignment based on department membership

### Business Logic
- **Workflow Setup**: Admin-defined workflows with ordered stages
- **Request Execution**: User-initiated workflow requests with automatic stage progression
- **Internal Department Routing**: Configurable internal loops for departments (HR, Bursary, etc.)
- **Dynamic Step Numbering**: Advanced step system (1, 2, 2.01, 2.02, 2.03, etc.)

### Technical Features
- **Full CRUD Operations**: Complete entity management for Organizations, Departments, Positions, Employees
- **Pagination & Search**: Built-in pagination and search functionality
- **Type Safety**: Full TypeScript implementation with strict typing
- **Error Handling**: Comprehensive error handling and validation
- **Database Relationships**: Complex associations between all entities

## 🏗️ Architecture

### Database Models
- **Organization** → **Department** → **Position** → **Employee**
- **Workflow** → **Stage** → **WorkflowRequest** → **WorkflowInstanceStage**

### Key Components
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and workflow orchestration
- **Models**: Sequelize ORM models with relationships
- **Utils**: Helper functions for stage management
- **Middleware**: Error handling, validation, security

## 📊 Workflow Flow

### 1. Workflow Setup
```
Admin creates Workflow with Stages:
Stage 1: Submission (step: 1)
Stage 2: Finance Review (step: 2, requiresInternalLoop: true, departmentId: 2)
Stage 3: Final Approval (step: 3)
```

### 2. Request Execution
```
User submits WorkflowRequest
→ Creates first WorkflowInstanceStage (step: 1)
→ Stage 1 approved → Creates Stage 2 (step: 2)
→ Stage 2 has internal loop → Creates sub-stages:
   - Initiator (step: 2.01)
   - Reviewer (step: 2.02)  
   - Approver (step: 2.03)
```

### 3. Internal Loop Handling
```
If Reviewer rejects (step: 2.02):
→ Creates new Initiator (step: 2.04)
→ Creates new Reviewer (step: 2.05)

If Approver approves (step: 2.03 or 2.05):
→ Creates next main stage (step: 3)
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd workflow-management-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your database settings in .env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=workflow_management
DB_USER=your_username
DB_PASSWORD=your_password

# Start development server
npm run dev
```

### Database Setup
The application will automatically create and sync database tables on startup.

## 🔌 API Endpoints

### Authentication
```http
POST   /api/auth/login               # User login
POST   /api/auth/signup              # User registration
POST   /api/auth/logout              # User logout
GET    /api/auth/profile             # Get user profile
PUT    /api/auth/change-password     # Change password
GET    /api/auth/verify              # Verify token
```

### Workflow Execution
```http
POST   /api/workflow-request          # Start new workflow request
GET    /api/next-stage/:requestId     # Get next actionable stage
POST   /api/stage/complete            # Approve/reject stage
POST   /api/stage/internal/send-back  # Internal loop rejection
```

### Workflow Management
```http
POST   /api/workflow                  # Create workflow
GET    /api/workflow/:id              # Get workflow with stages
POST   /api/workflow/:id/stage        # Add stage to workflow
GET    /api/workflow                  # Get all workflows (paginated)
```

### Entity Management
```http
# Organizations
POST   /api/organization              # Create organization
GET    /api/organization              # Get all organizations
GET    /api/organization/:id          # Get organization by ID
PUT    /api/organization/:id          # Update organization
DELETE /api/organization/:id          # Delete organization

# Departments
POST   /api/department                # Create department
GET    /api/department                # Get all departments
GET    /api/department/:id            # Get department by ID
PUT    /api/department/:id            # Update department
DELETE /api/department/:id            # Delete department

# Employees
POST   /api/employee                  # Create employee
GET    /api/employee                  # Get all employees
GET    /api/employee/:id              # Get employee by ID
PUT    /api/employee/:id              # Update employee
DELETE /api/employee/:id              # Delete employee
```

## 💡 Usage Examples

### 1. User Registration
```json
POST /api/auth/signup
{
  "email": "john.doe@company.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "departmentId": 2,
  "positionId": 3,
  "role": "Employee"
}
```

### 2. User Login
```json
POST /api/auth/login
{
  "email": "john.doe@company.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Employee"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### 3. Protected API Calls
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

POST /api/workflow-request
{
  "workflowId": 1
}
```

### 1. Create a Workflow
```json
POST /api/workflow
{
  "name": "Purchase Request Workflow",
  "description": "Standard purchase request approval process"
}
```

### 2. Add Stages to Workflow
```json
POST /api/workflow/1/stage
{
  "name": "Initial Submission",
  "step": 1,
  "requiresInternalLoop": false
}

POST /api/workflow/1/stage
{
  "name": "Finance Review",
  "step": 2,
  "requiresInternalLoop": true,
  "departmentId": 2
}
```

### 3. Start a Workflow Request
```json
POST /api/workflow-request
{
  "workflowId": 1,
  "requestorId": 5
}
```

### 4. Complete a Stage
```json
POST /api/stage/complete
{
  "stageId": 15,
  "action": "approve",
  "comment": "Approved for processing",
  "fieldResponses": {
    "amount": 5000,
    "justification": "Required for project completion"
  }
}
```

## 🔧 Key Features Explained

### Authentication System
The system uses JWT tokens for stateless authentication:
- Tokens are signed with a secret key and have configurable expiration
- Passwords are hashed using bcrypt with 12 salt rounds
- User roles determine access levels (Admin > Manager > Employee)
- Middleware automatically validates tokens and injects user context

### Authorization Levels
- **Admin**: Full system access, can manage all entities
- **Manager**: Can create/modify workflows and departments, limited user management
- **Employee**: Can participate in workflows, view own profile, limited read access

### Dynamic Step Resolution
The system uses decimal step numbering for internal loops:
- Main stages: 1, 2, 3, 4...
- Internal sub-stages: 2.01, 2.02, 2.03...
- Resubmission stages: 2.04, 2.05, 2.06...

### Internal Loop Logic
When a stage requires internal routing:
1. System creates 3 sub-stages automatically
2. Each sub-stage assigned to different department members
3. Rejection creates new initiator + re-review stages
4. Final approval triggers next main stage

### Role-based Assignment
- Automatic user assignment from department pools
- Random selection with future enhancement possibilities
- Support for department-specific routing rules

## 🚦 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
```

### Project Structure
```
src/
├── config/          # Database configuration
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Sequelize models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Helper utilities
├── app.ts           # Express app setup
└── index.ts         # Server entry point
```

## 🛡️ Security Features
- JWT-based stateless authentication
- Bcrypt password hashing with salt rounds
- Role-based access control (RBAC)
- Request validation and sanitization
- Helmet.js for security headers
- Rate limiting
- Input validation with Joi
- SQL injection prevention via Sequelize
- Error handling without sensitive data exposure
- Protected routes with middleware authentication

## 📈 Performance Features
- Connection pooling
- Pagination for large datasets
- Optimized database queries
- Proper indexing on foreign keys

## 🔮 Future Enhancements
- [ ] Authentication & authorization
- [ ] Real-time notifications
- [ ] Audit trail logging
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] File attachment support
- [ ] Workflow templates
- [ ] Advanced user assignment algorithms

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License
MIT License - see LICENSE file for details