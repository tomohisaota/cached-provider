import {synchronized} from "./synchronized";
import {CachedProviderOptions, EventType, MethodType} from "./types";

type Holder<T> = {
    readonly cachedObj: T
    readonly cachedAt: Date
}

export class CachedLazyProvider<T> {

    readonly options: CachedProviderOptions<T> & Required<Pick<CachedProviderOptions<T>, "onEvent">>

    cacheHolder?: Holder<T>

    accessedAt?: Date

    constructor(options: CachedProviderOptions<T>) {
        this.options = {
            onEvent: () => {
            },
            ...options
        }
    }

    async get(): Promise<T> {
        const o = this._getOrUpdateThenEmit("get")
        this.accessedAt = new Date()
        return o
    }

    async update(): Promise<void> {
        await this._getOrUpdateThenEmit("update")
    }

    private _timeToLive(type: MethodType, holder: Holder<T>): number {
        const ttl = type === "get"
            ? this.options.ttl
            : (this.options.autoUpdater?.ttl ?? this.options.ttl)
        if (typeof ttl === 'number') {
            return ttl
        }
        const now = new Date().getTime()
        const {accessedAt} = this
        return ttl({
            ...holder,
            accessedAt,
            //
            now,
            sinceCachedAt: now - holder.cachedAt.getTime(),
            sinceAccessedAt: accessedAt
                ? now - accessedAt.getTime()
                : undefined
        })
    }

    private _timeUntilExpire(type: MethodType, holder: Holder<T>): number {
        const elapsed = new Date().getTime() - holder.cachedAt.getTime()
        return this._timeToLive(type, holder) - elapsed
    }

    private _isExpired(type: MethodType, holder: Holder<T>): boolean {
        return this._timeUntilExpire(type, holder) <= 0
    }

    private async _getOrUpdateThenEmit(methodType: MethodType): Promise<T> {
        const requestAt = new Date()
        const eventType = await this._getOrUpdate(methodType)
        const responseAt = new Date()
        const {accessedAt} = this
        const {cachedObj, cachedAt} = this.cacheHolder!
        this.options.onEvent({
            cachedObj, cachedAt, accessedAt: accessedAt,
            eventType, methodType, requestAt, responseAt,
        })
        return cachedObj
    }

    private async _getOrUpdate(type: MethodType): Promise<EventType> {
        if (this.cacheHolder && !this._isExpired(type, this.cacheHolder)) {
            return "hitA"
        }
        return synchronized(this)(
            async () => {
                if (this.cacheHolder && !this._isExpired(type, this.cacheHolder)) {
                    return "hitS"
                }
                // Update Cache
                this.cacheHolder = {
                    cachedObj: await this.options.provider(),
                    cachedAt: new Date()
                }
                return "miss"
            }
        )
    }
}
