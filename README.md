# File Analysis Application
<img width="1437" alt="Screenshot 2025-07-08 at 12 00 28 PM" src="https://github.com/user-attachments/assets/aba25734-15f4-493d-851a-071d0bf7cd4c" />

A comprehensive web application that allows users to upload various file types and interact with them through an AI-powered chatbot using Azure cloud services.

## Features

- **Multi-format File Support**: Upload images, PDFs, text files, CSV, Word documents, and SVG files
- **AI-Powered Analysis**: Chat with an AI about your files to get summaries, insights, and answers
- **Secure Authentication**: Azure Active Directory integration for secure user authentication
- **Cloud Storage**: Files are securely stored in Azure Blob Storage
- **Responsive UI**: Modern, mobile-friendly interface built with React
- **File Management**: Upload, view, download, and delete files with ease

## Tech Stack

### Backend
- **Node.js & Express**: Server framework
- **Azure Blob Storage**: File storage service
- **Azure AD**: Authentication service
- **Azure MCP Server**: Official Azure Model Context Protocol server
- **Azure OpenAI**: AI model backend with Azure MCP integration
- **Multer**: File upload middleware
- **Helmet**: Security middleware

### Frontend
- **React**: Frontend framework
- **Styled Components**: CSS-in-JS styling
- **React Router**: Navigation
- **React Query**: Data fetching and caching
- **React Dropzone**: File upload interface
- **React Toastify**: Notifications

## Prerequisites

- **Azure account** with an active subscription
- **Azure CLI** installed ([Install Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- **Node.js** 18+ installed
- **Permissions** to create Azure resources

## Quick Start

### Automated Azure Setup

Run the automated setup script to create all required Azure services:

```bash
# 1. Login to Azure
az login

# 2. Run the setup script
npm run setup-azure
```

This will create:
- **Resource Group**
- **Storage Account** (for file uploads)
- **Azure OpenAI Service** (for AI analysis)
- **Azure AD App Registration** (for authentication)
- **Optional Key Vault** (for secure secrets)

### Alternative Setup Methods

Choose your preferred setup method:

| Method | Difficulty | Interface | Guide |
|--------|------------|-----------|-------|
| ** Azure Portal** | Beginner | Web Browser | [Quick](docs/QUICK_PORTAL_SETUP.md) \| [Detailed](docs/AZURE_SETUP_PORTAL.md) |
| ** VS Code Extensions** | Beginner | VS Code | [Quick](docs/VS_CODE_AZURE_SETUP.md) \| [Detailed](docs/AZURE_SETUP_VSCODE.md) |
| ** Automated Script** | Easy | Command Line | `npm run setup-azure` |
| **🛠 Manual CLI** | Advanced | Command Line | [CLI Guide](docs/AZURE_SETUP_GUIDE.md) |

## Running the Application

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Configure Environment

The setup script creates a `.env` file automatically. If you set up Azure manually, copy the example:

```bash
cp .env.example .env
# Edit .env with your Azure credentials
```

### 3. Start the Application

```bash
# Authenticate with Azure (if not already done)
az login

# Start the application with Azure MCP
npm run dev-with-azure-mcp

# In another terminal, start the frontend
npm run client
```

The application will be available at `http://localhost:3000`

## 💰 Cost Estimation

**Monthly costs for moderate usage:**
- **Storage Account**: ~$0.02/GB + transactions (~$2-5)
- **Azure OpenAI**: $10-50 (depending on usage)
- **Key Vault**: ~$0.03 per 10K operations (~$1)
- **Total**: **$15-75/month**

**Cost optimization tips:**
- Use GPT-3.5-Turbo for development (cheaper than GPT-4)
- Monitor usage with Azure Cost Management
- Set spending alerts to avoid surprises

## Cleanup

When you're done testing, clean up Azure resources to avoid charges:

```bash
npm run cleanup-azure
```

Or manually:
```bash
az group delete --name file-analysis-rg --yes --no-wait
```

## Alternative Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd file-analysis-app
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create environment configuration:
```bash
cp .env.example .env
```

5. Fill in your Azure credentials in the `.env` file:
```env
# Azure Configuration
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_STORAGE_CONTAINER_NAME=file-uploads

# Azure AD Authentication
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=your-openai-endpoint
AZURE_OPENAI_API_KEY=your-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Azure MCP Server Configuration
# Uses DefaultAzureCredential - ensure you're authenticated:
# az login, azd auth login, or Connect-AzAccount

# Application Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:3000
```

## Running the Application

### Development Mode

1. **Authenticate with Azure:**
```bash
az login
# or
azd auth login
```

2. **Start with Azure MCP server:**
```bash
npm run dev-with-azure-mcp
```

3. **Start the frontend:**
```bash
npm run client
```

The application will be available at `http://localhost:3000`

### Production Mode

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Get Azure AD login URL
- `GET /api/auth/callback` - Handle authentication callback
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Files
- `POST /api/files/upload` - Upload a file
- `GET /api/files` - Get user's files
- `DELETE /api/files/:fileName` - Delete a file
- `GET /api/files/download/:fileName` - Download a file

### Chat
- `POST /api/chat/analyze` - Analyze file with custom query
- `POST /api/chat/summarize` - Get file summary

## Supported File Types

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, Word (.docx, .doc)
- **Text**: Plain text (.txt)
- **Data**: CSV files

## Security Features

- **Azure AD Authentication**: Secure user authentication
- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: Prevents abuse of API endpoints
- **Helmet Security**: Security headers and protection
- **File Type Validation**: Only allowed file types can be uploaded
- **User Isolation**: Users can only access their own files

## Deployment

The application can be deployed to:
- **Azure App Service**: For the backend
- **Azure Static Web Apps**: For the frontend
- **Azure Container Instances**: Using Docker

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository or contact the development team.
