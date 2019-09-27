/** Pseudo-random number generator. Should return values in the [0, 1) range equiprobably. */
export declare type rng = () => number;
/** Create and optionally seed an rng. */
export declare type RngCreator = (seed?: number) => rng;
/** Returns the default unseeded rng (Math.random). */
export declare const GetDefaultGenerator: RngCreator;
/** Returns a seeded Linear Congruential Generator. */
export declare const GetLCG: RngCreator;
/** Wrapper around the rng type that provides different distributions and utilities. */
export declare class RngProvider {
    generator: rng;
    constructor(generator?: rng);
    /** Returns true with probability p (default 0.5). */
    Bernoulli(p?: number): boolean;
    /** Returns a random integer in the range [0, MAX_SAFE_INTEGER). */
    UniformInt(): number;
    /** Returns a random integer in the range [0, n). */
    UniformInt(n: number): number;
    /** Returns a random integer in the range [min, max]. */
    UniformInt(min: number, max: number): number;
    /** Returns a random float in the range [0, 1). */
    Uniform(): number;
    /** Returns a random float in the range [0, x). */
    Uniform(x: number): number;
    /** Returns a random float in the range [min, max). */
    Uniform(min: number, max: number): number;
    /** Returns */
    Dice: (dice: number, faces: number) => number;
    Bates: (min: number, max: number, n?: number) => number;
}
