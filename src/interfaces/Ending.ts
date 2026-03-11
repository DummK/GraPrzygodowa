import {PlayerState} from "../enums/PlayerState";
import {ItemType} from "../enums/ItemType";

export interface Ending {
    id: number;
    title: string;
    description: string;
    requiredState?: PlayerState[];
    requiredItems?: ItemType[];
}