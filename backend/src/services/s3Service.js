const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'gst-saas-documents';
const LOCAL_STORAGE_PATH = path.join(__dirname, '../../storage/local-s3-fallback');

let s3Client = null;
let useLocalFallback = false;

function initS3Client() {
  if (s3Client !== null) {
    return s3Client;
  }

  const hasCredentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  if (!hasCredentials) {
    useLocalFallback = true;
    if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
      fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true });
    }
    console.warn(
      '[S3 Service] AWS credentials not configured. Using local file storage fallback.'
    );
    return null;
  }

  s3Client = new AWS.S3({
    region: AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  return s3Client;
}

function getLocalPath(s3Key) {
  const fullPath = path.join(LOCAL_STORAGE_PATH, s3Key);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return fullPath;
}

async function uploadFile(filePath, s3Key, contentType = 'application/octet-stream') {
  initS3Client();

  if (useLocalFallback) {
    const localPath = getLocalPath(s3Key);
    fs.copyFileSync(filePath, localPath);
    return `file://${localPath}`;
  }

  const fileContent = fs.readFileSync(filePath);
  await s3Client.putObject({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType
  }).promise();

  return `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
}

async function uploadBuffer(buffer, s3Key, contentType = 'application/octet-stream') {
  initS3Client();

  if (useLocalFallback) {
    const localPath = getLocalPath(s3Key);
    fs.writeFileSync(localPath, buffer);
    return `file://${localPath}`;
  }

  await s3Client.putObject({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType
  }).promise();

  return `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
}

async function downloadFile(s3Key, localPath) {
  initS3Client();

  if (useLocalFallback) {
    const sourcePath = getLocalPath(s3Key);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`File not found: ${s3Key}`);
    }
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(sourcePath, localPath);
    return localPath;
  }

  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const result = await s3Client.getObject({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key
  }).promise();

  fs.writeFileSync(localPath, result.Body);
  return localPath;
}

async function getSignedUrl(s3Key, expiresIn = 3600) {
  initS3Client();

  if (useLocalFallback) {
    const localPath = getLocalPath(s3Key);
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${s3Key}`);
    }
    return `file://${localPath}`;
  }

  const url = s3Client.getSignedUrl('getObject', {
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Expires: expiresIn
  });

  return url;
}

async function deleteFile(s3Key) {
  initS3Client();

  if (useLocalFallback) {
    const localPath = getLocalPath(s3Key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return;
  }

  await s3Client.deleteObject({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key
  }).promise();
}

async function listFiles(prefix) {
  initS3Client();

  if (useLocalFallback) {
    const basePath = path.join(LOCAL_STORAGE_PATH, prefix || '');
    if (!fs.existsSync(basePath)) {
      return [];
    }
    const files = [];
    const walk = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(LOCAL_STORAGE_PATH, fullPath);
        if (item.isDirectory()) {
          walk(fullPath);
        } else {
          files.push(relativePath.replace(/\\/g, '/'));
        }
      }
    };
    walk(basePath);
    return files;
  }

  const result = await s3Client.listObjectsV2({
    Bucket: S3_BUCKET_NAME,
    Prefix: prefix || ''
  }).promise();

  return (result.Contents || []).map((obj) => obj.Key);
}

async function uploadInvoicePDF(invoiceId, businessId, filePath) {
  const s3Key = `invoices/${businessId}/${invoiceId}.pdf`;
  return uploadFile(filePath, s3Key, 'application/pdf');
}

async function uploadGSTReturnJSON(returnId, businessId, returnType, period, jsonData) {
  const s3Key = `gst-returns/${businessId}/${returnType}/${period}.json`;
  const buffer = Buffer.from(
    typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData),
    'utf-8'
  );
  return uploadBuffer(buffer, s3Key, 'application/json');
}

async function getInvoicePDFUrl(invoiceId, businessId, expiresIn = 3600) {
  const s3Key = `invoices/${businessId}/${invoiceId}.pdf`;
  return getSignedUrl(s3Key, expiresIn);
}

async function getGSTReturnJSONUrl(returnId, businessId, returnType, period, expiresIn = 3600) {
  const s3Key = `gst-returns/${businessId}/${returnType}/${period}.json`;
  return getSignedUrl(s3Key, expiresIn);
}

function isConfigured() {
  initS3Client();
  return !useLocalFallback;
}

module.exports = {
  uploadFile,
  uploadBuffer,
  downloadFile,
  getSignedUrl,
  deleteFile,
  listFiles,
  uploadInvoicePDF,
  uploadGSTReturnJSON,
  getInvoicePDFUrl,
  getGSTReturnJSONUrl,
  isConfigured
};
