import {getTimeToLive, isValid} from "../src/CachedLazyProvider";

describe("getTimeToLive", () => {
    test('static value', async () => {
        expect(getTimeToLive<number>({
            ttl: 100,
            holder: {
                cachedObj: 1,
                cachedAt: new Date()
            }
        })).toEqual(100)
    });

    test('dynamic value', async () => {
        expect(getTimeToLive<number>({
            ttl: () => 200,
            holder: {
                cachedObj: 1,
                cachedAt: new Date()
            }
        })).toEqual(200)
    });

    test('parameters for ttl callback', async () => {
        const cachedObjRef = 123
        const nowRef = new Date().getTime()
        const cachedAtRef = new Date(nowRef - 10000)// assign different value
        const accessedAtRef = new Date(nowRef - 20000) // assign different value
        getTimeToLive<number>({
            ttl: ({
                      cachedObj,
                      cachedAt,
                      accessedAt,
                      now,
                      sinceCachedAt,
                      sinceAccessedAt,
                  }) => {
                expect(cachedObj).toEqual(cachedObjRef)
                expect(cachedAt).toEqual(cachedAtRef)
                expect(accessedAt).toEqual(accessedAtRef)
                expect(now).toEqual(nowRef)
                expect(sinceCachedAt).toEqual(now - cachedAt.getTime())
                expect(sinceAccessedAt).toEqual(now - accessedAt!.getTime())
                return 200
            },
            holder: {
                cachedObj: cachedObjRef,
                cachedAt: cachedAtRef,
            },
            now: nowRef,
            accessedAt: accessedAtRef,
        })
    });
})

describe("isValid", () => {
    test('without cachedObj', async () => {
        expect(isValid<number>({
            ttl: 100,
        })).toBeFalsy()
    })

    test('with different timing', async () => {
        const now = new Date().getTime()
        const ttl = 100
        expect(isValid<number>({
            ttl,
            holder: {
                cachedObj: 1,
                cachedAt: new Date(now),
            },
            now
        })).toBeTruthy()

        expect(isValid<number>({
            ttl,
            holder: {
                cachedObj: 1,
                cachedAt: new Date(now - ttl / 2),
            },
            now
        })).toBeTruthy()

        expect(isValid<number>({
            ttl,
            holder: {
                cachedObj: 1,
                cachedAt: new Date(now - ttl),
            },
            now
        })).toBeTruthy()

        // TTL has passed

        expect(isValid<number>({
            ttl,
            holder: {
                cachedObj: 1,
                cachedAt: new Date(now - ttl - 1),
            },
            now
        })).toBeFalsy()

        expect(isValid<number>({
            ttl,
            holder: {
                cachedObj: 1,
                cachedAt: new Date(now - ttl * 2),
            },
            now
        })).toBeFalsy()
    })
})