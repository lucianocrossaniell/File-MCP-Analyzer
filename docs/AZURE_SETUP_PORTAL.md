# Azure Setup Guide - Azure Portal Method

This guide walks you through setting up all required Azure services using the Azure Portal web interface. This method is perfect for users who prefer a visual, web-based approach.

## Prerequisites

- **Azure account** with active subscription
- **Web browser** (Chrome, Edge, Firefox, Safari)
- **Basic Azure permissions** to create resources

## Getting Started

### 1. Access Azure Portal

1. Go to **[Azure Portal](https://portal.azure.com)**
2. **Sign in** with your Azure account
3. **Verify** you can see the Azure dashboard

### 2. Check Your Subscription

1. Click **"Subscriptions"** in the left menu (or search for it)
2. **Verify** you have an active subscription
3. **Note** the subscription name/ID for later use

## Step-by-Step Resource Creation

### Step 1: Create Resource Group

A resource group contains all your application resources in one place.

1. **Search** for "Resource groups" in the top search bar
2. **Click** "Resource groups"
3. **Click** "+ Create"
4. **Fill in details**:
   - **Subscription**: Select your subscription
   - **Resource group name**: `file-analysis-rg`
   - **Region**: `East US` (or your preferred region)
5. **Click** "Review + create"
6. **Click** "Create"

✅ **Result**: You now have a resource group to contain all your resources.

---

### Step 2: Create Storage Account

This stores all uploaded files securely in the cloud.

1. **Search** for "Storage accounts" in the top search bar
2. **Click** "Storage accounts"
3. **Click** "+ Create"
4. **Configure** the storage account:

   **Basics tab**:
   - **Subscription**: Your subscription
   - **Resource group**: `file-analysis-rg`
   - **Storage account name**: `fileanalysis[random-number]` (must be globally unique, 3-24 lowercase characters/numbers)
   - **Region**: Same as resource group
   - **Performance**: Standard
   - **Redundancy**: Locally-redundant storage (LRS)

5. **Click** "Review + create"
6. **Click** "Create"
7. **Wait** for deployment to complete (1-2 minutes)

#### Create Blob Container:

1. **Go to** your storage account (click "Go to resource" when deployment completes)
2. **In left menu** → "Containers" (under Data storage)
3. **Click** "+ Container"
4. **Configure**:
   - **Name**: `file-uploads`
   - **Public access level**: Private (no anonymous access)
5. **Click** "Create"

#### Get Storage Credentials:

1. **In your storage account** → "Access keys" (left menu under Security + networking)
2. **Show** key1
3. **Copy** the following values (save in notepad):
   - **Storage account name**: `fileanalysis[your-numbers]`
   - **Key**: The long key1 value

✅ **Result**: You have secure file storage ready for uploads.

---

### Step 3: Create Azure OpenAI Service

This provides AI-powered file analysis capabilities.

**⚠️ Note**: Azure OpenAI requires special access. Apply at: https://aka.ms/oai/access

1. **Search** for "Azure OpenAI" in the top search bar
2. **Click** "Azure OpenAI"
3. **Click** "+ Create"
4. **Configure**:

   **Basics tab**:
   - **Subscription**: Your subscription
   - **Resource group**: `file-analysis-rg`
   - **Region**: `East US` (check availability)
   - **Name**: `file-analysis-openai`
   - **Pricing tier**: `Standard S0`

5. **Click** "Next" through tabs (accept defaults)
6. **Click** "Review + create"
7. **Click** "Create"
8. **Wait** for deployment (2-3 minutes)

#### Deploy AI Model:

1. **Go to resource** when deployment completes
2. **Click** "Go to Azure OpenAI Studio" (or visit https://oai.azure.com)
3. **Select** your OpenAI resource
4. **Click** "Deployments" in left menu
5. **Click** "+ Create new deployment"
6. **Configure**:
   - **Select model**: `gpt-4` (or `gpt-35-turbo` if GPT-4 unavailable)
   - **Deployment name**: `gpt-4`
   - **Model version**: Auto-update to default
   - **Content filter**: Default
7. **Click** "Create"

#### Get OpenAI Credentials:

1. **Return to Azure Portal** → Your OpenAI resource
2. **Click** "Keys and Endpoint" (left menu under Resource Management)
3. **Copy** these values:
   - **Endpoint**: The full URL (ends with .openai.azure.com/)
   - **Key 1**: The API key value

✅ **Result**: You have AI analysis capabilities configured.

---

### Step 4: Create Azure AD App Registration (Authentication)

This enables secure user login with Microsoft accounts.

1. **Search** for "Azure Active Directory" (or "Microsoft Entra ID")
2. **Click** "Azure Active Directory"
3. **In left menu** → "App registrations"
4. **Click** "+ New registration"
5. **Configure**:
   - **Name**: `file-analysis-app`
   - **Supported account types**: Select "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: Select "Web" and enter `http://localhost:3000/auth/callback`
6. **Click** "Register"

#### Configure Authentication Settings:

1. **In your app registration** → "Authentication" (left menu)
2. **Add platform** → "Web"
3. **Redirect URIs**: Verify `http://localhost:3000/auth/callback` is listed
4. **Implicit grant and hybrid flows**: Check "ID tokens (used for implicit and hybrid flows)"
5. **Click** "Save"

#### Create Client Secret:

1. **Click** "Certificates & secrets" (left menu)
2. **Client secrets tab** → "+ New client secret"
3. **Configure**:
   - **Description**: `file-analysis-secret`
   - **Expires**: `24 months`
4. **Click** "Add"
5. **⚠️ IMPORTANT**: Copy the secret **Value** immediately (you won't see it again!)

#### Add API Permissions:

1. **Click** "API permissions" (left menu)
2. **Click** "+ Add a permission"
3. **Microsoft Graph** → "Delegated permissions"
4. **Search and select** these permissions:
   - `User.Read` (usually already added)
   - `openid`
   - `profile`
   - `email`
5. **Click** "Add permissions"
6. **Optional**: Click "Grant admin consent" if you have admin rights

#### Get Authentication IDs:

1. **Click** "Overview" (left menu)
2. **Copy** these values:
   - **Application (client) ID**: UUID format
   - **Directory (tenant) ID**: UUID format

✅ **Result**: Users can now securely login with Microsoft accounts.

---

### Step 5: Optional - Create Key Vault

Secure storage for application secrets (recommended for production).

1. **Search** for "Key vaults"
2. **Click** "Key vaults"
3. **Click** "+ Create"
4. **Configure**:
   - **Subscription**: Your subscription
   - **Resource group**: `file-analysis-rg`
   - **Key vault name**: `file-analysis-kv-[random]` (globally unique)
   - **Region**: Same as other resources
   - **Pricing tier**: Standard
5. **Click** "Review + create"
6. **Click** "Create"

#### Store Secrets:

1. **Go to your Key Vault** → "Secrets" (left menu)
2. **Click** "+ Generate/Import"
3. **Add these secrets**:

   **Secret 1**:
   - **Name**: `StorageAccountKey`
   - **Value**: Your storage account key

   **Secret 2**:
   - **Name**: `OpenAIKey`
   - **Value**: Your OpenAI API key

   **Secret 3**:
   - **Name**: `ClientSecret`
   - **Value**: Your Azure AD client secret

✅ **Result**: Your secrets are securely stored in Azure Key Vault.

---

## Configure Your Application

### Create .env File

Create a `.env` file in your project root with these values:

```bash
# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=fileanalysis[your-numbers]
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_STORAGE_CONTAINER_NAME=file-uploads

# Azure AD Authentication
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-client-secret-value
AZURE_TENANT_ID=your-tenant-id
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Application Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-random-secret-here
FRONTEND_URL=http://localhost:3000
```

### Where to Find Each Value:

| Variable | Location in Azure Portal |
|----------|---------------------------|
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage Account → Overview → Name |
| `AZURE_STORAGE_ACCOUNT_KEY` | Storage Account → Access keys → key1 |
| `AZURE_CLIENT_ID` | App Registration → Overview → Application ID |
| `AZURE_CLIENT_SECRET` | App Registration → Certificates & secrets → Value |
| `AZURE_TENANT_ID` | App Registration → Overview → Directory ID |
| `AZURE_OPENAI_ENDPOINT` | OpenAI Resource → Keys and Endpoint → Endpoint |
| `AZURE_OPENAI_API_KEY` | OpenAI Resource → Keys and Endpoint → Key 1 |

## Test Your Setup

### 1. Verify Resources

Check that all resources are created:

1. **Go to** "Resource groups" → `file-analysis-rg`
2. **Verify** you see:
   - ✅ Storage account
   - ✅ OpenAI service
   - ✅ Key Vault (if created)
3. **Check** App registration in Azure AD

### 2. Test Storage Account

1. **Go to** Storage Account → Containers → `file-uploads`
2. **Try uploading** a test file to verify it works

### 3. Test OpenAI Service

1. **Visit** Azure OpenAI Studio: https://oai.azure.com
2. **Go to** Playground
3. **Test** your GPT-4 deployment

### 4. Test Authentication

1. **Start your application** locally
2. **Visit** http://localhost:3000
3. **Click** "Sign in with Microsoft"
4. **Should redirect** to login.microsoftonline.com
5. **Login** and verify redirect back to your app

## Authentication Flow for Users

### What Users Experience:

1. **Visit** your application
2. **See** professional login page
3. **Click** "Sign in with Microsoft"
4. **Redirected** to Microsoft login
5. **Enter** Microsoft account credentials:
   - Personal: @outlook.com, @hotmail.com, @live.com
   - Work: Company Azure AD accounts
6. **Grant permissions** (first time only)
7. **Redirected** back to application dashboard
8. **Can now** upload and analyze files

### Account Requirements for Users:

Users need one of:
- **Personal Microsoft Account** (free at account.microsoft.com)
- **Work/School Account** (provided by organization)
- **Guest Account** (invited to your Azure AD)

## Troubleshooting

### Common Issues:

1. **"Resource name not available"**:
   - Storage/Key Vault names must be globally unique
   - Try adding random numbers: `fileanalysis12345`

2. **Azure OpenAI not available**:
   - Service not available in all regions
   - Try different region (West US 2, East US 2)
   - Apply for access: https://aka.ms/oai/access

3. **Authentication redirect errors**:
   - Verify redirect URI exactly: `http://localhost:3000/auth/callback`
   - Check client secret hasn't expired
   - Ensure permissions are granted

4. **Permission denied**:
   - Check your Azure subscription permissions
   - Verify you have Contributor role

### Getting Help:

1. **Resource creation issues**: Check Activity Log in Azure Portal
2. **Authentication problems**: Check App Registration → Authentication settings
3. **API errors**: Verify all credentials in .env file match Azure Portal

## Cost Management

### Monitor Spending:

1. **Go to** "Cost Management + Billing"
2. **Click** "Cost analysis"
3. **Filter** by resource group: `file-analysis-rg`
4. **Set up** budget alerts to avoid surprises

### Estimated Monthly Costs:

- **Storage Account**: $2-5 (depending on usage)
- **Azure OpenAI**: $10-50 (pay-per-use)
- **Key Vault**: ~$1 (per 10K operations)
- **Total**: ~$15-75/month for moderate usage

## Production Considerations

### For Production Deployment:

1. **Update redirect URIs** to your production domain
2. **Use Key Vault** for all secrets
3. **Enable storage encryption** at rest
4. **Configure monitoring** and alerts
5. **Set up backup** policies

### Security Enhancements:

1. **Enable MFA** for admin accounts
2. **Configure** conditional access policies
3. **Use** managed identities where possible
4. **Enable** Azure Defender

## Cleanup

### Delete All Resources:

To avoid ongoing charges when done testing:

1. **Go to** "Resource groups"
2. **Click** `file-analysis-rg`
3. **Click** "Delete resource group"
4. **Type** the resource group name to confirm
5. **Click** "Delete"

This deletes all resources and stops all charges.

### Delete App Registration:

1. **Go to** Azure AD → App registrations
2. **Find** your app → Click "Delete"
3. **Confirm** deletion

## Next Steps

1. **✅ Complete** application configuration with your .env values
2. **🧪 Test** the application locally
3. **🚀 Deploy** to Azure App Service for production
4. **📊 Monitor** usage and costs
5. **🔒 Implement** additional security measures

The Azure Portal method provides full control and visibility over all your Azure resources with a user-friendly web interface!