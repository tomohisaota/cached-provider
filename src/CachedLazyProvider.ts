import {synchronized} from "./synchronized";
import {CachedProviderOptions, EventType, MethodType} from "./types";

export class CachedLazyProvider<T> {

    readonly options: CachedProviderOptions<T> & Required<Pick<CachedProviderOptions<T>, "onEvent">>

    cacheHolder?: {
        readonly obj: T
        readonly cachedAt: Date
    }

    lastAccessed?: Date

    constructor(options: CachedProviderOptions<T>) {
        this.options = {
            onEvent: () => {
            },
            ...options
        }
    }

    async get(): Promise<T> {
        const o = this._getOrUpdateThenEmit("get")
        this.lastAccessed = new Date()
        return o
    }

    async update(): Promise<void> {
        await this._getOrUpdateThenEmit("update")
    }

    private _timeToLive(type: MethodType): number {
        const ttl = type === "get"
            ? this.options.ttl
            : (this.options.autoUpdater?.ttl ?? this.options.ttl)
        return typeof ttl === 'number'
            ? ttl
            : ttl({
                lastAccessed: this.lastAccessed,
                lastUpdated: this.cacheHolder?.cachedAt
            })
    }

    private _timeUntilExpire(type: MethodType): number {
        const lastUpdated = this.cacheHolder?.cachedAt
        if (lastUpdated === undefined) {
            return -1
        }
        const elapsed = new Date().getTime() - lastUpdated.getTime()
        return this._timeToLive(type) - elapsed
    }

    private _isExpired(type: MethodType): boolean {
        return this._timeUntilExpire(type) <= 0
    }

    private async _getOrUpdateThenEmit(methodType: MethodType): Promise<T> {
        const requestAt = new Date()
        const eventType = await this._getOrUpdate(methodType)
        const responseAt = new Date()
        const {obj, cachedAt} = this.cacheHolder!
        this.options.onEvent({
            eventType, methodType,
            requestAt, responseAt, cachedAt
        })
        return obj
    }

    private async _getOrUpdate(type: MethodType): Promise<EventType> {
        if (!this._isExpired(type) && this.cacheHolder) {
            return "hitA"
        }
        return synchronized(this)(
            async () => {
                if (!this._isExpired(type) && this.cacheHolder) {
                    return "hitS"
                }
                // Update Cache
                this.cacheHolder = {
                    obj: await this.options.provider(),
                    cachedAt: new Date()
                }
                return "miss"
            }
        )
    }
}
