# Signup Webhook Integration Guide

## Overview

When a user signs up on your SaaS website, call the Naano signup webhook to upgrade their attribution from "inferred" (probabilistic) to "confirmed" (deterministic). This links the signup to the original click and enriches your lead data.

## Endpoint

```
POST https://naano.com/api/track/signup
```

## Authentication

No authentication required. The webhook uses the `session_id` to securely link the signup to the click.

## Request Format

```json
{
  "session_id": "naano_session_xxx",
  "email": "user@example.com",
  "company": "Acme Corporation",
  "name": "John Doe",
  "job_title": "CTO",
  "linkedin_url": "https://linkedin.com/in/johndoe"
}
```

### Required Fields
- `session_id`: The Naano session ID from the `naano_session` cookie
- `email`: User's email address
- `company`: User's company name

### Optional Fields
- `name`: User's full name
- `job_title`: User's job title
- `linkedin_url`: User's LinkedIn profile URL

## Response Format

### Success (200)
```json
{
  "success": true,
  "message": "Signup attribution upgraded successfully",
  "result": {
    "action": "upgraded",
    "company": "Acme Corporation",
    "company_inference_id": "uuid-here"
  },
  "lead_id": "uuid-here",
  "company_inference_id": "uuid-here"
}
```

### Mismatch (200)
If the signup company doesn't match the inferred company:
```json
{
  "success": true,
  "result": {
    "action": "mismatch_handled",
    "old_company": "Inferred Company Inc",
    "new_company": "Acme Corporation",
    "company_inference_id": "uuid-here"
  }
}
```

### Error (400/404/500)
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Implementation Example

### JavaScript/TypeScript
```typescript
async function handleUserSignup(userData: {
  email: string;
  name: string;
  company: string;
  jobTitle?: string;
  linkedinUrl?: string;
}) {
  // Get Naano session ID from cookie
  const sessionId = getCookie('naano_session');
  
  if (!sessionId) {
    console.warn('No Naano session found - user may not have clicked tracking link');
    return;
  }

  try {
    const response = await fetch('https://naano.com/api/track/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        email: userData.email,
        company: userData.company,
        name: userData.name,
        job_title: userData.jobTitle,
        linkedin_url: userData.linkedinUrl,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Attribution upgraded:', result);
      
      if (result.result.action === 'mismatch_handled') {
        console.warn('Company mismatch detected:', {
          inferred: result.result.old_company,
          actual: result.result.new_company,
        });
      }
    } else {
      console.error('Failed to upgrade attribution:', result.error);
    }
  } catch (error) {
    console.error('Error calling signup webhook:', error);
    // Don't block signup flow - attribution is non-critical
  }
}
```

### Python
```python
import requests
from flask import request

def handle_user_signup(user_data):
    session_id = request.cookies.get('naano_session')
    
    if not session_id:
        print('No Naano session found')
        return
    
    try:
        response = requests.post(
            'https://naano.com/api/track/signup',
            json={
                'session_id': session_id,
                'email': user_data['email'],
                'company': user_data['company'],
                'name': user_data['name'],
                'job_title': user_data.get('job_title'),
                'linkedin_url': user_data.get('linkedin_url'),
            }
        )
        
        result = response.json()
        
        if result.get('success'):
            print(f"Attribution upgraded: {result}")
        else:
            print(f"Error: {result.get('error')}")
    except Exception as e:
        print(f"Error calling webhook: {e}")
```

## When to Call

Call the webhook immediately after:
1. User successfully signs up
2. User completes onboarding
3. User provides company information

**Best Practice:** Call it asynchronously (don't block the signup flow) since attribution is non-critical for the user experience.

## Error Handling

### No Session Found (404)
- User may not have clicked a Naano tracking link
- This is OK - just log and continue
- Don't block the signup flow

### No Company Inference (404)
- Company enrichment may not have completed yet
- Wait a few seconds and retry, or skip
- The click will still be tracked, just not enriched

### Other Errors (500)
- Log the error
- Don't block signup
- Attribution will remain as "inferred" until manually upgraded

## What Happens

1. **Finds the click event** by `session_id`
2. **Creates/updates the lead** with signup data
3. **Upgrades company inference** from "inferred" → "confirmed"
4. **Updates all related inferences** for the same company
5. **Handles mismatches** if signup company ≠ inferred company

## Benefits

- ✅ Accurate attribution: Know which creator generated the signup
- ✅ Enriched leads: Company, name, email, job title all linked
- ✅ Better analytics: Confirmed companies vs. inferred
- ✅ Sales intelligence: See which companies are actually signing up

## Privacy

- Only company-level data is inferred pre-signup
- Personal data (email, name) only collected after user provides it
- All data subject to your privacy policy and GDPR compliance

