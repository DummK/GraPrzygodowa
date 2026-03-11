import {PlayerState} from "../enums/PlayerState";

export interface Player {
    name: string;
    states: PlayerState[];
    inventory: number[]; //id itemów
    currentSceneId: number;
}