# User Deletion Service Guide

## Overview

The CareerBridge AI platform now includes a comprehensive user deletion system with multiple deletion types, security controls, and admin management features. This guide covers all deletion operations available in the system.

## ✅ Task Completion Summary

**The user deletion service has been successfully implemented and is now fully operational!**

### What Was Fixed

1. **Circular Dependency Issue**: Resolved using `forwardRef()` in module imports
2. **JWT Guard Error**: Fixed by properly importing `AuthModule` in all modules using `JwtAuthGuard`
3. **Server Connectivity**: Confirmed server running on port 5000 with all endpoints working

### What Was Implemented

1. **Complete User Deletion Service** with 7 different operations
2. **Security Controls** with role-based permissions and confirmation codes
3. **Audit Logging** for all deletion operations
4. **Data Cascade** handling for related records
5. **API Endpoints** with full Swagger documentation

## Deletion Types

### 1. Soft Delete (Recommended)

- **Purpose**: Marks user as deleted but preserves all data
- **Reversible**: Yes, users can be restored
- **Data Retention**: All user data is maintained with `deletedAt` timestamp
- **Use Cases**: Policy violations, temporary suspensions, user disputes

### 2. Hard Delete (Permanent)

- **Purpose**: Permanently removes all user data from the system
- **Reversible**: No, this action is irreversible
- **Data Retention**: All data is permanently deleted
- **Security**: Requires super admin privileges and confirmation code
- **Use Cases**: GDPR compliance, legal requirements, security breaches

### 3. Self-Delete

- **Purpose**: Allows users to delete their own accounts
- **Security**: Requires password verification
- **Type**: Soft delete (can be restored within 30 days)
- **Use Cases**: User-initiated account closure

### 4. Automated Cleanup

- **Purpose**: Permanently deletes old soft-deleted users
- **Schedule**: Can be run manually or scheduled
- **Default**: Users soft-deleted for 30+ days
- **Security**: Super admin only

## API Endpoints

### Self-Delete Account

```http
DELETE /api/users/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "password": "currentPassword123",
  "reason": "No longer need the service"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Account deleted successfully. You can contact support within 30 days to restore your account."
}
```

### Admin Soft Delete User

```http
DELETE /api/users/{userId}/soft
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User soft deleted successfully",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "deletedAt": "2024-01-15T10:30:00Z",
    "accountStatus": "INACTIVE"
  }
}
```

### Super Admin Hard Delete User

```http
DELETE /api/users/{userId}/hard
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json

{
  "confirmationCode": "HARD_DELETE_123e4567-e89b-12d3-a456-426614174000_2024-01-15"
}
```

**Response:**

```json
{
  "message": "User permanently deleted successfully",
  "deletedData": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "role": "STUDENT",
    "educationRecords": 2,
    "experienceRecords": 1,
    "skillRecords": 5,
    "postsCount": 10,
    "commentsCount": 25,
    "applicationsCount": 3,
    "messagesCount": 50,
    "documentsCount": 4,
    "deletedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Restore Deleted User

```http
PATCH /api/users/{userId}/restore
Authorization: Bearer <admin_jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "deletedAt": null,
    "accountStatus": "ACTIVE"
  }
}
```

### Get Deleted Users (Admin)

```http
GET /api/users/admin/deleted?page=1&limit=10
Authorization: Bearer <admin_jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "deletedAt": "2024-01-15T10:30:00Z",
      "role": "STUDENT"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Cleanup Old Deleted Users

```http
POST /api/users/admin/cleanup
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json

{
  "daysOld": 30
}
```

**Response:**

```json
{
  "message": "Cleanup completed. 5 users permanently deleted.",
  "deletedCount": 5
}
```

## Security & Permissions

### Role-Based Access Control

| Operation    | Required Role      | Additional Security        |
| ------------ | ------------------ | -------------------------- |
| Self-Delete  | Any User           | Password verification      |
| Soft Delete  | Admin, Super Admin | Cannot delete own account  |
| Hard Delete  | Super Admin Only   | Confirmation code required |
| Restore User | Admin, Super Admin | -                          |
| View Deleted | Admin, Super Admin | -                          |
| Cleanup      | Super Admin Only   | -                          |

### Security Measures

1. **Confirmation Codes**: Hard deletes require daily-generated confirmation codes
2. **Self-Protection**: Users cannot delete their own admin accounts
3. **Admin Hierarchy**: Only super admins can delete other admins
4. **Audit Logging**: All deletion operations are logged in security logs
5. **Password Verification**: Self-deletes require current password

### Confirmation Code Format

```
HARD_DELETE_{userId}_{YYYY-MM-DD}
```

Example: `HARD_DELETE_123e4567-e89b-12d3-a456-426614174000_2024-01-15`

## Testing the Service

### 1. Test Server Status

```bash
curl -X GET http://localhost:5000/api/auth/health
# Should return: {"status":"ok",...}
```

### 2. Test Protected Endpoint (Should return 401 with invalid token)

```bash
curl -X GET http://localhost:5000/api/users/me -H "Authorization: Bearer invalid-token"
# Should return: {"message":"Unauthorized","statusCode":401}
```

### 3. Test Self-Delete (With valid JWT)

```bash
curl -X DELETE http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "yourPassword", "reason": "Testing"}'
```

## Data Affected by Deletion

When a user is deleted (soft or hard), the following data is affected:

### User Profile Data

- Personal information
- Profile pictures and avatars
- Resume files and documents
- Account settings and preferences

### Educational & Professional Data

- Education records
- Work experience entries
- Skills and endorsements
- Certifications and achievements

### Social & Communication Data

- Posts and comments
- Messages and conversations
- Notifications
- Chat group memberships

### Application & Job Data

- Job applications
- Posted job listings (for employers)
- Application status and feedback
- Interview schedules

### System Data

- Security logs (preserved for auditing)
- Session data
- Two-factor authentication settings
- Trusted devices

## Error Handling

### Common Error Responses

#### Insufficient Permissions (403)

```json
{
  "message": "Only admins can delete users",
  "statusCode": 403
}
```

#### User Not Found (404)

```json
{
  "message": "User not found",
  "statusCode": 404
}
```

#### User Already Deleted (409)

```json
{
  "message": "User is already deleted",
  "statusCode": 409
}
```

#### Invalid Confirmation Code (403)

```json
{
  "message": "Invalid confirmation code for hard delete",
  "statusCode": 403
}
```

#### Invalid Password (403)

```json
{
  "message": "Invalid password",
  "statusCode": 403
}
```

## Monitoring & Analytics

### Metrics to Track

- Number of self-deletions per month
- Admin deletion frequency and reasons
- User restoration rates
- Cleanup operation results
- Failed deletion attempts

### Alerts to Configure

- Multiple failed hard delete attempts
- Unusual spikes in user deletions
- Failed cleanup operations
- Restoration requests after hard deletes

## Compliance Considerations

### GDPR Compliance

- Hard delete ensures complete data removal
- Soft delete maintains audit trail while respecting deletion requests
- Users can request immediate hard deletion for GDPR compliance

### Data Retention Policies

- Configure appropriate retention periods
- Document deletion policies clearly
- Provide users with clear information about data handling

---

## Support

For questions or issues with the user deletion system:

1. Check error messages and status codes
2. Verify user permissions and roles
3. Review security logs for audit trail
4. Contact system administrators for escalation

**Last Updated**: June 19, 2025
**Version**: 1.0.0
