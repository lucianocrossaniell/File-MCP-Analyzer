const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

class AzureStorageService {
  constructor() {
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    this.accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    
    const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${this.accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
    
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  async uploadFile(file, userId) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExtension}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      
      const uploadOptions = {
        metadata: {
          originalName: file.originalname,
          userId: userId,
          uploadDate: new Date().toISOString(),
          fileSize: file.size.toString(),
          mimeType: file.mimetype
        }
      };

      await blockBlobClient.upload(file.buffer, file.buffer.length, uploadOptions);
      
      return {
        fileName: fileName,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: blockBlobClient.url,
        uploadDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading file to Azure:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  async getFileBuffer(fileName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      const downloadResponse = await blockBlobClient.download();
      const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody);
      return buffer;
    } catch (error) {
      console.error('Error downloading file from Azure:', error);
      throw new Error('Failed to download file from storage');
    }
  }

  async deleteFile(fileName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.delete();
      return true;
    } catch (error) {
      console.error('Error deleting file from Azure:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  async getUserFiles(userId) {
    try {
      const files = [];
      const prefix = `${userId}/`;
      
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        const blockBlobClient = this.containerClient.getBlockBlobClient(blob.name);
        const properties = await blockBlobClient.getProperties();
        
        files.push({
          fileName: blob.name,
          originalName: properties.metadata?.originalName || blob.name,
          size: blob.properties.contentLength,
          mimeType: properties.metadata?.mimeType || 'application/octet-stream',
          uploadDate: properties.metadata?.uploadDate || blob.properties.lastModified,
          url: blockBlobClient.url
        });
      }
      
      return files;
    } catch (error) {
      console.error('Error listing user files:', error);
      throw new Error('Failed to retrieve user files');
    }
  }

  async streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}

module.exports = new AzureStorageService();