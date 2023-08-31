import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CustomLogger = createParamDecorator(
    (key: string, context: ExecutionContext) => {
        console.log(key, context);
    },
);
