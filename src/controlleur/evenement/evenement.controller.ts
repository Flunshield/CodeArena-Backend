import {Controller, Get, HttpStatus, Res, UseGuards} from '@nestjs/common';
import {Roles} from '../auth/auth.controller';
import {ADMIN, ENTREPRISE, USER} from '../../constantes/contante';
import {RolesGuard} from '../../guards/roles.guard';
import {Event} from '../../interfaces/userInterface';
import {EvenementService} from '../../services/evenement/evenement.service';

@Controller('evenement')
export class EvenementController {
    constructor(private readonly evenementService: EvenementService) {
    }

    @Get('/findEvents')
    @Roles(USER, ADMIN, ENTREPRISE)
    @UseGuards(RolesGuard)
    async findTournaments(@Res() response) {
        try {
            const events: Event[] = await this.evenementService.findEvent();
            if (events) {
                response.send(events);
            } else {
                response.send(HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            console.log(error);
        }
    }
}
