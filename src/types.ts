export type TTLProvider<T> = number | ((args: {
    cachedObj: T
    cachedAt: Date,
    accessedAt?: Date
    //
    now: number,
    sinceCachedAt: number
    sinceAccessedAt?: number
}) => number)

export type ValueProvider<T> = () => Promise<T>

export type MethodType = "get" | "update"
export type EventType = "hitA" | "hitS" | "miss"

export type CacheEvent<T> = {
    cachedObj: T
    cachedAt: Date
    accessedAt?: Date
    //
    methodType: MethodType
    eventType: EventType
    requestAt: Date
    responseAt: Date
}

export type CacheEventCallback<T> = (event: CacheEvent<T>) => void

export type CachedProviderOptions<T> = {
    ttl: TTLProvider<T>
    provider: ValueProvider<T>
    onEvent?: CacheEventCallback<T>
    autoUpdater?: {
        interval: number,
        ttl?: TTLProvider<T>
        onShouldContinue?: () => boolean
        onError?: (err: unknown) => void
    }
}

