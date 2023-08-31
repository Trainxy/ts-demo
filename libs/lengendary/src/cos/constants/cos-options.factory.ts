import { CosModuleOption } from '../interfaces';

export interface CosOptionsFactory {
    createCosOptions(): Promise<CosModuleOption> | CosModuleOption;
}
