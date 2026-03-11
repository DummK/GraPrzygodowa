import {PlayerState} from "../enums/PlayerState";
import {ItemType} from "../enums/ItemType";

export interface PlayerChoice {
    id: number;
    description: string;
    nextSceneId?: number;
    stateEffect?: PlayerState;
    itemReward?: ItemType;
    requiredState?: PlayerState[];
    requiredItems?: ItemType[];
}