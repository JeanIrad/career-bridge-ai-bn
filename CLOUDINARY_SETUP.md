# Cloudinary File Upload System - CareerBridge AI

## Overview

The CareerBridge platform now includes a comprehensive file upload system using Cloudinary for secure storage and management of documents including resumes, degree certificates, and verification documents for students and employers.

## 🚀 Features Implemented

### ✅ **Core Upload Functionality**

- **Resume Upload**: PDF, DOC, DOCX files (5MB limit)
- **Profile Pictures**: JPG, PNG, WEBP images (5MB limit)
- **Degree Certificates**: PDF, JPG, PNG files (10MB limit)
- **Automatic Image Optimization**: Profile pictures resized to 400x400px
- **Secure Storage**: All files stored in organized Cloudinary folders

### ✅ **Database Integration**

- **Document Model**: Complete tracking of uploaded files
- **Verification System**: Document verification workflow for admins
- **User Relations**: Linked to user profiles and resume/avatar fields
- **Metadata Storage**: File size, MIME type, upload timestamps

### ✅ **Security Features**

- **File Type Validation**: Strict MIME type checking
- **Size Limits**: Configurable file size restrictions
- **Authentication**: JWT-protected upload endpoints
- **Temporary Storage**: Files cleaned up after Cloudinary upload

## 📁 File Structure

```
src/upload/
├── upload.module.ts        # Upload module configuration
├── upload.service.ts       # Core upload logic and Cloudinary integration
└── upload.controller.ts    # API endpoints for file operations

prisma/
└── schema.prisma          # Document model and enums
```

## 🔧 Setup Instructions

### 1. **Cloudinary Account Setup**

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. **Environment Variables**

Add these to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 3. **Database Migration**

The Document model has been added to Prisma schema:

```bash
# Migration already applied
npx prisma migrate dev --name add-document-model
```

### 4. **Directory Structure**

```bash
# Upload directories (already created)
mkdir -p uploads/temp
```

## 📡 API Endpoints

### **Authentication Required**

All upload endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### **Resume Upload**

```bash
POST /upload/resume
Content-Type: multipart/form-data

# Form data:
file: [resume.pdf|resume.doc|resume.docx]
```

**Response:**

```json
{
  "message": "Resume uploaded successfully",
  "document": {
    "id": "doc-uuid",
    "originalName": "resume.pdf",
    "url": "https://res.cloudinary.com/.../resume.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "verificationStatus": "PENDING"
  }
}
```

### **Profile Picture Upload**

```bash
POST /upload/profile-picture
Content-Type: multipart/form-data

# Form data:
file: [profile.jpg|profile.png|profile.webp]
```

**Response:**

```json
{
  "message": "Profile picture uploaded successfully",
  "document": {
    "id": "doc-uuid",
    "originalName": "profile.jpg",
    "url": "https://res.cloudinary.com/.../profile_400x400.jpg",
    "fileSize": 256000,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **Get User Documents**

```bash
GET /upload/documents
GET /upload/documents?documentType=RESUME
```

**Response:**

```json
{
  "message": "Documents retrieved successfully",
  "documents": [
    {
      "id": "doc-uuid",
      "documentType": "RESUME",
      "originalName": "resume.pdf",
      "url": "https://res.cloudinary.com/.../resume.pdf",
      "fileSize": 1024000,
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "verificationStatus": "PENDING",
      "isVerified": false,
      "verificationNotes": null
    }
  ]
}
```

### **Delete Document**

```bash
DELETE /upload/documents/{documentId}
```

**Response:**

```json
{
  "message": "Document deleted successfully"
}
```

### **Upload Guidelines**

```bash
GET /upload/guidelines
```

**Response:**

```json
{
  "message": "Upload guidelines retrieved successfully",
  "guidelines": {
    "resume": {
      "allowedFormats": ["PDF", "DOC", "DOCX"],
      "maxSize": "5MB",
      "description": "Upload your latest resume or CV"
    },
    "profilePicture": {
      "allowedFormats": ["JPG", "PNG", "WEBP"],
      "maxSize": "5MB",
      "description": "Upload a professional profile picture",
      "note": "Images will be automatically resized to 400x400 pixels"
    },
    "general": {
      "maxFileSize": "10MB",
      "note": "All documents are securely stored and may require verification"
    }
  }
}
```

## 🗄️ Database Schema

### **Document Model**

```prisma
model Document {
  id                  String             @id @default(uuid())
  userId              String
  documentType        DocumentType
  originalName        String
  cloudinaryPublicId  String
  cloudinaryUrl       String
  fileSize            Int
  mimeType            String
  uploadedAt          DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  isVerified          Boolean            @default(false)
  verificationStatus  VerificationStatus @default(PENDING)
  verificationNotes   String?
  verifiedAt          DateTime?
  verifiedBy          String?

  user                User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([documentType])
  @@index([verificationStatus])
}
```

### **Document Types**

```prisma
enum DocumentType {
  RESUME
  DEGREE_CERTIFICATE
  TRANSCRIPT
  ID_DOCUMENT
  BUSINESS_LICENSE
  COMPANY_REGISTRATION
  PORTFOLIO
  COVER_LETTER
  RECOMMENDATION_LETTER
  PROFILE_PICTURE
  COMPANY_LOGO
  OTHER
}
```

### **Verification Status**

```prisma
enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
  REQUIRES_RESUBMISSION
}
```

## 🔒 Security Features

### **File Validation**

- **MIME Type Checking**: Only allowed file types accepted
- **File Size Limits**: Configurable per document type
- **Extension Validation**: Double-checking file extensions

### **Upload Security**

- **Authenticated Uploads**: JWT required for all uploads
- **User Isolation**: Users can only access their own documents
- **Temporary Storage**: Local files cleaned up immediately

### **Cloudinary Security**

- **Organized Folders**: Files stored in user-specific folders
- **Unique Filenames**: Prevents filename conflicts
- **Secure URLs**: HTTPS delivery by default

## 📂 Cloudinary Folder Structure

```
career-bridge/
├── resumes/
│   └── {userId}/
│       └── resume_files
├── profile-pictures/
│   └── {userId}/
│       └── profile_images
├── certificates/
│   └── {userId}/
│       └── certificate_files
├── transcripts/
│   └── {userId}/
│       └── transcript_files
├── id-documents/
│   └── {userId}/
│       └── id_files
├── business-licenses/
│   └── {userId}/
│       └── business_files
└── company-logos/
    └── {userId}/
        └── logo_files
