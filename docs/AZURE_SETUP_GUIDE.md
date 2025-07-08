# Azure Services Setup Guide

This guide walks you through creating all the required Azure services for the file analysis application.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed: [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Appropriate permissions to create resources in your Azure subscription

## Required Azure Services

1. **Resource Group** - Container for all resources
2. **Storage Account** - File storage for uploaded files
3. **Azure Active Directory App Registration** - User authentication (Microsoft accounts)
4. **Azure OpenAI Service** - AI-powered file analysis
5. **Optional: Key Vault** - Secure credential storage

## Authentication Overview

This application requires **mandatory user authentication** through Azure Active Directory (Azure AD). Here's what this means:

### User Experience:
- **Login Required**: Users cannot access any features without logging in
- **Microsoft Accounts**: Users login with existing Microsoft accounts (personal, work, or school)
- **No Registration**: No separate account creation - uses existing Microsoft identities
- **Single Sign-On**: If already logged into Microsoft services, login is seamless

### Supported Account Types:
- **Personal Microsoft Accounts**: @outlook.com, @hotmail.com, @live.com
- **Work/School Accounts**: Organizational Azure AD accounts
- **Azure AD B2C**: Custom identity solutions (with configuration)

### Security Features:
- **Enterprise-grade**: Leverages Microsoft's identity platform
- **Multi-factor Authentication**: Inherits organizational MFA policies
- **Conditional Access**: Supports Azure AD conditional access rules
- **Token-based**: Secure OAuth 2.0 authentication flow

## Step-by-Step Setup

### 1. Login to Azure and Set Subscription

```bash
# Login to Azure
az login

# List your subscriptions
az account list --output table

# Set the subscription you want to use
az account set --subscription "Your-Subscription-Name-Or-ID"
```

### 2. Create Resource Group

```bash
# Choose a location (examples: eastus, westus2, eastus2)
LOCATION="eastus"
RESOURCE_GROUP="file-analysis-rg"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 3. Create Storage Account

```bash
# Storage account name must be globally unique (3-24 lowercase letters/numbers)
STORAGE_ACCOUNT="fileanalysis$(date +%s)"

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create container for file uploads
az storage container create \
  --name "file-uploads" \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query '[0].value' \
  --output tsv)

echo "Storage Account: $STORAGE_ACCOUNT"
echo "Storage Key: $STORAGE_KEY"
```

### 4. Create Azure OpenAI Service

```bash
# Azure OpenAI account name
OPENAI_ACCOUNT="file-analysis-openai"

# Create Azure OpenAI account
az cognitiveservices account create \
  --name $OPENAI_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --kind OpenAI \
  --sku S0 \
  --subscription $(az account show --query id --output tsv)

# Get OpenAI endpoint and key
OPENAI_ENDPOINT=$(az cognitiveservices account show \
  --name $OPENAI_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query properties.endpoint \
  --output tsv)

OPENAI_KEY=$(az cognitiveservices account keys list \
  --name $OPENAI_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query key1 \
  --output tsv)

echo "OpenAI Endpoint: $OPENAI_ENDPOINT"
echo "OpenAI Key: $OPENAI_KEY"
```

### 5. Deploy GPT-4 Model

```bash
# Deploy GPT-4 model
az cognitiveservices account deployment create \
  --resource-group $RESOURCE_GROUP \
  --name $OPENAI_ACCOUNT \
  --deployment-name "gpt-4" \
  --model-name "gpt-4" \
  --model-version "0613" \
  --model-format "OpenAI" \
  --scale-settings-scale-type "Standard"

echo "GPT-4 deployment: gpt-4"
```

### 6. Create Azure AD App Registration (Authentication)

This step creates the Azure Active Directory application that handles user authentication. All users will need to login with Microsoft accounts to access the application.

```bash
# Create AD app registration
APP_NAME="file-analysis-app"
REDIRECT_URI="http://localhost:3000/auth/callback"

# Create app registration
APP_ID=$(az ad app create \
  --display-name $APP_NAME \
  --web-redirect-uris $REDIRECT_URI \
  --query appId \
  --output tsv)

# Create service principal
az ad sp create --id $APP_ID

# Create client secret (valid for 2 years)
CLIENT_SECRET=$(az ad app credential reset \
  --id $APP_ID \
  --years 2 \
  --query password \
  --output tsv)

# Get tenant ID
TENANT_ID=$(az account show --query tenantId --output tsv)

echo "Client ID: $APP_ID"
echo "Client Secret: $CLIENT_SECRET"
echo "Tenant ID: $TENANT_ID"
```

#### What this creates:
- **Azure AD App Registration**: Enables OAuth 2.0 authentication
- **Client ID**: Public identifier for your application
- **Client Secret**: Private key for secure authentication
- **Redirect URI**: Where Azure AD sends users after login
- **Service Principal**: Allows the app to authenticate with Azure services

#### Authentication Flow:
1. User visits the application
2. Redirected to Azure AD login (`login.microsoftonline.com`)
3. User enters Microsoft account credentials
4. Azure AD validates and redirects back to your app
5. Application receives authentication token
6. User can now access file upload and analysis features

### 7. Configure App Registration Permissions

```bash
# Add Microsoft Graph permissions for user profile access
az ad app permission add \
  --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# Grant admin consent (requires Global Admin role)
