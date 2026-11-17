# InsureFlow - Smart Insurance Management System

A full-stack insurance management and claims processing platform built using React and ASP.NET Core Web API.

## **1. Project Overview**

InsureFlow is a web-based application designed to simplify insurance policy management and claims processing.

Customers can explore insurance policies, purchase coverage, submit claims, upload documents and track claim progress. Administrators and claims managers can review claims and manage their status.

## **2. Key Features**

### **Customer Features**
- Customer registration and login
- Browse available insurance policies
- Purchase insurance policies
- Submit and track insurance claims
- Upload supporting claim documents
- View claim status history
- Receive notifications
- Download uploaded documents

### **Admin and Claims Manager Features**
- View and manage customer records
- Review submitted claims
- Approve or reject claims
- Request additional documents
- View dashboard summaries and statistics
- Track claim status history

## **3. Technology Stack**

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML, CSS |
| Backend | C#, ASP.NET Core Web API |
| Database | SQL Server |
| ORM | Entity Framework Core |
| Authentication | ASP.NET Core Identity, JWT |
| API Documentation | Swagger / OpenAPI |
| Version Control | Git and GitHub |

## **4. Project Architecture**

- **SmartInsurance.Client:** React frontend
- **SmartInsurance.API:** ASP.NET Core backend
- **Controllers:** Handle API requests
- **Models and DTOs:** Manage application data
- **Data:** Database context and configuration
- **Services:** Business logic
- **Migrations:** Database schema changes

## **5. Getting Started**

### **Prerequisites**
- .NET 10 SDK
- Node.js and npm
- SQL Server
- Git

### **Clone the Repository**

```bash
git clone https://github.com/dgmounika55-source/Smart-Insurance-Management-System.git
cd Smart-Insurance-Management-System
```

### **Backend Setup**

```powershell
cd SmartInsurance.API
dotnet restore
dotnet build
dotnet run
```

### **Frontend Setup**

Open another terminal:

```powershell
cd SmartInsurance.Client
npm install
npm run dev
```

Configure the frontend API URL in the `.env` file:

```text
VITE_API_BASE_URL=http://localhost:5186/api
```

## **6. API Modules**

- Authentication and Authorization
- Customer Management
- Insurance Policy Management
- Policy Purchases
- Claims Processing
- Claim Reviews
- Document Management
- Claim Status History
- Notifications
- Dashboard Analytics

## **7. Security Features**

- JWT-based authentication
- Role-based authorization
- ASP.NET Core Identity
- File extension and size validation
- File signature validation
- Customer ownership checks for claims and documents

## **8. Development Status**

The frontend and backend implementation is in progress. SQL Server setup and end-to-end integration testing are pending.

## **9. Future Enhancements**

- Complete SQL Server integration and testing
- Payment gateway integration
- Email and SMS notifications
- Advanced reporting and analytics
- Azure cloud deployment
- Automated unit and integration testing

## **10. Author**

**Mounika DG**

GitHub: [dgmounika55-source](https://github.com/dgmounika55-source)