```

## 🔧 Configuration Options

### **File Size Limits**

```typescript
// Current limits (configurable in service)
const FILE_LIMITS = {
  RESUME: 5 * 1024 * 1024, // 5MB
  PROFILE_PICTURE: 5 * 1024 * 1024, // 5MB
  CERTIFICATE: 10 * 1024 * 1024, // 10MB
  GENERAL: 10 * 1024 * 1024, // 10MB
};
```

### **Image Transformations**

```typescript
// Profile picture transformations
const PROFILE_TRANSFORMATIONS = [
  { width: 400, height: 400, crop: 'fill', gravity: 'face' },
  { quality: 'auto', fetch_format: 'auto' },
];
```

## 🚀 Usage Examples

### **Frontend Integration (React/Next.js)**

```typescript
// Upload resume
const uploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/resume', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};

// Upload profile picture
const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/profile-picture', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};

// Get user documents
const getUserDocuments = async () => {
  const response = await fetch('/api/upload/documents', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
```

### **Mobile Integration (React Native)**

```typescript
import DocumentPicker from 'react-native-document-picker';

const uploadDocument = async () => {
  try {
    const result = await DocumentPicker.pick({
      type: [
        DocumentPicker.types.pdf,
        DocumentPicker.types.doc,
        DocumentPicker.types.docx,
      ],
    });

    const formData = new FormData();
    formData.append('file', {
      uri: result[0].uri,
      type: result[0].type,
      name: result[0].name,
    } as any);

    const response = await fetch(`${API_URL}/upload/resume`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    return response.json();
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

## 🔄 Future Enhancements

### **Planned Features**

1. **Additional Document Types**:

   - Business licenses for employers
   - Company registration documents
   - Portfolio files
   - Recommendation letters

2. **Advanced Verification**:

   - Admin verification dashboard
   - Automated document analysis
   - Verification notifications

3. **Enhanced Security**:

   - Virus scanning integration
   - Advanced file type detection
   - Rate limiting for uploads

4. **Performance Optimizations**:
   - Progressive image loading
   - CDN optimization
   - Batch upload support

## 🛠️ Troubleshooting

### **Common Issues**

1. **Upload Fails**:

   - Check Cloudinary credentials
   - Verify file size limits
   - Ensure uploads/temp directory exists

2. **File Not Found**:

   - Check Cloudinary public_id
   - Verify folder permissions
   - Check database document records

3. **Authentication Errors**:
   - Verify JWT token validity
   - Check user permissions
   - Ensure proper headers

### **Debug Commands**

```bash
# Check upload directory
ls -la uploads/temp/

# Test Cloudinary connection
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('Cloudinary config:', cloudinary.config());
"

# Check database documents
npx prisma studio
```

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [NestJS File Upload Guide](https://docs.nestjs.com/techniques/file-upload)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Prisma Documentation](https://www.prisma.io/docs)

## ✅ System Status

**✅ Core Implementation Complete**

- [x] Cloudinary integration
- [x] Database models
- [x] API endpoints
- [x] File validation
- [x] Security measures

**🔄 Ready for Extension**

- [ ] Additional document types
- [ ] Admin verification system
- [ ] Advanced image processing
- [ ] Batch operations

The Cloudinary file upload system is now fully integrated and ready for production use!
