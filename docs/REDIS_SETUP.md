# Redis Setup for Production Caching

## Overview
ClaimGuardian uses Redis for caching AI responses and improving performance. The caching infrastructure is already implemented in the `@claimguardian/ai-services` package.

## Production Setup Options

### Option 1: Upstash Redis (Recommended for Vercel)
Upstash provides a serverless Redis service that works well with Vercel deployments.

1. **Sign up at [Upstash](https://upstash.com/)**
2. **Create a new Redis database**
   - Choose a region close to your Vercel deployment
   - Enable "Eviction" with LRU policy
   - Set max memory to at least 256MB

3. **Get your Redis URL**
   - Format: `redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379`

### Option 2: Redis Cloud
Redis Cloud provides managed Redis hosting with good performance.

1. **Sign up at [Redis Cloud](https://redis.com/cloud/)**
2. **Create a new subscription**
3. **Get your connection string**

### Option 3: Self-hosted Redis
For more control, you can host Redis on your own infrastructure.

## Environment Variable Configuration

Add to your Vercel environment variables:

```bash
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

## Features Using Cache

The following AI features benefit from Redis caching:

1. **Settlement Analyzer (Max)** - 24-hour cache for market analysis
2. **Policy Chat (Clarity)** - 7-day cache for document analysis
3. **Damage Analyzer** - 24-hour cache for damage assessments
4. **Document Extraction** - 7-day cache for extracted data
5. **Communication Helper (Clara)** - 1-hour cache for emotional responses

## Cache Configuration

The cache TTL (Time To Live) is automatically configured per feature:

- **Document-based features**: 7 days (documents rarely change)
- **Market analysis**: 24 hours (daily updates)
- **Real-time features**: 1 hour (freshness required)
- **Default**: 3 hours

## Monitoring Cache Performance

Cache statistics are tracked automatically:
- Hit rate
- Cache misses
- Total cached responses
- Memory usage

## Testing Redis Connection

After setting up Redis, test the connection:

```bash
# Install Redis CLI
npm install -g redis-cli

# Test connection
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

## Benefits

1. **Reduced API Costs**: Cached AI responses reduce API calls
2. **Faster Response Times**: Instant responses for cached queries
3. **Better User Experience**: No waiting for repeated analyses
4. **Scalability**: Handle more users without increasing AI costs

## Security Notes

- Never expose your Redis URL in client-side code
- Use environment variables for all credentials
- Enable SSL/TLS for Redis connections (included in Upstash)
- Set up IP allowlisting if available

## Next Steps

1. Choose a Redis provider
2. Create your Redis instance
3. Add `REDIS_URL` to Vercel environment variables
4. Deploy and monitor cache hit rates