# cached-provider

Optimize data creation by synchronizing and caching

- Check cached object
    - If valid cache exist, return cached value (hitA)
- Synchronize execution
    - Check cached object
        - If valid cache exist, return cached value (hitS)
    - Call provider to update cached value
    - return cached value (miss)

# How to install

```shell
npm install cached-provider
```

# How to use

## Lazy Cache

Call provider once, and keep the result until TTL.

```typescript
const value = cached({
    ttl: 1000 * 60,// Cache TTL for get
    provider: async () => "slow data provider"
})
await value() // Access Value
```

## Eager Cache

In addition to lazy caching, run cache update automatically to minimize get latency

```typescript
const value = cached({
    ttl: 1000 * 60,// Cache TTL for get
    provider: async () => "slow data provider",
    autoUpdater: {
        interval: 1000 * 5, // Validate cache every 5 sec
        ttl: 1000 * 50, // Cache TTL for update , which should be smaller than TTL for get
    }
})
await value() // Access Value
```

## Smart Eager Cache

Adjust cache update interval based on user access.

```typescript
const value = cached({
    ttl: 1000 * 60 * 60,
    provider: async () => "slow data provider",
    autoUpdater: {
        interval: 1000 * 5, // Validate cache every 5 sec
        ttl: ({sinceAccessedAt}) => {
            // Cache TTL for update , which should be smaller than TTL for get
            // Use longer update cycle when the value is not accessed
            return (sinceAccessedAt !== undefined) && (sinceAccessedAt < 1000 * 60 * 10)
                ? 1000 * 50
                : 1000 * 60 * 59
        }
    }
})
await value() // Access Value
```

# How to shut down auto updater

If you specify onShouldContinue callback, cached provider ask you if it can continue running auto updater.

See example/example.ts for detail

```typescript
export type CachedProviderOptions<T> = {
    autoUpdater?: {
        onShouldContinue?: () => boolean
    }
}
```

# Monitoring Cache Behavior

onEvent callback allow you to monitor cache access in detail

See example/example.ts for detail

```typescript
export type CachedProviderOptions<T> = {
    onEvent?: CacheEventCallback
}
```

```typescript
export type MethodType = "get" | "update"
export type EventType = "hitA" | "hitS" | "miss"

export type CacheEvent = {
    methodType: MethodType
    eventType: EventType
    requestAt: Date
    responseAt: Date
    cachedAt: Date
}

export type CacheEventCallback = (event: CacheEvent) => void

```

## MethodType

| type   | description                    |
|--------|--------------------------------|
| get    | Get method call (on demand)    |
| update | Update method call (scheduled) |

## EventType

| type | description                                  |
|------|----------------------------------------------|
| hitA | Cache hit before synchronization. Super fast |
| hitS | Cache hit after synchronization. Fast        |
| miss | Cache miss, updated value. Slow              |

# Examples
```
% npx ts-node example/example.ts 
Sample: Lazy Cache
┌─────────┬────────────┬───────────┬───────┬─────┬─────┬─────┐
│ (index) │ methodType │ eventType │ count │ min │ avg │ max │
├─────────┼────────────┼───────────┼───────┼─────┼─────┼─────┤
│ 0       │ 'get'      │ 'hitA'    │ 38    │ 0   │ 0   │ 1   │
│ 1       │ 'get'      │ 'hitS'    │ 8     │ 98  │ 150 │ 201 │
│ 2       │ 'get'      │ 'miss'    │ 4     │ 300 │ 301 │ 302 │
└─────────┴────────────┴───────────┴───────┴─────┴─────┴─────┘
Sample: Lazy Cache with warmup
┌─────────┬────────────┬───────────┬───────┬─────┬─────┬─────┐
│ (index) │ methodType │ eventType │ count │ min │ avg │ max │
├─────────┼────────────┼───────────┼───────┼─────┼─────┼─────┤
│ 0       │ 'get'      │ 'hitA'    │ 40    │ 0   │ 0   │ 1   │
│ 1       │ 'get'      │ 'hitS'    │ 6     │ 99  │ 150 │ 203 │
│ 2       │ 'get'      │ 'miss'    │ 3     │ 301 │ 302 │ 303 │
└─────────┴────────────┴───────────┴───────┴─────┴─────┴─────┘
Sample: Eager Cache
┌─────────┬────────────┬───────────┬───────┬─────┬─────┬─────┐
│ (index) │ methodType │ eventType │ count │ min │ avg │ max │
├─────────┼────────────┼───────────┼───────┼─────┼─────┼─────┤
│ 0       │ 'get'      │ 'hitA'    │ 47    │ 0   │ 0   │ 1   │
│ 1       │ 'get'      │ 'hitS'    │ 2     │ 99  │ 149 │ 198 │
│ 2       │ 'get'      │ 'miss'    │ 1     │ 301 │ 301 │ 301 │
│ 3       │ 'update'   │ 'hitA'    │ 30    │ 0   │ 0   │ 1   │
│ 4       │ 'update'   │ 'hitS'    │ 12    │ 99  │ 150 │ 201 │
│ 5       │ 'update'   │ 'miss'    │ 5     │ 301 │ 302 │ 302 │
└─────────┴────────────┴───────────┴───────┴─────┴─────┴─────┘
Sample: Eager Cache with warmup
┌─────────┬────────────┬───────────┬───────┬─────┬─────┬─────┐
│ (index) │ methodType │ eventType │ count │ min │ avg │ max │
├─────────┼────────────┼───────────┼───────┼─────┼─────┼─────┤
│ 0       │ 'get'      │ 'hitA'    │ 50    │ 0   │ 0   │ 1   │
│ 1       │ 'update'   │ 'hitA'    │ 32    │ 0   │ 0   │ 1   │
│ 2       │ 'update'   │ 'hitS'    │ 15    │ 1   │ 140 │ 201 │
│ 3       │ 'update'   │ 'miss'    │ 6     │ 300 │ 301 │ 302 │
└─────────┴────────────┴───────────┴───────┴─────┴─────┴─────┘
```

# Version History

- 1.0.5
  - Enhance publish step
- 1.0.4
  - Use seq based id instead of UUID for object id
- 1.0.3
    - Add unit tests
- 1.0.2
    - Update README(typo)
- 1.0.1
    - Update README
- 1.0.0
    - Initial Release

# License

This project is under the MIT license.
Copyright (c) 2024 Tomohisa Ota