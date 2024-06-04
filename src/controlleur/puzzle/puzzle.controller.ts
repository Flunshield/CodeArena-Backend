/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/auth.controller";
import { ADMIN, ENTREPRISE } from "../../constantes/contante";
import { RolesGuard } from "../../guards/roles.guard";
import { PuzzleService } from "../../services/puzzle/puzzle.service";
import { puzzlesEntreprise } from "@prisma/client";

@Controller("puzzle")
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {
  }

  @Post("/create")
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async createPuzzle(@Body() data, @Req() request, @Res() response) {
    try {
      const create = await this.puzzleService.createPuzzle(data.data);
      response.send(create);
    } catch (error) {
      console.log(error);
    }
  }

  @Get("/findPuzzles")
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async findPuzzles(@Res() response, @Query("id") id: string,
                    @Query("page") page: number) {
    try {
      const puzzles: puzzlesEntreprise[] =
        await this.puzzleService.findPuzzles(id, page);
      if (puzzles.length > 0) {
        response.send(puzzles);
      } else {
        response.send([]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Patch("/updatePuzzle")
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async updatePuzzle(@Body() updatePuzzleDto, @Res() response) {
    try {
      const updatedPuzzle =
        await this.puzzleService.updatePuzzlePartially(updatePuzzleDto);
      if (updatedPuzzle) {
        response.json(updatedPuzzle);
      } else {
        response.status(HttpStatus.NOT_FOUND).send("Puzzle not found");
      }
    } catch (error) {
      console.error(error);
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send("Internal Server Error");
    }
  }

  @Delete("deletePuzzle")
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async deletePuzzle(@Body() data, @Res() response) {
    try {
      const result = await this.puzzleService.deletePuzzle(data.puzzleId);
      if (result) {
        response.send();
      } else {
        response.status(HttpStatus.NOT_FOUND).send("Puzzle not found");
      }
    } catch (error) {
      console.error("Delete Puzzle Error:", error);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error deleting puzzle" });
    }
  }

  @Delete("deletePuzzleSend")
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async deletePuzzleSend(@Body() data, @Res() response) {
    try {
      const result = await this.puzzleService.deletePuzzleSend(data.puzzleId);
      if (result) {
        response.send();
      } else {
        response.sendStatus(HttpStatus.NOT_FOUND).send("Puzzle not found");
      }
    } catch (error) {
      console.error("Delete Puzzle Error:", error);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error deleting puzzle" });
    }
  }

  @Get("/countPuzzles")
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async countPuzzles(@Res() response, @Query("id") id: string) {
    try {
      const puzzlesPlayed = await this.puzzleService.countPuzzlesPlayed(id);
      const puzzleCreate = await this.puzzleService.countPuzzlesCreated(id);
      if (puzzlesPlayed !== null && puzzlesPlayed !== undefined && puzzleCreate !== null && puzzleCreate !== undefined) {
        response.send({ puzzlesPlayed: puzzlesPlayed, puzzleCreate: puzzleCreate });
      } else {
        response.status(404).send("No puzzles found.");
      }
    } catch (error) {
      console.log(error);
    }
  }

}
