import {Synchronizer} from "../src/Synchronizer";

describe("Synchronizer", () => {
    test('with different key', async () => {
        const s = new Synchronizer()
        const result: number[] = []
        const promises: Promise<number>[] = []
        const max = 10
        for (let i = 0; i < max; i++) {
            promises.push(s.synchronized({
                key: `${i}`,
                cb: async () => {
                    await new Promise(r => setTimeout(r, (max - i) * 10))
                    result.push(i)
                    return i
                }
            }))
        }
        // Without sync, result comes back in different order
        expect(await Promise.all(promises)).not.toEqual(result)
    });

    test('with same key', async () => {
        const s = new Synchronizer()
        const result: number[] = []
        const promises: Promise<number>[] = []
        const max = 10
        for (let i = 0; i < max; i++) {
            promises.push(s.synchronized({
                key: `sameKey`,
                cb: async () => {
                    await new Promise(r => setTimeout(r, (max - i) * 10))
                    result.push(i)
                    return i
                }
            }))
        }
        // With sync, result comes back in same order
        expect(await Promise.all(promises)).toEqual(result)
    });

})