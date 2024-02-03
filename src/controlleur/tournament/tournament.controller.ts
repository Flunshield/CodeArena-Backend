import {Controller, Get, Res} from '@nestjs/common';
import {TournamentService} from '../../services/tournament/TournamentService';
import {Tournament} from '../../interfaces/userInterface';

@Controller('tournament')
export class TournamentController {
    constructor(private readonly tournamentService: TournamentService) {
    }

    @Get('/findTournaments')
    async findTournaments(@Res() response) {
        try {
            const getAllTournaments: Tournament[] =
                await this.tournamentService.findNextTenTournament();
            if (getAllTournaments) {
                response.send(getAllTournaments);
            } else {
                console.log('getAllTournaments');
            }
        } catch (error) {
            console.log(error);
        }
    }
}
