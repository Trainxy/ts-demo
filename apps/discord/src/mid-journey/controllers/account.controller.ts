import { Body, Controller, Post } from '@nestjs/common';
import { MidJourneyService } from '../mid-journey.service';
import { SaveAccountDto, SaveAccountResultDto } from '../dto';

@Controller('mj/account')
export class MidjourneyAccountController {
    constructor(private readonly midjourneyService: MidJourneyService) {}

    @Post('save')
    public async saveAccount(
        @Body() saveAccountDto: SaveAccountDto,
    ): Promise<SaveAccountResultDto> {
        return {
            success: true,
        };
    }
}
