export interface IEmailAccountConfig {
    name: string;
    password: string;
    domain: string;
    url: string;
    host?: {
        pop: string;
    };
}

export interface IPop3Config {
    host: string;
    user: string;
    password: string;
    port?: number;
    tls?: boolean;
}
