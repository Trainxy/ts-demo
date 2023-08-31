import {
    DynamicModule,
    Module,
    ModuleMetadata,
    Provider,
    Type,
} from '@nestjs/common';
import { COS_MODULE_OPTIONS } from './constants/cos-module.constant';
import { CosOptionsFactory } from './constants/cos-options.factory';
import { CosModuleOption } from './interfaces';
import { CosProvider } from './providers/cos.provider';
import { ClientService } from './services/client.service';

export interface CosModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useFactory?: (...args: any[]) => Promise<CosModuleOption> | CosModuleOption;
    useClass?: Type<CosOptionsFactory>;
    useExisting?: Type<CosOptionsFactory>;
    inject?: any[];
}

@Module({})
export class CosModule {
    static forRootAsync(options: CosModuleAsyncOptions): DynamicModule {
        return {
            module: CosModule,
            imports: options.imports || [],
            providers: [
                ...CosModule.createAsyncCosOptionProviders(options),
                ClientService,
                CosProvider,
            ],
            exports: [CosProvider],
        };
    }

    private static createAsyncCosOptionProviders(
        options: CosModuleAsyncOptions,
    ): Provider[] {
        if (options) {
            if (options.useFactory) {
                return [
                    {
                        provide: COS_MODULE_OPTIONS,
                        useFactory: options.useFactory,
                        inject: options.inject || [],
                    },
                ];
            } else {
                const useClass = options.useClass as Type<CosOptionsFactory>;
                const providers: Provider[] = [
                    {
                        provide: COS_MODULE_OPTIONS,
                        useFactory: async (
                            optionsFactory: CosOptionsFactory,
                        ): Promise<CosModuleOption> =>
                            optionsFactory.createCosOptions(),
                        inject: [options.useExisting || options.useClass],
                    },
                ];
                if (useClass) {
                    providers.push({
                        provide: useClass,
                        useClass,
                    });
                }
                return providers;
            }
        } else {
            return [
                {
                    provide: COS_MODULE_OPTIONS,
                    useValue: {},
                },
            ];
        }
    }
}
