# API Security & Access Control

## Overview

This document outlines the security measures and access control implemented for the Career Bridge AI backend APIs.

## Authentication & Authorization

### 1. JWT Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### 2. Role-Based Access Control (RBAC)

#### User Roles Hierarchy:

- `SUPER_ADMIN` - Full system access
- `ADMIN` - Administrative access to user management
- `EMPLOYER` - Access to employer-specific features
- `STUDENT` - Access to student-specific features
- `PROFESSOR` - Access to academic features
- `ALUMNI` - Access to alumni features
- `MENTOR` - Access to mentoring features
- `UNIVERSITY_STAFF` - Access to university administration
- `OTHER` - Basic user access

### 3. Guards Implementation

#### JwtAuthGuard

- Validates JWT tokens
- Ensures user is authenticated
- Required for all protected endpoints

#### RolesGuard

- Checks user roles against required permissions
- Uses `@Roles()` decorator to specify allowed roles
- Works in conjunction with JWT authentication

#### EmployerDataGuard

- Additional security layer for employer data
- Ensures employers only access their own data
- Allows admins to access any employer data

## Employer Analytics API Security

### Endpoints Protection

All employer analytics endpoints are protected with multiple guards:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, EmployerDataGuard)
@Roles(UserRole.EMPLOYER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
```

### Access Permissions:

#### Dashboard Overview (`/employer-analytics/dashboard-overview`)

- **EMPLOYER**: Can view only their own analytics data
- **ADMIN**: Can view any employer's analytics data
- **SUPER_ADMIN**: Full access to all analytics data

#### Application Trends (`/employer-analytics/application-trends`)

- **EMPLOYER**: Own data only, filtered by their user ID
- **ADMIN/SUPER_ADMIN**: Can specify employer ID or view aggregated data

#### Candidate Sources (`/employer-analytics/candidate-sources`)

- **EMPLOYER**: Sources for applications to their jobs only
- **ADMIN/SUPER_ADMIN**: System-wide candidate source analytics

#### Hiring Funnel (`/employer-analytics/hiring-funnel`)

- **EMPLOYER**: Funnel metrics for their job postings only
- **ADMIN/SUPER_ADMIN**: Can view any employer's funnel or system-wide metrics

#### Skills Demand (`/employer-analytics/skills-demand`)

- **ALL AUTHORIZED ROLES**: System-wide skills demand data
- Data is not employer-specific

#### University Rankings (`/employer-analytics/university-rankings`)

- **EMPLOYER**: Rankings based on applications to their jobs
- **ADMIN/SUPER_ADMIN**: System-wide or employer-specific rankings

#### Performance Metrics (`/employer-analytics/performance-metrics`)

- **EMPLOYER**: Their recruitment performance metrics only
- **ADMIN/SUPER_ADMIN**: Any employer's performance metrics

#### Recent Activities (`/employer-analytics/recent-activities`)

- **EMPLOYER**: Activities related to their job postings only
- **ADMIN/SUPER_ADMIN**: Can view any employer's activities

## Data Isolation

### Employer Data Separation

- Employers automatically see only data related to their posted jobs
- All queries are filtered by `postedById: req.user.id`
- No cross-employer data leakage

### Admin Access

- Admins can access any employer's data for support purposes
- All admin actions are logged for audit trails
- Super admins have unrestricted access

## Error Handling

### Security-Related Error Responses:

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "JWT token missing or invalid"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Access denied: Insufficient permissions",
  "error": "Forbidden"
}
```

## Migration Security

### Database Migrations

- All new models include proper indexes for security queries
- Foreign key constraints ensure data integrity
- Migration files are version-controlled and auditable

### Migration File: `20250622094745_add_analytics_models`

- Added Interview model with proper access controls
- Added CandidateSource model for analytics
- Added SkillInDemand model for trending data
- Added CompanyReview model with reviewer privacy controls

## Testing Security

### Security Test Script

Run the security test to verify access controls:

```bash
node test-analytics-security.js
```

### Test Coverage:

- ✅ JWT Authentication enforcement
- ✅ Role-based access control
- ✅ Data isolation between employers
- ✅ Unauthorized access prevention
- ✅ Error response validation

## Best Practices

### 1. Token Management

- JWT tokens should be stored securely on the client
- Implement token refresh mechanism
- Set appropriate token expiration times

### 2. API Rate Limiting

- Implement rate limiting to prevent abuse
- Use different limits for different user roles
- Monitor suspicious activity patterns

### 3. Audit Logging

- Log all admin actions
- Track data access patterns
- Monitor for unauthorized access attempts

### 4. Data Validation

- Validate all input parameters
- Sanitize user inputs to prevent injection attacks
- Implement request size limits

## Compliance

### Data Protection

- Employer data is isolated and secure
- Personal information is properly protected
- Analytics data is anonymized where appropriate

### Access Audit

- All API access is logged
- Role changes are tracked
- Security events are monitored

## Future Enhancements

### Planned Security Improvements:

1. **IP Whitelisting**: Restrict access by IP ranges
2. **API Versioning**: Secure versioning strategy
3. **Advanced Analytics**: Security analytics dashboard
4. **Multi-factor Authentication**: Additional security layer
5. **Data Encryption**: Enhanced data protection

---

_Last Updated: December 22, 2024_
_Version: 1.0_
