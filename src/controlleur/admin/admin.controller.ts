import {
  Body,
  Controller,
  Delete,
  Get, Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/auth.controller';
import { ADMIN } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { UserService } from '../../services/user/user.service';
import { AdminService } from '../../services/admin/admin.service';

@Controller('admin')
export class AdminController {
  /**
   * Crée une instance du contrôleur utilisateur.
   *
   * @param userService - Le service utilisateur utilisé pour gérer les opérations liées aux utilisateurs.
   * @param adminService
   */
  constructor(
    private readonly userService: UserService,
    private readonly adminService: AdminService,
  ) {}

  @Get('/getRanks')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async getRanks(@Req() request, @Res() response) {
    try {
      const ranks = await this.userService.getRanks();
      response.send(ranks);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/getUsers')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async getUsers(@Query('page') page: string, @Req() request, @Res() response) {
    try {
      const users = await this.userService.getUsers(parseInt(page));
      response.send(users);
    } catch (error) {
      console.log(error);
    }
  }

  @Post('/updateTitles')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async updateTitles(@Body() data, @Req() request, @Res() response) {
    const title = data.data;
    try {
      const update = await this.adminService.updateTitle(title);
      response.send(update);
    } catch (error) {
      console.log(error);
    }
  }

  @Post('/createTitles')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async createTitles(@Body() data, @Req() request, @Res() response) {
    const title = data.data;
    try {
      const create = await this.adminService.createTitles(title);
      response.send(create);
    } catch (error) {
      console.log(error);
    }
  }

  @Delete('/deleteTitle')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async deleteTitle(@Body() data, @Res() response): Promise<void> {
    const deleteTitle = await this.adminService.deleteTitle(data.title);
    response.send(deleteTitle);
  }

  @Delete('/deleteUser')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async deleteUser(@Body() data, @Res() response): Promise<void> {
    const deleteUser = await this.adminService.deleteUser(data.user);
    response.send(deleteUser);
  }

  @Patch("/resetPoints")
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async patchPointsUser(@Body() data, @Res() response): Promise<void> {
    const patchPointsUser = await this.adminService.patchPointsUser(data.user);
    response.send(patchPointsUser);
  }
}
