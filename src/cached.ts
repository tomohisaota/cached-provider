import {CachedProvider} from "./CachedProvider";
import {CachedProviderOptions} from "./types";

export function cached<T>(option: CachedProviderOptions<T>) {
    const p = new CachedProvider(option)
    return function () {
        return p.get()
    }
}