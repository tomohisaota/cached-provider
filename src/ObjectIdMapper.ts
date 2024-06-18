type IdGenerator = (obj: Object) => string
type IdDecorator = (obj: Object, uniqueId: string) => string

/*
Assign Unique ID to JavaScript Object
WeakMap will keep the key as long as the Object is alive
 */

export class ObjectIdMapper {
    readonly idGenerator: IdGenerator
    readonly idDecorator: IdDecorator

    protected readonly idMap = new WeakMap<WeakKey, string>();
    seq = 0

    constructor(args?: {
                    idGenerator?: IdGenerator,
                    idDecorator?: IdDecorator,
                }
    ) {
        this.idGenerator = args?.idGenerator ?? (() => {
            return `seqId<${this.seq++}>`
        })
        this.idDecorator = args?.idDecorator ?? ((_: Object, uniqueId: string) => {
            return uniqueId
        })
    }

    getId(obj: Object) {
        let objectId = this.idMap.get(obj);
        if (objectId) {
            return objectId
        }
        // Assign Unique ID
        objectId = this.idDecorator(obj, this.idGenerator(obj))
        this.idMap.set(obj, objectId)
        return objectId
    }
}

