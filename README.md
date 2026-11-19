# InsureFlow – Smart Insurance Management & Claims Processing Platform

A full-stack insurance management platform built with **React, ASP.NET Core Web API, C#, and Entity Framework Core**.

InsureFlow simplifies insurance policy management, customer onboarding, payment simulation, claims submission, document handling, and claims review through a role-based web application.

## 1. Project Overview

InsureFlow is designed to digitize and streamline insurance operations.

Customers can explore insurance products, purchase policies through a development payment simulator, submit claims, upload supporting documents, and track claim progress.

Administrators manage customers and insurance policies, while Claims Managers review claims and make decisions based on submitted information.

The application provides separate access and functionality for Customers, Administrators, and Claims Managers.

## 2. Key Features

### Customer Features
- Customer registration and login
- JWT-based authentication
- Browse available insurance policies
- Purchase insurance policies through a development payment simulator
- View purchased policies
- Submit and track insurance claims
- Upload supporting claim documents
- View claim status history
- Receive and manage notifications
- Download uploaded documents
- View payment transaction history

### Admin Features
- Admin dashboard with business summaries
- View and manage customer records
- Add new insurance policies
- Edit existing policies
- Deactivate insurance policies
- View and review submitted claims
- Approve or reject claims
- Request additional supporting documents
- View reports and claim statistics

### Claims Manager Features
- Claims management dashboard
- View submitted claims
- Review claim details and supporting documents
- Approve or reject claims
- Request additional documents
- Update claim status with remarks
- Track claim review history

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML5, CSS3 |
| Backend | C#, ASP.NET Core Web API |
| Framework | .NET 10 |
| Database – Development | SQLite |
| Database – Production Configuration | SQL Server |
| ORM | Entity Framework Core |
| Authentication | ASP.NET Core Identity, JWT |
| API Documentation | OpenAPI |
| HTTP Client | Axios |
| Routing | React Router |
| Icons | Lucide React |
| Version Control | Git and GitHub |
| Development Tools | Visual Studio Code / Antigravity IDE, Postman |

## 4. Project Architecture

The application follows a client-server architecture.

```text
InsureFlow
│
├── SmartInsurance.API
│   ├── Controllers
│   ├── Models
│   ├── DTOs
│   ├── Data
│   ├── Services
│   ├── Interfaces
│   ├── Repositories
│   ├── Middleware
│   └── Migrations
│
└── SmartInsurance.Client
    └── src
        ├── components
        ├── pages
        ├── services
        ├── App.jsx
        └── App.css
```

**Backend:** Handles API requests, authentication, authorization, business logic, and database operations.

**Frontend:** Provides the user interface for customers, administrators, and claims managers.

**Database:** Stores customer information, insurance policies, claims, documents, payments, notifications, and status history.

## 5. Application Modules

- Authentication and Authorization
- Customer Management
- Insurance Policy Management
- Policy Purchase and Payment Processing
- Claims Submission and Processing
- Claims Review and Approval
- Document Upload and Download
- Claim Status History
- Notifications
- Payment History
- Dashboard and Reports

## 6. Security Features

- JWT-based authentication
- Role-based access control
- ASP.NET Core Identity
- Customer ownership verification for claims and documents
- Payment ownership verification
- Server-side policy premium calculation
- File extension and size validation
- File signature validation
- Protected administrative operations
- Duplicate active policy purchase prevention

## 7. Payment Processing

InsureFlow includes a **development payment simulator** to demonstrate the policy purchase workflow.

It supports:
- Successful payment simulation
- Failed payment simulation
- Transaction reference generation
- Payment history tracking
- Policy activation only after successful payment

**Note:** This is not a real payment gateway. No actual money is collected or transferred.

## 8. Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js and npm
- Git
- A code editor
- SQLite for the development database

### Clone the Repository

```bash
git clone https://github.com/dgmounika55-source/Smart-Insurance-Management-System.git

cd Smart-Insurance-Management-System
```

### Backend Setup

Open a terminal in the project root:

```powershell
cd SmartInsurance.API

dotnet restore

dotnet build

dotnet run --urls http://localhost:5190
```

The backend API runs at:

`http://localhost:5190`

The OpenAPI document is available in Development at:

`http://localhost:5190/openapi/v1.json`

### Backend Configuration

The development database connection is configured in `appsettings.Development.json`.

The application uses SQLite during development and is configured to use SQL Server in Production.

Configure the required JWT and seed-user settings through ASP.NET Core User Secrets. Do not commit passwords, JWT secrets, or other credentials to GitHub.

The Admin and Claims Manager seeders require their respective email and password settings.

### Frontend Setup

Open a second terminal:

```powershell
cd SmartInsurance.Client

npm install

npm run dev
```

The frontend runs at:

`http://localhost:5173`

The frontend API client is configured to communicate with the backend at:

`http://localhost:5190/api`

## 9. User Roles

| Role | Main Responsibilities |
|---|---|
| Customer | Purchase policies, submit claims, upload documents, and track transactions |
| Admin | Manage customers and policies, review claims, and access reports |
| Claims Manager | Review claims, request documents, and make claim decisions |

## 10. Project Status

The core InsureFlow application has been implemented, including:

- Customer, Admin, and Claims Manager authentication
- Role-based access and protected routes
- Insurance policy management
- Development payment simulation
- Claims submission and review workflow
- Document management
- Notifications and status history
- Payment transaction history
- Dashboard and reports
- Frontend production build verification
- Backend build verification
- API authorization and ownership checks

**Environment note:** SQLite is used for development. SQL Server production configuration is present but has not yet been validated against a running SQL Server instance.

## 11. Future Enhancements

- Real payment gateway integration
- Email and SMS notifications
- SQL Server production deployment and validation
- Azure cloud deployment
- Automated unit and integration testing
- Advanced reporting and analytics

## 12. Author

**Mounika DG**

GitHub: https://github.com/dgmounika55-source

---

**Project:** InsureFlow – Smart Insurance Management & Claims Processing Platform