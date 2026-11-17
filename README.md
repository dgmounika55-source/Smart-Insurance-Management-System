# InsureFlow - Smart Insurance Management System



A full-stack insurance management and claims processing platform built using React and ASP.NET Core Web API.



\## Project Overview



InsureFlow simplifies insurance policy management and claim processing through a centralized web application. Customers can explore policies, purchase coverage, submit claims, upload supporting documents and track claim progress. Administrators and claims managers can review claims and manage their status.



\## Key Features



\### Customer

\- Customer registration and login

\- Browse available insurance policies

\- Purchase insurance policies

\- Submit and track insurance claims

\- Upload supporting claim documents

\- View claim status history

\- Receive notifications

\- Download uploaded documents



\### Admin and Claims Manager

\- View and manage customer records

\- Review submitted claims

\- Approve or reject claims

\- Request additional documents

\- View dashboard summaries and claim statistics



\## Technology Stack



| Layer | Technologies |

|---|---|

| Frontend | React, JavaScript, HTML, CSS |

| Backend | C#, ASP.NET Core Web API |

| Database | SQL Server |

| ORM | Entity Framework Core |

| Authentication | ASP.NET Core Identity, JWT |

| API Documentation | Swagger / OpenAPI |

| Version Control | Git, GitHub |



\## Architecture



\- SmartInsurance.Client -Ã¢â€šÂ¬Ã¢â‚¬Å“ React frontend

\- SmartInsurance.API -Ã¢â€šÂ¬Ã¢â‚¬Å“ ASP.NET Core backend

\- Controllers -Ã¢â€šÂ¬Ã¢â‚¬Å“ API endpoints

\- Models and DTOs -Ã¢â€šÂ¬Ã¢â‚¬Å“ Application data

\- Data -Ã¢â€šÂ¬Ã¢â‚¬Å“ Database context

\- Services -Ã¢â€šÂ¬Ã¢â‚¬Å“ Business logic



\## Getting Started



\### Prerequisites

\- .NET 10 SDK

\- Node.js and npm

\- SQL Server

\- Git



\### Clone Repository



```bash

git clone https://github.com/dgmounika55-source/Smart-Insurance-Management-System.git

cd Smart-Insurance-Management-System

```



\### Backend Setup



```powershell

cd SmartInsurance.API

dotnet restore

dotnet build

dotnet run

```



\### Frontend Setup



Open another terminal:



```powershell

cd SmartInsurance.Client

npm install

npm run dev

```



Configure the frontend API URL in `.env`:



```text

VITE\_API\_BASE\_URL=http://localhost:5186/api

```



\## API Modules



\- Authentication

\- Customer Management

\- Policy Management

\- Policy Purchases

\- Claims Processing

\- Claim Reviews

\- Document Management

\- Claim Status History

\- Notifications

\- Dashboard Analytics



\## Security



\- JWT-based authentication

\- Role-based authorization

\- ASP.NET Core Identity

\- File extension, size and signature validation

\- Customer ownership checks



\## Development Status



Frontend and backend implementation is in progress. SQL Server setup and end-to-end integration testing are pending.



\## Future Enhancements



\- Complete SQL Server integration and testing

\- Payment gateway integration

\- Email and SMS notifications

\- Advanced reporting and analytics

\- Azure cloud deployment

\- Automated testing



\## Author



\*\*Mounika DG\*\*



GitHub: \[@dgmounika55-source](https://github.com/dgmounika55-source)

