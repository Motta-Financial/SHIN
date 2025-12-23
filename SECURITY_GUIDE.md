# SHIN Application Security Guide

## Overview
This document outlines the security measures implemented in the SHIN application and best practices for maintaining data safety.

## 🔒 Security Measures Implemented

### 1. **Row Level Security (RLS)**
Every table in the database has RLS enabled, ensuring users can only access data they're authorized to see:

- **Students**: Can only view and update their own records
- **Directors**: Can view their assigned clients and teams
- **Admins**: Have full access to all data
- **Documents**: Users can only access documents they uploaded or are assigned to review

### 2. **Authentication & Authorization**
- Supabase Auth handles user authentication with secure password hashing
- Role-based access control (RBAC) with 4 roles: Admin, Director, Client, Student
- Automatic profile creation on signup with proper role assignment
- Session management with HTTP-only cookies (cannot be accessed by JavaScript)

### 3. **Data Validation**
- Email validation at the database level
- Input sanitization on all user inputs to prevent XSS attacks
- File type validation for uploads (only allowed document types)
- File size limits (10MB maximum)
- UUID validation for all ID parameters

### 4. **API Security**
- Rate limiting on API endpoints to prevent abuse
- Environment variables for all sensitive keys (never hardcoded)
- CORS configuration to only allow requests from authorized domains
- SQL injection prevention through parameterized queries

### 5. **Network Security**
- Security headers (X-Frame-Options, X-Content-Type-Options, CSP)
- HTTPS enforced for all connections
- Secure cookie attributes (HttpOnly, Secure, SameSite)

### 6. **Audit Logging**
- All sensitive data changes are logged to `audit_logs` table
- Tracks: user, action, timestamp, old/new values
- Only accessible to admins for compliance and investigation

### 7. **File Upload Security**
- Files stored in Vercel Blob with secure URLs
- Filename sanitization to prevent path traversal attacks
- File type restrictions
- User can only access their own uploaded files

## 🛡️ Security Best Practices

### For Administrators

1. **Regularly Review Audit Logs**
   - Check for suspicious activity
   - Monitor failed login attempts
   - Review data access patterns

2. **Manage User Roles Carefully**
   - Only grant admin privileges when necessary
   - Review and update user roles regularly
   - Remove inactive users promptly

3. **Environment Variables**
   - Never commit `.env` files to version control
   - Rotate API keys regularly
   - Use different keys for dev/staging/production

4. **Database Backups**
   - Supabase provides automatic daily backups
   - Test restoration procedures periodically

### For Developers

1. **Never Bypass RLS**
   - Always use the authenticated Supabase client
   - Never use service role key on the client side
   - Test RLS policies thoroughly

2. **Input Validation**
   - Validate all user inputs on both client and server
   - Use the provided validation utilities
   - Sanitize before displaying user-generated content

3. **Error Handling**
   - Never expose sensitive information in error messages
   - Log detailed errors server-side only
   - Show generic error messages to users

4. **Dependencies**
   - Keep all packages up to date
   - Review security advisories
   - Use `npm audit` regularly

## 🚨 Security Vulnerabilities Fixed

### Critical Issues Resolved:
1. ✅ `weekly_client_agenda` table had NO RLS policies - **FIXED**
2. ✅ Multiple Supabase client instances - **FIXED**
3. ✅ Missing email validation - **FIXED**
4. ✅ No audit logging - **FIXED**
5. ✅ Missing security headers - **FIXED**
6. ✅ No rate limiting - **FIXED**

## 📊 Data Access Matrix

| Role | Students | Clients | Directors | Debriefs | Documents | Evaluations |
|------|----------|---------|-----------|----------|-----------|-------------|
| **Student** | Own only | Assigned | Assigned | Own only | Own only | View only |
| **Client** | Team only | Own only | Assigned | Team only | Team only | Read only |
| **Director** | All in clinic | All in clinic | All | All in clinic | All in clinic | All in clinic |
| **Admin** | ALL | ALL | ALL | ALL | ALL | ALL |

## 🔐 Compliance

The application implements security measures aligned with:
- **GDPR**: User data protection and right to deletion
- **FERPA**: Student educational records protection
- **SOC 2**: Access controls and audit logging

## 🆘 Security Incident Response

If you suspect a security breach:
1. Immediately notify the system administrator
2. Document the incident with timestamps and details
3. Check audit logs for unauthorized access
4. Reset affected user credentials
5. Review and update RLS policies if needed

## 📞 Security Contacts

- Security Issues: Report via Vercel support
- Supabase Security: security@supabase.com
- System Administrator: [Your admin contact]

---

**Last Updated**: December 2025
**Next Security Review**: Quarterly
