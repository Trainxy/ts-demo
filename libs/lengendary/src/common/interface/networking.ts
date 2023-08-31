import { ProxyProtocol } from '../enum/networking';

export interface IProxy {
    host: string;
    port: number;
    protocol: ProxyProtocol;
    auth?: {
        user: string;
        password: string;
    };
}
