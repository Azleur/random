import { Interpolate } from '@azleur/math-util';

/** Pseudo-random number generator. Should return values in the [0, 1) range equiprobably. */
export type rng = () => number;
/** Create and optionally seed an rng. */
export type RngCreator = (seed?: number) => rng; // TODO: Consider changing to "any number and type of args".

/** Alias for the default unseeded rng (Math.random). */
const defaultGenerator: rng = Math.random;

/** Returns the default unseeded rng (Math.random). */
export const GetDefaultGenerator: RngCreator = () => defaultGenerator;
/** Returns a seeded Linear Congruential Generator. */
export const GetLCG: RngCreator = (seed?: number) => {
    const m = 1 << 31 - 1;
    const a = 48271;
    let state: number = 0;
    if (seed) { // Undefined or 0, which would also be unusable as a seed.
        state = seed;
    } else {
        // TODO: Test and review all this seeding. Maybe abstract into separate function.
        const half = Math.floor(m / 2);
        const timeSeed = Date.now() % half;
        const jsSeed = a * Math.random() % half;
        state = (timeSeed + jsSeed) % m;
        if (state <= 0) {
            state += (m - 1);
        }
    }
    return () => {
        state = (state * a) % m;
        return state / m; // This is probably statistically problematic.
    };
}
// TODO: Add more generators.

// TODO: Write tests.
// TODO: Write docs.

/** Wrapper around the rng type that provides different distributions and utilities. */
export class RngProvider {
    generator: rng;
    constructor(generator?: rng) {
        this.generator = generator || defaultGenerator;
    }

    /** Returns true with probability p (default 0.5). */
    Bernoulli(p: number = 0.5): boolean {
        return this.generator() < p;
    }

    /** Returns a random integer in the range [0, MAX_SAFE_INTEGER). */
    UniformInt(): number;
    /** Returns a random integer in the range [0, n). */
    UniformInt(n: number): number;
    /** Returns a random integer in the range [min, max]. */
    UniformInt(min: number, max: number): number;
    UniformInt(a?: number, b?: number): number {
        if (b == undefined) {
            if (a == undefined) {
                // UniformInt() => Range [0, MAX_INT).
                return Math.floor(this.generator() * Number.MAX_SAFE_INTEGER);
            } else {
                // UniformInt(n) => Range [0, n).
                return Math.floor(this.generator() * a);
            }
        } else {
            if (a == undefined) {
                // UniformInt(undefined, b) => Bullshit.
                throw new Error('Bad arguments on UniformInt');
            } else {
                // UniformInt(min, max) => Range [min, max].
                return Math.floor(Interpolate(a, b + 1, this.generator()));
            }
        }
    };

    /** Returns a random float in the range [0, 1). */
    Uniform(): number;
    /** Returns a random float in the range [0, x). */
    Uniform(x: number): number;
    /** Returns a random float in the range [min, max). */
    Uniform(min: number, max: number): number;
    Uniform(a?: number, b?: number): number {
        if (b == undefined) {
            if (a == undefined) {
                // Uniform() => Range [0, 1).
                return this.generator();
            } else {
                // Uniform(x) => Range [0, x).
                return this.generator() * a;
            }
        } else {
            if (a == undefined) {
                // Uniform(undefined, b) => Bullshit.
                throw new Error('Bad arguments on Uniform');
            } else {
                // Uniform(min, max) => Range [min, max).
                return Interpolate(a, b, this.generator());
            }
        }
    };

    /**
     * Returns the result of a dice roll with the provided values.
     *
     * The underlying distribution is the sum of 'dice' independent discrete uniform random variables, each in the range [1, 'faces'].
     */
    Dice(dice: number, faces: number): number {
        let accumulator = 0;
        for (let i = 0; i < dice; i++) {
            accumulator += 1 + this.UniformInt(faces);
        }
        return accumulator;
    };

    /**
     * Returns a random number in the range [min, max), with bell-shaped probability distribution.
     *
     * Calculates a sample of the Bates distribution with parameter n, and then rescales it to the range [min, max).
     */
    Bates(min: number, max: number, n: number = 4) {
        let accumulator = 0;
        for (let i = 0; i < n; i++) {
            accumulator += this.generator(); // Equiv. Uniform(0, 1).
        }
        return Interpolate(min, max, accumulator / n);
    };
}
