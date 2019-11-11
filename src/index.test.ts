import { rng, GetDefaultGenerator, GetLCG, RngProvider } from '.';
import { Observe, Validate } from '@azleur/stats';

const SAMPLES = 8000;

test("GetDefaultGenerator(): rng returns a random number generator that provides uniform values in the range [0, 1)", () => {
    const generator: rng = GetDefaultGenerator();
    let stats = Observe(() => generator(), SAMPLES);
    expect(
        Validate(stats, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 1 / 12, })
    ).toBe(true);
});

// TODO: Test LCG and seeding.
test("GetLCG(seed?: number): rng returns a seeded linear congruential generator that provides uniform values in the range [0, 1)", () => {
    const seeded1 = GetLCG(1234567);
    const seeded2 = GetLCG(1234567);
    const seeded3 = GetLCG(1234567);
    const seeded4 = GetLCG(1234567);
    const seeded5 = GetLCG(7654321);

    const unseeded1 = GetLCG();
    const unseeded2 = GetLCG();
    const unseeded3 = GetLCG();

    // LCG supplies uniform floats in [0, 1).
    const stats1 = Observe(seeded1, SAMPLES);
    expect(
        Validate(stats1, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 1 / 12, })
    ).toBe(true);

    // Same seed returns same numbers.
    for (let i = 0; i < SAMPLES; i++) {
        expect(seeded2()).toBe(seeded3());
    }

    // Different seeds are uncorrelated.
    const stats2 = Observe(() => (seeded4() - seeded5()), SAMPLES);
    expect(
        Validate(stats2, { tolerance: 0.1, mean: 0, min: -1, max: +1 })
    ).toBe(true);

    // Unseeded is also uniform in [0, 1).
    const stats3 = Observe(unseeded1, SAMPLES);
    expect(
        Validate(stats3, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 1 / 12, })
    ).toBe(true);

    // Different unseeded values are uncorrelated.
    const stats4 = Observe(() => (unseeded2() - unseeded3()), SAMPLES);
    expect(
        Validate(stats4, { tolerance: 0.1, mean: 0, min: -1, max: +1 })
    ).toBe(true);
});

test('RngProvider.Bernoulli(p?: number): boolean implements the Bernoulli distribution with P(true)=p (default 0.5)', () => {
    const provider = new RngProvider();
    let stats = Observe(() => (provider.Bernoulli() ? 1 : 0), SAMPLES);
    expect(
        Validate(stats, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 0.25, })
    ).toBe(true);
    for (let p = 0.1; p <= 0.9; p += 0.2) {
        stats = Observe(() => (provider.Bernoulli(p) ? 1 : 0), SAMPLES);
        expect(
            Validate(stats, { tolerance: 0.1, mean: p, min: 0, max: 1, })
        ).toBe(true); // No idea about variance.
    }
});

test('RngProvider.UniformInt(?): number variants provide discrete uniform samples, with optional min and max settings', () => {
    // No params: [0, MAX_SAFE_INTEGER).
    const provider = new RngProvider();
    let stats = Observe(() => provider.UniformInt(), SAMPLES);
    // Positive values.
    expect(stats.mean >= 0).toBe(true);
    expect(stats.variance >= 0).toBe(true);
    expect(stats.min >= 0).toBe(true);
    expect(stats.max >= 0).toBe(true);
    // Integer values.
    expect(Math.floor(stats.min)).toBe(stats.min);
    expect(Math.floor(stats.max)).toBe(stats.max);

    // One param: [0, n).
    for (let n = 10; n < 30; n += 5) {
        stats = Observe(() => provider.UniformInt(n), SAMPLES);
        expect(
            Validate(
                stats,
                { tolerance: 0.1 * n, mean: (n - 1) / 2, min: 0, max: n - 1, variance: (n * n - 1) / 12, }
            )
        ).toBe(true);
        expect(Math.floor(stats.min)).toBe(stats.min);
        expect(Math.floor(stats.max)).toBe(stats.max);
    }

    // Two params: [min, max].
    for (let min = -20; min <= 20; min += 10) {
        for (let width = 4; width <= 19; width += 3) {
            let max = min + width;
            stats = Observe(() => provider.UniformInt(min, max), SAMPLES);
            expect(
                Validate(
                    stats,
                    {
                        tolerance: 0.1 * width,
                        mean: min + 0.5 * width,
                        min: min,
                        max: max,
                        variance: ((width + 1) * (width + 1) - 1) / 12,
                    }
                )
            ).toBe(true);
            expect(Math.floor(stats.min)).toBe(stats.min);
            expect(Math.floor(stats.max)).toBe(stats.max);
        }
    }
});

test('RngProvider.Uniform(?): number variants provide continuous uniform samples, with optional min and max settings', () => {
    // No params: [0, 1).
    const provider = new RngProvider();
    let stats = Observe(() => provider.Uniform(), SAMPLES);
    expect(
        Validate(stats, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 1 / 12, })
    ).toBe(true);

    // One param: [0, x).
    for (let x = 3.5; x <= 7.5; x += 2 / 3) {
        stats = Observe(() => provider.Uniform(x), SAMPLES);
        expect(
            Validate(stats, { tolerance: 0.1 * x, mean: x / 2, min: 0, max: x, variance: x * x / 12, })
        ).toBe(true);
    }

    // Two params: [min, max).
    for (let min = -6; min <= +6; min += 1.5) {
        for (let width = 1 / 3; width <= 5 / 3; width += 1 / 3) {
            let max = min + width;
            stats = Observe(() => provider.Uniform(min, max), SAMPLES);
            expect(
                Validate(
                    stats,
                    {
                        tolerance: 0.1 * width,
                        mean: min + 0.5 * width,
                        min: min,
                        max: max,
                        variance: width * width / 12,
                    }
                )
            ).toBe(true);
        }
    }
});

test('RngProvider.Dice(dice: number, faces: number): number returns the result of rolling NdM, for N = dice, M = faces', () => {
    const provider = new RngProvider();
    for (let dice = 1; dice <= 5; dice++) {
        for (let faces = 1; faces <= 8; faces++) {
            let sample = provider.Dice(dice, faces);
            expect(Math.floor(sample)).toBe(sample); // Integers.
            let stats = Observe(() => provider.Dice(dice, faces), SAMPLES);
            expect(
                Validate(
                    stats,
                    {
                        tolerance: 0.1 * dice * faces,
                        mean: (dice * (faces + 1)) / 2,
                        min: dice,
                        max: dice * faces,
                        variance: dice * (faces * faces - 1) / 12
                    }
                )
            ).toBe(true);
        }
    }
});

test('RngProvider.Bates(min: number, max: number, n?: number): number returns a sample from the Bates distribution with parameter n, rescaled to [min, max)', () => {
    const provider = new RngProvider();
    for (let min = -2; min <= 7; min += 3) {
        for (let width = 1; width < 2.5; width += 0.5) {
            const max = min + width;
            for (let n = 1; n <= 4; n++) {
                let stats = Observe(() => provider.Bates(min, max, n), SAMPLES);
                expect(
                    Validate(
                        stats,
                        {
                            tolerance: 0.1 * width,
                            mean: min + 0.5 * width,
                            min: min,
                            max: max,
                            variance: (width * width) / (12 * n),
                        }
                    )
                ).toBe(true);
            }
        }
    }
});
