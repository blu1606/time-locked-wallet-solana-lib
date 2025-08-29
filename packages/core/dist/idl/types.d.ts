export declare const IDL: {
    address: string;
    metadata: {
        name: string;
        version: string;
        spec: string;
        description: string;
    };
    instructions: ({
        name: string;
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
                program?: undefined;
            };
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            signer: boolean;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    path: string;
                    value?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
                program: {
                    kind: string;
                    value: number[];
                };
            };
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            pda?: undefined;
            signer?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
        returns?: undefined;
    } | {
        name: string;
        discriminator: number[];
        accounts: ({
            name: string;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
            };
            signer?: undefined;
            relations?: undefined;
        } | {
            name: string;
            signer: boolean;
            relations: string[];
            pda?: undefined;
        })[];
        args: never[];
        returns: {
            defined: {
                name: string;
            };
        };
    } | {
        name: string;
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
            };
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            signer: boolean;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            pda?: undefined;
            signer?: undefined;
        })[];
        args: ({
            name: string;
            type: string;
        } | {
            name: string;
            type: {
                defined: {
                    name: string;
                };
            };
        })[];
        returns?: undefined;
    } | {
        name: string;
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
                program?: undefined;
            };
            signer?: undefined;
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            signer: boolean;
            relations: string[];
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda?: undefined;
            signer?: undefined;
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    path: string;
                    value?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
                program: {
                    kind: string;
                    value: number[];
                };
            };
            signer?: undefined;
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            pda?: undefined;
            signer?: undefined;
            relations?: undefined;
        })[];
        args: never[];
        returns?: undefined;
    })[];
    accounts: {
        name: string;
        discriminator: number[];
    }[];
    errors: {
        code: number;
        name: string;
        msg: string;
    }[];
    types: ({
        name: string;
        type: {
            kind: string;
            variants: {
                name: string;
            }[];
            fields?: undefined;
        };
    } | {
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: string;
            } | {
                name: string;
                type: {
                    defined: {
                        name: string;
                    };
                };
            })[];
            variants?: undefined;
        };
    })[];
};
export type TimeLockWallet = any;
