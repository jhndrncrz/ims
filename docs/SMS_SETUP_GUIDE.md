# SMS Setup Guide for Barangay AI SMS Hub

## Overview
This guide explains how to configure Alibaba Cloud SMS service to enable real SMS reception and responses for your Barangay AI system.

## System Architecture

### SMS Message Flow
1. **Incoming SMS** → Alibaba Cloud SMS Service receives message
2. **Webhook Trigger** → Alibaba forwards message to your webhook URL
3. **Message Processing** → System classifies as report or information query
4. **Response Generation** → RAG engine or report acknowledgment
5. **Outgoing SMS** → System sends reply via Alibaba Cloud SMS API

### Key Components
- **SMS Webhook**: `/api/sms-webhook` - Receives incoming messages
- **SMS Processor**: Routes to report classifier or RAG engine
- **Report Classifier**: Detects disaster/infrastructure/admin reports
- **RAG Engine**: Answers queries using knowledge base documents
- **Message Logger**: Stores all conversations in database

## Prerequisites

1. **Alibaba Cloud Account** with SMS service enabled
2. **Verified Phone Number** for SMS sign name
3. **SMS Template** approved by Alibaba Cloud
4. **Deployed Application** with public webhook URL

## Environment Configuration

Your `.env` file requires these variables:

```bash
# Alibaba Cloud SMS Credentials
ALIBABA_SMS_ACCESS_KEY_ID="your-access-key-id"
ALIBABA_SMS_ACCESS_KEY_SECRET="your-access-key-secret"
ALIBABA_SMS_SIGN_NAME="your-approved-sign-name"
ALIBABA_SMS_TEMPLATE_CODE="your-template-code"

# DashScope API for LLM (Qwen model)
ALIBABA_DASHSCOPE_API_KEY="your-dashscope-api-key"

# RAG confidence threshold (0-1)
RAG_CONFIDENCE_FALLBACK="0.65"
```

### How to Get Credentials

