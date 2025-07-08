# Azure Setup Guide - VS Code Extension Method

This guide shows how to set up all required Azure services using the VS Code Azure extensions for a more visual and user-friendly experience.

## Prerequisites

- **VS Code** installed
- **Azure account** with active subscription
- **Node.js** 18+ installed

## Install VS Code Extensions

Install these VS Code extensions for Azure development:

### Required Extensions:
1. **Azure Account** - Sign in to Azure
2. **Azure Resources** - Manage Azure resources
3. **Azure App Service** - Deploy web apps
4. **Azure Storage** - Manage storage accounts
5. **Azure Functions** - Optional for advanced features

### Installation:
```bash
# Install all Azure extensions at once
code --install-extension ms-vscode.vscode-node-azure-pack
```

Or install via VS Code:
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Azure Tools"
4. Install the "Azure Tools" extension pack

## Step-by-Step Setup with VS Code

### 1. Sign in to Azure

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type: `Azure: Sign In`
3. Follow the browser authentication flow
4. Return to VS Code - you should see your subscription in the Azure panel

### 2. Create Resource Group

1. **Open Azure Panel**: Click Azure icon in Activity Bar (left sidebar)
2. **Expand Resources**
3. **Right-click on your subscription** → `Create Resource Group`
4. **Enter details**:
   - Name: `file-analysis-rg`
   - Location: `East US` (or your preferred region)

### 3. Create Storage Account

1. **In Azure Panel** → **Storage Accounts**
2. **Click `+`** (Create Storage Account)
3. **Configure**:
   - Subscription: Your subscription
   - Resource Group: `file-analysis-rg`
   - Name: `fileanalysis[random-numbers]` (must be globally unique)
   - Location: Same as resource group
   - Performance: Standard
   - Replication: LRS
4. **Click Create**

#### Create Blob Container:
1. **Expand your storage account** in Azure panel
2. **Right-click Blob Containers** → `Create Blob Container`
3. **Name**: `file-uploads`
4. **Public access level**: Private

#### Get Storage Credentials:
1. **Right-click storage account** → `Copy Connection String`
2. **Save for later** - you'll need this for `.env` file

### 4. Create Azure OpenAI Service

**Note**: This requires special access to Azure OpenAI. If you don't have access, you can apply at: https://aka.ms/oai/access

#### Using Azure Portal (recommended for OpenAI):
1. **Open Azure Portal**: https://portal.azure.com
2. **Create a resource** → Search "OpenAI"
3. **Create Azure OpenAI**:
   - Subscription: Your subscription
   - Resource Group: `file-analysis-rg`
   - Region: `East US` or available region
   - Name: `file-analysis-openai`
   - Pricing tier: `Standard S0`

#### Deploy GPT-4 Model:
1. **Go to Azure OpenAI Studio**: https://oai.azure.com
2. **Select your OpenAI resource**
3. **Deployments** → **Create new deployment**
4. **Configure**:
   - Model: `gpt-4` (or `gpt-35-turbo` if GPT-4 unavailable)
   - Deployment name: `gpt-4`
   - Version: Latest available

#### Get OpenAI Credentials:
1. **In Azure Portal** → Your OpenAI resource
2. **Keys and Endpoint**:
   - Copy **Endpoint URL**
   - Copy **Key 1**

### 5. Create Azure AD App Registration

#### Using Azure Portal:
1. **Azure Portal** → **Azure Active Directory**
2. **App registrations** → **New registration**
3. **Configure**:
   - Name: `file-analysis-app`
   - Supported account types: `Accounts in any organizational directory and personal Microsoft accounts`
   - Redirect URI: `Web` → `http://localhost:3000/auth/callback`
4. **Register**

#### Configure Authentication:
1. **In your app registration** → **Authentication**
2. **Add platform** → **Web**
3. **Redirect URIs**: Add `http://localhost:3000/auth/callback`
4. **Implicit grant**: Check `ID tokens`

