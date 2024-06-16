import {ObjectIdMapper} from "./ObjectIdMapper";
import {Synchronizer} from "./Synchronizer";

const s = new Synchronizer()
const i = new ObjectIdMapper({
    idDecorator: (obj: Object, uniqueId: string) => `<ObjectIdMapperRef:${uniqueId}>`
})

export function synchronized(key: string | Object) {
    return function <T>(cb: () => Promise<T>) {
        return s.synchronized<T>({
            key: key instanceof Object ? i.getId(key) : key,
            cb
        })
    }
}