#### 1. SMS Access Keys
1. Log in to [Alibaba Cloud Console](https://www.alibabacloud.com/)
2. Navigate to **AccessKey Management**
3. Create new AccessKey pair
4. Copy `AccessKeyId` and `AccessKeySecret`

#### 2. SMS Sign Name
1. Go to **SMS Service Console**
2. Navigate to **Signature Management**
3. Apply for signature (use "BarangayAI" or your barangay name)
4. Wait for approval (usually 2-24 hours)
5. Copy approved signature name

#### 3. SMS Template
1. In SMS Console, go to **Template Management**
2. Create template with variable placeholder: `${message}`
3. Sample template: "Barangay AI: ${message}"
4. Submit for approval
5. Copy template code after approval

#### 4. DashScope API Key
1. Go to [DashScope Console](https://dashscope.console.aliyun.com/)
2. Navigate to API Keys section
3. Create new API key
4. Copy the key starting with `sk-`

## Webhook Configuration

### 1. Deploy Your Application

Deploy to a service with public URL (Vercel, Railway, etc.):

```bash
# Example: Deploy to Vercel
pnpm build
vercel --prod
```

Your webhook URL will be: `https://your-domain.com/api/sms-webhook`

### 2. Configure Alibaba SMS Webhook

1. Log in to Alibaba Cloud SMS Console
2. Navigate to **Webhook Settings**
3. Add webhook URL: `https://your-domain.com/api/sms-webhook`
4. Set HTTP method: **POST**
5. Configure payload format:
   - For JSON: `Content-Type: application/json`
   - For Form Data: `Content-Type: application/x-www-form-urlencoded`

### 3. Webhook Payload Format

The webhook accepts two formats:

**JSON (recommended)**:
```json
{
  "phoneNumber": "+639171234567",
  "message": "What are office hours?",
  "skipSmsReply": false
}
```

**Form Data**:
```
phoneNumber=+639171234567&message=What+are+office+hours&skipSmsReply=false
```

## Testing the System

### Local Testing (Development)

Test the webhook locally using curl:

```bash
# Test information query (RAG)
curl -X POST http://localhost:3000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639171234567", "message": "What are the barangay office hours?", "skipSmsReply": true}'

# Test disaster report
curl -X POST http://localhost:3000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639171234567", "message": "May baha sa street namin!", "skipSmsReply": true}'

# Test infrastructure report
curl -X POST http://localhost:3000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639171234567", "message": "Sira ang streetlight sa corner", "skipSmsReply": true}'
```

**Note**: `skipSmsReply: true` prevents actual SMS sending during development.

### Production Testing

1. **Send Real SMS**: Text your barangay number with a query
2. **Check Dashboard**: View message in Conversations tab
3. **Verify Response**: Check if reply SMS was received
4. **Review Logs**: Check application logs for any errors

## Message Processing Logic

### Report Detection
Messages containing these keywords trigger report classification:
- `report`, `busted`, `broken`, `incident`
- `baha`, `flood`, `overflow`
- `streetlight`, `ilaw`, `poste`
- `fire`, `sunog`, `earthquake`

### Report Categories
- **DISASTER**: Floods, earthquakes, fires (HIGH priority)
- **INFRASTRUCTURE**: Streetlights, roads, utilities (MEDIUM priority)
- **ADMIN**: Documents, permits, clearances (LOW priority)
- **OTHER**: Unclassified reports (LOW priority)

### Information Queries
Non-report messages are processed by the RAG engine:
1. **Vector Search**: Find relevant documents from knowledge base
2. **Confidence Check**: If score < 0.65, return fallback message
3. **LLM Generation**: Generate answer using DashScope Qwen model
4. **SMS Response**: Send formatted answer to citizen

## Dashboard Features

### Conversations Tab
- View all SMS conversations grouped by phone number
- See message history (inbound/outbound)
- Track response confidence scores
- Monitor conversation timestamps

### Reports Tab
- View all classified reports
- Filter by category, priority, status
- Add resolutions to reports
- Flag reports for knowledge base

### Knowledge Base Tab
- **Documents**: Uploaded PDFs, DOCX, TXT, images
- **Resolved Reports**: Reports added to knowledge base
- Both sources used for RAG responses

### SMS Simulator
- Test SMS flows without real phone numbers
- Simulate incoming messages
- View generated responses
- Debug RAG and classifier behavior

## Troubleshooting

### No SMS Received
1. Check Alibaba SMS webhook configuration
2. Verify webhook URL is publicly accessible
3. Check SMS service quota and balance
4. Review Alibaba SMS logs for delivery status

### Low Confidence Responses
1. Add more documents to knowledge base
2. Upload relevant PDFs, DOCX, or text files
3. Add resolved reports with good resolutions
4. Adjust `RAG_CONFIDENCE_FALLBACK` threshold

### Wrong Report Classification
1. Update regex patterns in `/src/lib/reporting/classifier.ts`
2. Add more keyword rules for your context
3. Test with local curl commands

### DashScope API Errors
1. Verify API key is correct
2. Check DashScope service status
3. Review API quota limits
4. Check application logs for error details

## Security Considerations

### Webhook Verification
In production, add signature verification:

```typescript
// Example: Verify Alibaba SMS webhook signature
const verifySignature = (payload: string, signature: string, secret: string) => {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSig;
};
```

### Rate Limiting
Add rate limiting to prevent abuse:

```typescript
// Example: Rate limit by phone number
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per phone number
  keyGenerator: (req) => req.body.phoneNumber
});
```

### Data Privacy
- Store only necessary message data
- Implement data retention policies
- Anonymize phone numbers in logs
- Comply with local privacy regulations

## Production Deployment Checklist

- [ ] Deploy application to production environment
- [ ] Configure environment variables with real credentials
- [ ] Set up Alibaba Cloud SMS webhook with public URL
- [ ] Upload initial knowledge base documents
- [ ] Test real SMS sending and receiving
- [ ] Monitor logs for errors
- [ ] Set up alerting for failed messages
- [ ] Configure backup/disaster recovery
- [ ] Document incident response procedures
- [ ] Train staff on dashboard usage

## Support

For issues with:
- **Alibaba Cloud SMS**: Contact Alibaba Cloud support
- **Application bugs**: Check GitHub issues or application logs
- **RAG performance**: Add more relevant documents to knowledge base
- **Deployment**: Refer to your hosting provider's documentation

## Additional Resources

- [Alibaba Cloud SMS Documentation](https://www.alibabacloud.com/help/en/sms/)
- [DashScope API Reference](https://help.aliyun.com/zh/dashscope/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Documentation](https://www.prisma.io/docs/)