#### Create Client Secret:
1. **Certificates & secrets** → **New client secret**
2. **Description**: `file-analysis-secret`
3. **Expires**: `24 months`
4. **Add** → **Copy the secret value** (save immediately - you won't see it again)

#### Configure API Permissions:
1. **API permissions** → **Add a permission**
2. **Microsoft Graph** → **Delegated permissions**
3. **Select permissions**:
   - `User.Read`
   - `openid`
   - `profile`
   - `email`
4. **Add permissions**
5. **Grant admin consent** (if you have admin rights)

#### Get Authentication Details:
- **Application (client) ID**: From Overview page
- **Directory (tenant) ID**: From Overview page
- **Client secret**: The value you copied earlier

### 6. Optional: Create Key Vault

1. **Azure Panel** → **Key Vaults**
2. **Click `+`** → **Create Key Vault**
3. **Configure**:
   - Subscription: Your subscription
   - Resource Group: `file-analysis-rg`
   - Name: `file-analysis-kv-[random]`
   - Location: Same as resource group
4. **Create**

#### Store Secrets:
1. **Expand Key Vault** → **Secrets**
2. **Right-click** → **Create Secret**
3. **Add these secrets**:
   - `StorageConnectionString`: Your storage connection string
   - `OpenAIKey`: Your OpenAI API key
   - `ClientSecret`: Your Azure AD client secret

## Configure Your Application

### 1. Create .env File

Create a `.env` file in your project root with these values:

```bash
# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONTAINER_NAME=file-uploads

# Azure AD Authentication
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=your-openai-endpoint
AZURE_OPENAI_API_KEY=your-openai-key
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Application Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-random-session-secret
FRONTEND_URL=http://localhost:3000
```

### 2. Extract Storage Key from Connection String

If you copied the connection string, extract the key:
- Connection string format: `DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=yyy;EndpointSuffix=core.windows.net`
- Extract the `AccountKey` value for `AZURE_STORAGE_ACCOUNT_KEY`

## VS Code Development Features

### Azure Extensions Benefits:

1. **Visual Resource Management**:
   - See all resources in sidebar
   - Right-click context menus
   - Real-time status updates

2. **Easy Deployment**:
   - Deploy directly from VS Code
   - Azure App Service integration
   - Automated builds

3. **Debugging Support**:
   - Remote debugging on Azure
   - Log streaming
   - Performance monitoring

4. **IntelliSense**:
   - Azure SDK autocomplete
   - Configuration validation
   - Error highlighting

### Useful VS Code Commands:

- `Azure: Sign In` - Authenticate with Azure
- `Azure: Select Subscriptions` - Choose active subscriptions
- `Azure: Create Resource Group` - Create new resource group
- `Azure: Deploy to Web App` - Deploy your application
- `Azure: Stream Logs` - View real-time logs

## Testing Your Setup

### 1. Test Azure Connection
1. **Command Palette** → `Azure: Select Subscriptions`
2. **Verify** you can see your subscription and resources

### 2. Test Storage Account
1. **Azure Panel** → **Storage Accounts** → Your account
2. **Right-click Blob Container** → **Browse**
3. **Try uploading a test file**

### 3. Test OpenAI Service
1. **Azure Portal** → Your OpenAI resource → **Keys and Endpoint**
2. **Test endpoint** in Azure OpenAI Studio

### 4. Test Authentication
1. **Azure Portal** → **Azure AD** → **App registrations** → Your app
2. **Verify redirect URI** is correct
3. **Check permissions** are granted

## Troubleshooting with VS Code

### Common Issues:

1. **Can't see Azure resources**:
   - Sign out and sign in again: `Azure: Sign Out` → `Azure: Sign In`
   - Check subscription selection: `Azure: Select Subscriptions`

2. **Storage account not visible**:
   - Refresh Azure panel (right-click → Refresh)
   - Check resource group location

3. **Permission errors**:
   - Verify your Azure account has Contributor role
   - Check subscription permissions

4. **Authentication setup issues**:
   - Verify redirect URI exactly matches: `http://localhost:3000/auth/callback`
   - Check client secret hasn't expired
   - Ensure permissions are granted

### VS Code Debug Features:

1. **Output Panel** → **Azure** - See detailed logs
2. **Azure Activity Log** - Monitor resource operations
3. **Problems Panel** - See configuration issues

## Production Deployment with VS Code

### Deploy to Azure App Service:

1. **Install Azure App Service extension**
2. **Command Palette** → `Azure App Service: Deploy to Web App`
3. **Select** your subscription and create new App Service
4. **Configure** production environment variables
5. **Deploy** your application

### Environment Variables for Production:

Update your production App Service with:
- All the same environment variables from `.env`
- Update `AZURE_REDIRECT_URI` to your production domain
- Update `FRONTEND_URL` to your production domain

## Cost Monitoring

### Using VS Code:
1. **Azure Panel** → **Cost Management**
2. **View spending** by resource group
3. **Set up alerts** for budget limits

### Estimated Costs:
- **Storage Account**: ~$2-5/month
- **Azure OpenAI**: $10-50/month (usage-based)
- **Key Vault**: ~$1/month
- **Total**: $15-75/month for moderate usage

## Cleanup

### Delete Resource Group:
1. **Azure Panel** → **Resource Groups**
2. **Right-click** `file-analysis-rg` → **Delete**
3. **Type resource group name** to confirm
4. **Delete**

This removes all resources and stops all charges.

## VS Code Tips

### Productivity Tips:
1. **Pin Azure panel** for quick access
2. **Use Command Palette** for quick actions
3. **Enable Auto-save** for configuration files
4. **Use Git integration** for version control

### Recommended Settings:
```json
{
  "azure.resourceFilter": ["file-analysis-rg"],
  "azure.showSignedInEmail": true,
  "files.autoSave": "afterDelay"
}
```

The VS Code Azure extensions make Azure development much more intuitive and visual compared to CLI-only approaches!