az ad app permission admin-consent --id $APP_ID
```

#### Required Permissions:
- **User.Read**: Access to user's basic profile information
- **OpenID**: Standard OpenID Connect authentication
- **Profile**: Access to user's profile data
- **Email**: Access to user's email address

#### Admin Consent:
- **Required for organizational accounts**: If users have work/school accounts
- **Optional for personal accounts**: Personal Microsoft accounts work without admin consent
- **Global Admin role needed**: To grant consent for the entire organization

#### If you don't have Global Admin privileges:
Users will see a consent prompt on first login asking to approve these permissions. This is normal and secure.

### 8. Optional: Create Key Vault

```bash
# Key Vault name (must be globally unique)
KEYVAULT_NAME="file-analysis-kv-$(date +%s)"

# Create Key Vault
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Store secrets in Key Vault
az keyvault secret set --vault-name $KEYVAULT_NAME --name "StorageAccountKey" --value "$STORAGE_KEY"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "OpenAIKey" --value "$OPENAI_KEY"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "ClientSecret" --value "$CLIENT_SECRET"

echo "Key Vault: $KEYVAULT_NAME"
```

## Configuration Summary

After running the above commands, you'll have the following values for your `.env` file:

```bash
# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT
AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY
AZURE_STORAGE_CONTAINER_NAME=file-uploads

# Azure AD Authentication
AZURE_CLIENT_ID=$APP_ID
AZURE_CLIENT_SECRET=$CLIENT_SECRET
AZURE_TENANT_ID=$TENANT_ID
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY=$OPENAI_KEY
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Application Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-random-session-secret
FRONTEND_URL=http://localhost:3000
```

## Cost Considerations

### Estimated Monthly Costs (USD):

- **Storage Account**: ~$0.02/GB stored + transaction costs
- **Azure OpenAI**: 
  - GPT-4: $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
  - Typical usage: $10-50/month depending on volume
- **Key Vault**: ~$0.03 per 10K operations
- **Total Estimated**: $15-75/month for moderate usage

### Cost Optimization Tips:

1. **Use GPT-3.5-Turbo for development** (much cheaper than GPT-4)
2. **Monitor usage** with Azure Cost Management
3. **Set spending alerts** to avoid unexpected charges
4. **Use Azure Free Tier** resources where possible

## Production Considerations

### Security Enhancements:

1. **Use Key Vault** for all secrets
2. **Enable Storage Account firewall** rules
3. **Configure Azure AD Conditional Access**
4. **Use Managed Identity** where possible
5. **Enable logging and monitoring**

### Scaling Options:

1. **Premium Storage** for better performance
2. **Multiple Azure OpenAI regions** for redundancy
3. **CDN integration** for global file access
4. **Azure App Service** for hosting

## Troubleshooting

### Common Issues:

1. **Insufficient permissions**: Ensure you have Contributor role on the subscription
2. **Resource name conflicts**: Storage and Key Vault names must be globally unique
3. **Location restrictions**: Some services may not be available in all regions
4. **API rate limits**: Azure OpenAI has request limits per minute

### Authentication Troubleshooting:

1. **"Application not found" error**:
   - Verify the Azure AD app registration was created successfully
   - Check that CLIENT_ID in .env matches the App ID from Azure

2. **"Redirect URI mismatch" error**:
   - Ensure redirect URI in Azure AD matches exactly: `http://localhost:3000/auth/callback`
   - For production, add your production domain redirect URI

3. **Permission denied errors**:
   - Grant admin consent: `az ad app permission admin-consent --id $APP_ID`
   - Or have users consent during first login

4. **Users can't login**:
   - Check if app is configured for the correct account types
   - Verify users have valid Microsoft accounts
   - Check if organizational policies block external apps

5. **Token validation failures**:
   - Verify AZURE_TENANT_ID is correct
   - Check that CLIENT_SECRET hasn't expired (2 years)
   - Ensure system clock is synchronized

### Verification Commands:

```bash
# Verify resource group
az group show --name $RESOURCE_GROUP

# Verify storage account
az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP

# Verify OpenAI service
az cognitiveservices account show --name $OPENAI_ACCOUNT --resource-group $RESOURCE_GROUP

# Verify app registration
az ad app show --id $APP_ID

# Test authentication setup
az ad app show --id $APP_ID --query "{DisplayName:displayName, AppId:appId, Web:web.redirectUris}"
```

## User Account Requirements

### For End Users:
Users need one of the following to access the application:

1. **Personal Microsoft Account** (free):
   - @outlook.com, @hotmail.com, @live.com
   - Create at: https://account.microsoft.com/

2. **Work or School Account**:
   - Provided by organization with Azure AD
   - Usually corporate email addresses

3. **Guest Account**:
   - External users invited to your Azure AD tenant

### Testing Authentication:
1. Start the application
2. Visit `http://localhost:3000`
3. Click "Sign in with Microsoft"
4. Should redirect to `login.microsoftonline.com`
5. Enter Microsoft account credentials
6. Should redirect back to application dashboard

## Next Steps

1. **Copy the configuration values** to your `.env` file
2. **Test authentication** with a Microsoft account
3. **Test file upload and analysis** features
4. **Deploy to Azure App Service** for production
5. **Configure monitoring** and alerts
6. **Set up CI/CD pipeline** for automated deployments

## Cleanup (When Done Testing)

To avoid ongoing charges, delete the resource group:

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

This will delete all resources created in this guide.