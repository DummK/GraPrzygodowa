import {PlayerState} from "../enums/PlayerState";
import {ItemType} from "../enums/ItemType";
import {Locations} from "../enums/Locations";

export interface Scene {
    id: number;
    title: string;
    description: string;
    location: Locations;
    choices: number[];          // ID wyborów
    requiredItems?: ItemType[];
    isEnding?: boolean;
}